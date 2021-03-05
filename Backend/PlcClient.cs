using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Backend.Plc;
using Backend.Plc.PlcTypes;
using Dapper;
using OperationCanceledException = System.OperationCanceledException;
using Task = System.Threading.Tasks.Task;


public enum Status : short
{
    ERROR = 0b_00000000_00000001,
    WARNING = 0b_00000000_00000010,
    RESET = 0b_00000000_00000100,
    BUSY = 0b_00000000_00001000,
    CANCELED = 0b_00000000_00010000
}

public enum RequestTypes : short
{
    READY_ACCEPT_OPERATION = 1,
    WRITING_WEIGHT_TO_DB = 2,
    OPERATOR_CONFIRMATION = 3,
    WRITING_TO_DB_OPERATION = 4,
    BLOCK_ADDRESS = 5,
    UNBLOCK_ADDRESS = 6
}

namespace Backend
{
    public class AddressDefinition
    {
        [UsedForPlc] public long id { get; set; }
        [UsedForPlc] public AddressTypes type { get; set; }
        [UsedForPlc] public int x { get; set; }
        [UsedForPlc] public int y { get; set; }
        [UsedForPlc] public int z { get; set; }
    }

    public class Position
    {
        [UsedForPlc] public int X { get; set; }
        [UsedForPlc] public int Y { get; set; }
        [UsedForPlc] public int Z { get; set; }
    }

    public class PlcZone
    {
        //public static PlcClass<MessageCyclic> Info = new PlcClass<MessageCyclic>();

        public MessageCyclic Message;
        public MessageErrors MessageErrors;

        private readonly BlockingCollection<Request> _answersQueue;
        public readonly Id64 id;

        private readonly object _locker;

        public Position Position
        {
            get
            {
                lock (_locker)
                {
                    return new Position { X = Message.StackerPosition.X, Y = Message.StackerPosition.Y, Z = Message.StackerPosition.Z };
                }
            }
        }

        public uint[] Errors
        {
            get
            {
                var result = new uint[MessageErrors.ErrorsArraySizeInBytes / 4];
                lock (_locker)
                {
                    for (var i = 0; i < result.Length; i++)
                    {
                        result[i] = BitConverter.ToUInt32(MessageErrors.Errors, i * 4);
                    }
                }
                return result;
            }
        }

        public uint[] Warnings
        {
            get
            {
                var result = new uint[MessageErrors.WarningArraySizeInBytes / 4];
                lock (_locker)
                {
                    for (var i = 0; i < result.Length; i++)
                    {
                        result[i] = BitConverter.ToUInt32(MessageErrors.Warnings, i * 4);
                    }
                }
                return result;
            }
        }

        public short Address
        {
            get
            {
                lock (_locker)
                {

                    return Message.Address;
                }
            }
        }

        public short Progress
        {
            get
            {
                lock (_locker)
                {

                    return Message.Progress;
                }
            }
        }

        public Modes Mode
        {
            get
            {
                lock (_locker)
                {
                    return Message.Mode;
                }
            }
        }

        public PlcZone(Id64 zone)
        {
            Message = new MessageCyclic();
            MessageErrors = new MessageErrors();
            id = zone;
            _locker = new object();
            _answersQueue = new BlockingCollection<Request>(new ConcurrentQueue<Request>());
            Task.Run(Executor);
        }

        private void Executor()
        {
            foreach (var message in _answersQueue.GetConsumingEnumerable())
            {
                var busy = true;
                while (busy)
                {
                    try
                    {
                        using (var connection = Core.GetDbConnection())
                        {
                            connection.Open();
                            using var transaction = connection.BeginTransaction(System.Data.IsolationLevel.Serializable);
                            try
                            {
                                message.Execute(connection, transaction, id);
                                transaction.Commit();
                            }
                            catch
                            {
                                transaction.Rollback();
                                throw;
                            }
                        }
                        busy = false;
                    }
                    catch (Exception e)
                    {
                        Debug.WriteLine(e.Message);
                        Debug.WriteLine(e.StackTrace);
                    }
                }
            }
        }

        public void Update(MessageCyclic message)
        {
            lock (_locker)
            {
                switch (message.Type)
                {
                    case Messages.CURRENT_DATA:
                        {
                            if (Message.Progress != message.Progress)
                                Task.Run(() => { Core.Notify($"{{\"id\":\"devices\",\"update\":[\"{id}\",\"progress\"]}}"); });
                            if (Message.Mode != message.Mode)
                                Task.Run(() => { Core.Notify($"{{\"id\":\"devices\",\"update\":[\"{id}\",\"mode\"]}}"); });

                            if (Message.Status != message.Status || Message.Id != message.Id || Message.RequestType != message.RequestType)
                            {
                                if (Message.RequestType != message.RequestType)
                                {
                                    switch (message.RequestType)
                                    {
                                        case RequestTypes.WRITING_WEIGHT_TO_DB:
                                            _answersQueue.Add(new RequestWeight(message.Status, message.Id, message.RequestType, message.Weight));
                                            break;
                                        case RequestTypes.WRITING_TO_DB_OPERATION:
                                            _answersQueue.Add(new RequestOperation(message.Status, message.Id, message.RequestType, message.OperationId));
                                            break;
                                        case RequestTypes.READY_ACCEPT_OPERATION:
                                            _answersQueue.Add(new RequestStatus(message.Status, message.Id, message.RequestType));
                                            break;
                                        case RequestTypes.BLOCK_ADDRESS:
                                            _answersQueue.Add(new RequestLock(message.Status, message.Id, message.RequestType, message.OperationId, message.Address));
                                            break;
                                        case RequestTypes.UNBLOCK_ADDRESS:
                                            _answersQueue.Add(new RequestUnlock(message.Status, message.Id, message.RequestType, message.OperationId, message.Address));
                                            break;
                                        default:
                                            _answersQueue.Add(new RequestStatus(message.Status, message.Id, message.RequestType));
                                            break;
                                    }
                                }
                                else _answersQueue.Add(new RequestStatus(message.Status, message.Id, message.RequestType));
                            }

                            Message = message;
                        }
                        break;
                    default:
                        break;
                }
            }
        }

        public void Update(MessageErrors message)
        {
            lock (_locker)
            {
                var changeErrors = false;
                var changeWarnings = false;

                for (var i = 0; i < MessageErrors.ErrorsArraySizeInBytes; i++)
                {
                    if (MessageErrors.Errors[i] != message.Errors[i]) changeErrors = true;
                }

                for (var i = 0; i < MessageErrors.WarningArraySizeInBytes; i++)
                {
                    if (MessageErrors.Warnings[i] != message.Warnings[i]) changeWarnings = true;
                }

                if (changeErrors)
                    Task.Run(() => { Core.Notify($"{{\"id\":\"devices\",\"update\":[\"{id}\",\"errors\"]}}"); });
                if (changeWarnings)
                    Task.Run(() => { Core.Notify($"{{\"id\":\"devices\",\"update\":[\"{id}\",\"warnings\"]}}"); });
                MessageErrors = message;
            }
        }
    }

    public class PlcClient : IDisposable
    {
        private NetworkStream _stream;
        private readonly BlockingCollection<Message> _messagesQueue;

        private long _gettingStream;

        public readonly Dictionary<Id64, PlcZone> Zones;

        private CancellationTokenSource _source;
        private Task _taskReader;
        private Task _taskWriter;

        public PlcClient()
        {
            Zones = new Dictionary<Id64, PlcZone>();
            _messagesQueue = new BlockingCollection<Message>(new ConcurrentQueue<Message>());
            _source = null;
        }

        public void Init()
        {
            IEnumerable<Zone> result;
            using (var scope = new TransactionScope())
            {
                using var connection = Core.GetDbConnection();
                result = connection.Query<Zone>("SELECT zones.id FROM zones");
                scope.Complete();
            }

            var zonesArray = result as Zone[] ?? result.ToArray();
            foreach (var zone in zonesArray)
            {
                Console.WriteLine(zone.id);
                Zones[zone.id] = new PlcZone(zone.id);
            }
        }

        public void Dispose()
        {
            _messagesQueue.CompleteAdding();
            _messagesQueue.Dispose();
            _stream.Dispose();
        }

        private static async Task<byte[]> ReadFromStreamAsync(int nbytes, Stream stream, CancellationToken token)
        {
            var buffer = new byte[nbytes];
            var offset = 0;
            while (offset < nbytes)
            {
                offset += await stream.ReadAsync(buffer, offset, nbytes - offset, token);
            }
            return buffer;
        }

        public PlcZone GetZone(Id64 id)
        {
            return Zones[id];
        }

        public static byte[] Combine(byte[] first, byte[] second)
        {
            var bytes = new byte[first.Length + second.Length];
            Buffer.BlockCopy(first, 0, bytes, 0, first.Length);
            Buffer.BlockCopy(second, 0, bytes, first.Length, second.Length);
            return bytes;
        }

        public async Task Reader(NetworkStream stream, CancellationToken token)
        {
            Debug.WriteLine("Запуск PLC Reader");
            while (!token.IsCancellationRequested) {
                byte[] messageBytes;
                Message header;
                try {
                    var headerBytes = await ReadFromStreamAsync(PlcClass<Message>._Size, stream, token);
                    header = PlcClass<Message>.GetMessage(headerBytes);
                    switch (header.Type) {
                        case Messages.CURRENT_DATA: {
                                var bodyBytes = await ReadFromStreamAsync(PlcClass<MessageCyclic>._Size - PlcClass<Message>._Size, stream, token);
                                messageBytes = Combine(headerBytes, bodyBytes);
                            }
                            break;
                        case Messages.ERRORS_WARNINGS: {
                               var bodyBytes = await ReadFromStreamAsync(PlcClass<MessageErrors>._Size - PlcClass<Message>._Size, stream, token);
                               messageBytes = Combine(headerBytes, bodyBytes);
                            }
                            break;
                        case Messages.SERVICE:
                            {
                                var bodyBytes = await ReadFromStreamAsync(154 - PlcClass<Message>._Size, stream, token);
                            }
                            continue;
                        case Messages.AXIS_SERVICE:
                            {
                                var bodyBytes = await ReadFromStreamAsync(271 - PlcClass<Message>._Size, stream, token);
                            }
                            continue;
                        default: continue;
                    }

                }

                catch (OperationCanceledException) {
                    return;
                }
                catch (Exception e) {
                    Debug.WriteLine(
                        $"Reader() Exception{Environment.NewLine}{e.Message}{Environment.NewLine}{e.StackTrace}");
                    Task.Run(Connect);
                    return;
                }

                try
                {
                    switch (header.Type)
                    {
                        case Messages.CURRENT_DATA:
                            {
                                var message = PlcClass<MessageCyclic>.GetMessage(messageBytes);
                                Zones[message.Zone].Update(message);
                            }
                            break;
                        case Messages.ERRORS_WARNINGS:
                            {
                                var message = PlcClass<MessageErrors>.GetMessage(messageBytes);
                                Zones[message.Zone].Update(message);
                            }
                            break;
                    }
                }
                catch (Exception e) {
                    Debug.WriteLine(
                        $"Reader() Exception{Environment.NewLine}{e.Message}{Environment.NewLine}{e.StackTrace}");
                }

            }
        }

        public void AddMSg(Message message)
        {
            _messagesQueue.Add(message);
        }

        public async Task Writer(NetworkStream stream, CancellationToken token)
        {
            Debug.WriteLine("Запуск PLC Writer");
            try
            {
                foreach (var message in _messagesQueue.GetConsumingEnumerable(token))
                {
                    var buffer = message.GetBytes();
                    await stream.WriteAsync(buffer, 0, buffer.Length, token);
                }
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception e)
            {
                Debug.WriteLine($"Writer() Exception{Environment.NewLine}{e.Message}{Environment.NewLine}{e.StackTrace}");
                Task.Run(Connect);
            }
        }

        public async void Connect()
        {
            if (0 != Interlocked.Exchange(ref _gettingStream, 1)) return;
            if (_source != null)
            {
                _source.Cancel();
                _taskReader?.Wait();
                _taskWriter?.Wait();
                _source.Dispose();
            }
            _stream?.Dispose();
            var busy = true;
            Debug.WriteLine("Подключение к PLC");
            while (busy)
                try
                {
                    var tcpListener = TcpListener.Create(2002);
                    tcpListener.Start();
                    var tcpClient = await tcpListener.AcceptTcpClientAsync();
                    tcpListener.Stop();
                    _stream = tcpClient.GetStream();
                    Interlocked.Exchange(ref _gettingStream, 0);
                    busy = false;
                }
                catch (Exception e)
                {
                    Debug.WriteLine($"Connect() Exception{Environment.NewLine}{e.Message}{Environment.NewLine}{e.StackTrace}");
                }
            _source = new CancellationTokenSource();
            var token = _source.Token;
            _taskReader = Task.Run(() => { Reader(_stream, token); });
            _taskWriter = Task.Run(() => { Writer(_stream, token); });
        }
    }
}
