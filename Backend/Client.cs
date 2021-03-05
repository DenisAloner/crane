using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Backend.Gql;
using Backend.Gql.Types;
using Newtonsoft.Json;
using Task = System.Threading.Tasks.Task;

namespace Backend
{
    public class Client : IHasId, IDisposable
    {
        [JsonIgnore] private readonly HttpListenerContext _context;
        [JsonIgnore] private Stream _stream;
        [JsonIgnore] public readonly Session.Session _session;
        [JsonIgnore] public readonly int id;
        [JsonIgnore] private readonly BlockingCollection<byte[]> _messagesQueue;
        [JsonIgnore] private readonly object _lockObj = new object();
        [JsonIgnore] private bool _disposed = false;
        [JsonIgnore] private WebSocket _webSocket;

        // [JsonIgnore] private readonly BlockingCollection<byte[]> _messagesQueue;

       
        public object GetId => $"worker{id}";

        public string ip => _context.Request.RemoteEndPoint?.ToString();
        //public long GetSessionUser => _session.User;

        public Client(HttpListenerContext context, Session.Session session)
        {
            id = Core.IncrementWorkerCounter();
            _context = context;
            _session = session;
            _messagesQueue = new BlockingCollection<byte[]>(new ConcurrentQueue<byte[]>());
        }

        //public void KeepAlive()
        //{
        //    while (true)
        //    {
        //        //AddMSg(Encoding.UTF8.Bytes("event:keepAlive\ndata:\n\n"));
        //        Thread.Sleep(5000);
        //    }
        //}

        public async void Start()
        {
            try
            {
                var webSocketContext = await _context.AcceptWebSocketAsync("chat");
                _webSocket = webSocketContext.WebSocket;
                Task.Run(Reader);
                Task.Run(Writer);
                //Task.Run(KeepAlive);
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                Debug.WriteLine(e.StackTrace);
                Stop();
            }
        }

        public void Stop()
        {
            Debug.WriteLine($"[Отключение sse-worker {id}]");
            Core.RemoveWorker(this);
            Dispose();
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            lock (_lockObj)
            {
                if (_disposed) return;
                _disposed = true;
            }
            if (!disposing) return;
            _messagesQueue?.CompleteAdding();
            _messagesQueue?.Dispose();
            _stream?.Close();
            _stream?.Dispose();
        }

        ~Client()
        {
            Dispose(false);
        }

        public void AddMessage(byte[] message)
        {
            lock (_lockObj)
            {
                if (_disposed) return;
            }

            _messagesQueue.Add(message);
        }

        public async Task Writer()
        {
            try
            {
                foreach (var message in _messagesQueue.GetConsumingEnumerable())
                {
                    await _webSocket.SendAsync(new ArraySegment<byte>(message), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                Debug.WriteLine(e.StackTrace);
                Stop();
            }
        }

        public static async Task<string> ReceiveData(WebSocket ws)
        {
            var buffer = new ArraySegment<byte>(new byte[8192]);

            if (ws.State != WebSocketState.Open) throw new Exception("Client close");
            using (var ms = new MemoryStream())
            {
                WebSocketReceiveResult result;
                do
                {
                    result = await ws.ReceiveAsync(buffer, CancellationToken.None);
                    ms.Write(buffer.Array, buffer.Offset, result.Count);
                }
                while (!result.EndOfMessage);

                ms.Seek(0, SeekOrigin.Begin);

                using (var reader = new StreamReader(ms, Encoding.UTF8)) return reader.ReadToEnd();
            }
        }

        public async Task Reader()
        {
            try
            {
                while (true)
                {
                   var request = await ReceiveData(_webSocket);
                    Task.Run(() =>
                    {
                        AddMessage(Schema.Instance.Handle(request, _session));
                    });
                }
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                Debug.WriteLine(e.StackTrace);
                Stop();
            }
        }
    }
}