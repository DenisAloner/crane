using System;
using System.Diagnostics;
using System.Reflection;
using System.Runtime.ExceptionServices;
using System.Runtime.InteropServices;
using System.Threading;
using Backend;

namespace Integration
{

    public static class Connect1C
    {

        public enum StatusConnection1C : long
        {
            DISCONNECTED = 0,
            CONNECTING = 1,
            CONNECTED = 2
        }

        private static long _status;

        public static StatusConnection1C Status
        {
            get => (StatusConnection1C)Interlocked.Read(ref _status);
            set => Interlocked.Exchange(ref _status, (long)value);
        }

        private static dynamic _connector;
        private static dynamic _connection;
        private static dynamic _module;
        private static readonly object Locker;

        static Connect1C()
        {
            Locker = new object();
            Status = StatusConnection1C.DISCONNECTED;
            //Connect();
        }

        [HandleProcessCorruptedStateExceptions]
        public static void Connect()
        {
            if (Status == StatusConnection1C.CONNECTING) return;
            Status = StatusConnection1C.CONNECTING;
            lock (Locker)
            {
                Console.WriteLine("Инициализация соединения с 1С");
                try
                {
                    try
                    {
                        if (_module != null) Marshal.ReleaseComObject(_connection);
                        if (_connection != null) Marshal.ReleaseComObject(_connection);
                        if (_connector != null) Marshal.ReleaseComObject(_connector);

                    }
                    catch (Exception)
                    {
                        // ignored
                    }
                    finally
                    {
                        _module = null;
                        _connection = null;
                        _connector = null;
                    }
                    GC.Collect();
                    var type = Type.GetTypeFromProgID("V83.COMConnector", true);
                    _connector = Activator.CreateInstance(type);
                    _connection = _connector.GetType().InvokeMember("connect", BindingFlags.InvokeMethod, null,
                        _connector, new object[]
                        {
                               Core.Configuration.Integration1C.Connection
                        });
                    _module = _connection.GetType().InvokeMember("wms_arsenalum", BindingFlags.Public | BindingFlags.GetProperty | BindingFlags.Static, null, _connection, new object[]{
                        });
                    Status = StatusConnection1C.CONNECTED;
                    Console.WriteLine("Соединение с 1С установлено");
                }
                catch (Exception e)
                {
                    Status = StatusConnection1C.DISCONNECTED;
                    Debug.WriteLine(e.Message);
                    Debug.WriteLine(e.StackTrace);
                    Console.WriteLine("Соединение с 1С не установлено");
                }
            }
        }

        [HandleProcessCorruptedStateExceptions]
        public static bool Call(string input)
        {
            lock (Locker)
            {
                try
                {
                    var value = _module.GetType().InvokeMember("process_data", BindingFlags.InvokeMethod, null,
                        _module, new object[]
                        {
                            input
                        });
                    return (bool)value;
                }
                catch (Exception)
                {
                    Connect();
                    return false;
                }
            }
        }

    }
}
