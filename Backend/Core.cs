using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Backend.Plc;
using Dapper;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Npgsql;
using Npgsql.NameTranslation;
using Integration;
using Task = System.Threading.Tasks.Task;

namespace Backend {

    namespace MessageQueue
    {
        public class Message
        {
            public long id { get; set; }
            public string value { get; set; }
        }
    }

    public static class Core {
        public static readonly Settings Configuration;

        public static bool Running = false; // Is it running?

        private static HttpListener _listener;
        //private int _timeout = 1000; // Time limit for data transfers.
        private static readonly Dictionary<Guid, Session.Session> _sessions;
        public static Dictionary<string, Client> Clients;
        private static int _workerCounter;
        public static PlcClient PlcClient;

        // Content types that are supported by our server
        // You can add more...
        // To see other types: http://www.webmaster-toolkit.com/mime-types.shtml
        private static readonly Dictionary<string, string> Extensions = new Dictionary<string, string>
        { 
            //{ "extension", "content type" }
            { "htm", "text/html" },
            { "html", "text/html" },
            { "xml", "text/xml" },
            { "txt", "text/plain" },
            { "css", "text/css" },
            { "png", "image/png" },
            { "bmp", "image/bmp" },
            { "jpg", "image/jpg" },
            { "jpeg", "image/jpeg" },
            { "zip", "application/zip"},
            { "js", "application/x-javascript"},
            { "json", "application/json"},
            { "svg", "image/svg+xml"},
            { "ttf", "*/*"},
            { "otf", "*/*"},
            { "woff", "*/*"},
            { "stl", "application/sla"},
            { "glb", "model/gltf-binary"},
            { "ods", "application/vnd.oasis.opendocument.spreadsheet"}
        };

        static Core()
        {
            //PlcTypeMapper.RegisterType(typeof(Messages), sizeof(Messages));
            //PlcTypeMapper.RegisterType(typeof(Modes), sizeof(Modes));
            //PlcTypeMapper.RegisterType(typeof(OperationTypes), sizeof(OperationTypes));
            //PlcTypeMapper.RegisterType(typeof(Kinds), sizeof(Kinds));
            //PlcTypeMapper.RegisterComplexType(typeof(AddressDefinition));
#if DEBUG
            const string rootPath = "../../../";
#else
            //const string rootPath = "/root/arsenalum/";
            var rootPath = Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)+"\\";
#endif
            var json = File.ReadAllText(rootPath + "config.json");
            Configuration = JsonConvert.DeserializeObject<Settings>(json);
            NpgsqlConnection.GlobalTypeMapper.MapEnum<Privileges>("public.enum_privileges", new NpgsqlNullNameTranslator());
            NpgsqlConnection.GlobalTypeMapper.MapEnum<AddressTypes>("public.enum_addresses", new NpgsqlNullNameTranslator());
            NpgsqlConnection.GlobalTypeMapper.MapEnum<OperationTypes>("public.enum_operations", new NpgsqlNullNameTranslator());
            NpgsqlConnection.GlobalTypeMapper.MapEnum<States>("public.enum_states", new NpgsqlNullNameTranslator());
            NpgsqlConnection.GlobalTypeMapper.MapComposite<AddressDefinition>("public.type_definition");
            NpgsqlConnection.GlobalTypeMapper.MapComposite<MessageOperation>("public.type_task");
            //NpgsqlConnection.GlobalTypeMapper.AddMapping(new NpgsqlTypeMapping(new NpgsqlTypeMappingBuilder {
            //    PgTypeName = "id64",
            //    ClrTypes = new[] { typeof(Id64) },
            //    TypeHandlerFactory = new 
            //}.Build()));
            SqlMapper.AddTypeHandler(new Id64Handler());
            SqlMapper.AddTypeHandler(new Id64ListHandler());
            _sessions = new Dictionary<Guid, Session.Session>();
            Clients = new Dictionary<string, Client>();
        }

        public static void WorkersSendMessage(byte[] message)
        {
            lock (Clients) {
                foreach (var worker in Clients) {
                    worker.Value.AddMessage(message);
                }
            }
        }

        public static void Stop()
        {
            if (!Running) return;
            Running = false;
            try { _listener.Abort(); }
            catch (Exception e) {
                Debug.WriteLine(e.StackTrace);
            }
            _listener = null;
        }

        public static void Notify(string message)
        {
            var contentByte = Encoding.UTF8.GetBytes(message);
            Task.Run(() => WorkersSendMessage(contentByte));
        }
        public static string[] TryDecodeAuthString(string authString)
        {
            var data = Convert.FromBase64String(authString);
            var decodedString = Encoding.UTF8.GetString(data);
            var value = decodedString.Split(':');
            if (value.Length == 2) return value;
            //var error = new ExecutionError("Невалидный формат данных пользователя");
            //error.AddLocation(context.FieldAst, context.Document);
            //error.Path = context.Path;
            //context.StackerErrors.Add(error);
            return null;
        }

        public static Guid? CreateSessionToken(string value)
        {
            var authInfo = TryDecodeAuthString(value);
            if (authInfo == null) return null;
            var id = Api.TryGetUserId(authInfo[0], authInfo[1]);
            if (!id.HasValue) return null;
            lock (_sessions) {
                Guid token;
                do {
                    token = Guid.NewGuid();

                } while (_sessions.ContainsKey(token));
                _sessions.Add(token, new Session.Session(id.Value, token, authInfo[0], authInfo[1]));
                return token;
            }
        }

        enum RequestTypes {
            WRITING_TO_DATABASE_COMPLETED
        }

        public static void NotifyDelegate(object o, NpgsqlNotificationEventArgs e)
        {
            switch (e.Channel) {
                case "arsenalum": {
                        Debug.WriteLine($"MESSAGE FROM arsenalum: {e.Payload}");
                        Notify(e.Payload);
                    }
                    break;
                case "arsenalum_sse": {
                        Debug.WriteLine($"MESSAGE FROM arsenalum_sse: {e.Payload}");
                        var request = JObject.Parse(e.Payload);
                        if (Enum.TryParse<RequestTypes>(request.Value<string>("$type"), out var requestType)) {
                            switch (requestType) {
                                case RequestTypes.WRITING_TO_DATABASE_COMPLETED: {
                                        if (!Id64.TryParse(request["work_zone"]?.ToString(), out var workZone)) return;
                                        if (!Id64.TryParse(request["id"]?.ToString(), out var id)) return;
                                        Debug.WriteLine($"Values {workZone} {id}");
                                        PlcClient.AddMSg(new MessageResponse(workZone, id));
                                    }
                                    break;
                            }
                        }
                        break;
                    }
            }
        }

        public static void SseWorker()
        {
            while (true) {
                try {
                    using var connection = GetNpgsqlConnection();
                    connection.Notification += NotifyDelegate;
                    connection.Open();
                    using var cmd = new NpgsqlCommand("LISTEN arsenalum;LISTEN arsenalum_sse;", connection);
                    cmd.ExecuteNonQuery();
                    while (true) {
                        connection.Wait(); // Thread will block here
                    }
                }
                catch (Exception) {
                    NpgsqlConnection.ClearAllPools();
                    Notify(
                        "{\"stop\":\"Необходимо перегрузить страницу, так как соединение сервера с базой данных было прервано\"}");
                }
            }
        }

        public static async void Listen()
        {
            try {
                Task.Run(SseWorker);
                Task.Run(MessageQueue_1C);
                PlcClient = new PlcClient();
                PlcClient.Init();
                PlcClient.Connect();
                _listener = new HttpListener();
                _listener.Prefixes.Add($"https://{Configuration.EndPoint}/");
#if UBUNTU
                _listener.Prefixes.Add($"http://arsenalum.site:8080/");
#endif

                _listener.Start();

                Console.WriteLine("Сервер запущен");
                while (true) {
                    var context = await _listener.GetContextAsync();
                    Task.Run(() => HandleRequest(context));
                }
            }
            catch (Exception e) {
                Debug.WriteLine($"Listen() {Environment.NewLine}{e.Message}{Environment.NewLine}{e.StackTrace}");
                throw;
            }

        }

        private static void SendHttpResponse(HttpListenerContext context, string content, int statusCode, string statusDescription, string contentType)
        {
            var contentByte = Encoding.UTF8.GetBytes(content);
            SendHttpResponse(context, contentByte, statusCode, statusDescription, contentType);
        }

        private static void SendHttpResponse(HttpListenerContext context, byte[] content, int statusCode, string statusDescription, string contentType)
        {
            var response = context.Response;
            response.StatusCode = statusCode;
            response.StatusDescription = statusDescription;
            response.ContentType = contentType;
            response.AddHeader("Content-Encoding", "gzip");

            using (var memoryStream = new MemoryStream(content))
            using (var zipStream = new GZipStream(response.OutputStream, CompressionMode.Compress, false)) {
                memoryStream.CopyTo(zipStream);
                //zipStream.Flush();
            }
            //var output = response.OutputStream;
            //output.Write(content, 0, content.Length);
            //output.Close();
            response.Close();
        }


        public static Session.Session GetSession(HttpListenerRequest request)
        {
            var cookie = request.Cookies["token"];
            if (Guid.TryParse(cookie?.Value, out var token)) {
                lock (_sessions) {
                    if (_sessions.TryGetValue(token, out var session)) {
                        return session;
                    }
                }
            }
            return null;
        }


        public static void MessageQueue_1C()
        {
            while (true)
            {
                try
                {
                    using var connection = GetDbConnection();
                    var messageList = connection.Query<MessageQueue.Message>("get_message", commandType: CommandType.StoredProcedure).ToList();
                    if (!messageList.Any()) continue;
                    foreach (var message in messageList)
                    {
                        var ret = Connect1C.Call(message.value);
                        Debug.WriteLine($"{message.value} : {ret}");
                        if (ret)
                        {
                            connection.Execute("remove_message", new { _id = message.id },
                                commandType: CommandType.StoredProcedure);
                        }
                    }
                }
                catch (Exception e)
                {
                    Debug.WriteLine(e.Message);
                    Debug.WriteLine(e.StackTrace);
                }
                finally
                {
                    Thread.Sleep(Configuration.Integration1C.SyncInterval);
                }
            }
        }

        public static void RemoveWorker(Client worker)
        {
            var id = worker.GetId;
            bool wasRemoved;
            lock (Clients) {
                wasRemoved = Clients.Remove((string)id);
            }
            if (wasRemoved) Notify($"{{\"id\":\"webworkers\",\"delete\":\"{id}\"}}");
        }

        //public static string ExecuteQuery(string query)
        //{
        //    DataBaseAdapter.DataLoader = new DataLoaderContextAccessor { Context = new DataLoaderContext() };
        //    var listener = new DataLoaderDocumentListener(DataBaseAdapter.DataLoader);
        //    try
        //    {
        //        return GqlSchema.Execute(_ =>
        //        {
        //            _.Schema = GqlSchema;
        //            _.Query = query;
        //            //_.UserContext = token;
        //            _.Listeners.Add(listener);
        //        });
        //    }
        //    catch (Exception e)
        //    {
        //        Console.WriteLine(e);
        //    }
        //    return null;
        //}

        public static Id64? GetSessionUser(Guid? token, Response context)
        {
            if (!token.HasValue) return null;
            lock (_sessions) {
                if (_sessions.TryGetValue(token.Value, out var session)) {
                    return session.User;
                }
                return null;
            }
        }

        public static void GetRequestPostData(HttpListenerRequest request)
        {
            var i = 0;
            var result = $"Line {i}: -[ {request.HttpMethod}: {request.RawUrl} ]-\n";
            foreach (string header in request.Headers) {
                result += $"Line {i}: -[ {header}: {request.Headers[header]} ]-\n";
                i += 1;
            }
            //Console.WriteLine(result);
        }

        public static int IncrementWorkerCounter()
        {
            return Interlocked.Increment(ref _workerCounter);
        }

        public static IDbConnection GetDbConnection()
        {
            return new NpgsqlConnection(Configuration.Database.ConnectionStringSuperuser);
        }

        public static NpgsqlConnection GetNpgsqlConnection()
        {
            return (NpgsqlConnection)GetDbConnection();
        }

        public static NpgsqlConnection GetNpgsqlConnection(Session.Session session)
        {
            return new NpgsqlConnection(Configuration.Database.ConnectionString + session.ConnectionString);
        }

        public static IDbConnection GetDbConnection(Session.Session session)
        {
            return new NpgsqlConnection(Configuration.Database.ConnectionString + session.ConnectionString);
        }

        public static void HandleRequest(HttpListenerContext context)
        {
            try {
                var request = context.Request;
                if (context.Request.IsWebSocketRequest) {
                    var session = GetSession(request);
                    if (session != null) {
                        var worker = new Client(context, session);
                        Task.Run(() => worker.Start());
                        lock (Clients) {
                            Clients.Add((string)worker.GetId, worker);
                        }
                        Task.Run(() => { Notify($"{{\"id\":\"webworkers\",\"insert\":\"{worker.GetId}\"}}"); });
                    } else SendHttpResponse(context, "", (int)HttpStatusCode.BadRequest, "OK", "");
                    return;
                }

                switch (request.HttpMethod) {
                    case "GET": {
                            var filePath = request.RawUrl;
                            Console.WriteLine($"[{Configuration.Path + filePath}] {File.Exists(Configuration.Path + filePath)}");

                            if (!File.Exists(Configuration.Path + filePath)) {
                                SendHttpResponse(context, "", (int)HttpStatusCode.BadRequest, "OK", "");
                                return;
                            }

                            var i = filePath.LastIndexOf('.');
                            var fileExtension = i < 0 ? "" : filePath.Substring(i + 1);

                            var contentByte = File.ReadAllBytes(Configuration.Path + filePath);
                            SendHttpResponse(context, contentByte, (int)HttpStatusCode.OK, "OK", Extensions[fileExtension]);
                        }
                        break;
                    case "POST": {
                            var buffer = new byte[request.ContentLength64];
                            var input = request.InputStream;
                            input.Read(buffer, 0, buffer.Length);
                            input.Close();
                            var postMessage = Encoding.UTF8.GetString(buffer);
                            var contentByte = Schema.Instance.HandleUnauthorizedUser(postMessage);
                            SendHttpResponse(context, contentByte, (int) HttpStatusCode.OK, "OK", "application/json");
                        }
                        break;
                    default: return;
                }
            }
            catch (Exception e) {
                Console.WriteLine(e);
            }
        }
    }
}