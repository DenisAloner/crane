using System.Net;
using Newtonsoft.Json;

namespace Backend
{
    public class Settings
    {
        [JsonProperty] public readonly IPEndPoint EndPoint;
        [JsonProperty] public readonly string Path;

        public class SettingsDatabase
        {
            [JsonProperty] public readonly IPEndPoint EndPoint;
            [JsonProperty] public readonly string Name;
            [JsonProperty] public readonly string User;
            [JsonProperty] public readonly string Password;

            [JsonIgnore] public readonly string ConnectionStringSuperuser;
            [JsonIgnore] public readonly string ConnectionString;

            public SettingsDatabase(IPEndPoint endPoint, string name, string user, string password)
            {
                EndPoint = endPoint;
                Name = name;
                User = user;
                Password = password;
                ConnectionString = $"Server={EndPoint.Address};Port={EndPoint.Port};Database={Name};Tcp Keepalive=true;";
                ConnectionStringSuperuser = $"{ConnectionString}User Id={User};Password={Password};Tcp Keepalive=true;";
            }
        }

        public class Settings1C
        {
            [JsonProperty] public readonly string Connection;
            [JsonProperty] public readonly int SyncInterval;

            public Settings1C(string connection, int syncInterval)
            {
                Connection = connection;
                SyncInterval = syncInterval;
            }
        }

        [JsonProperty] public readonly SettingsDatabase Database;
        [JsonProperty("1C")] public readonly Settings1C Integration1C;

        public Settings(IPEndPoint endPoint, string path, SettingsDatabase settingsDatabase, Settings1C integration1C)
        {
            EndPoint = endPoint;
            Path = path;
            Database = settingsDatabase;
            Integration1C = integration1C;
        }
    }
}
