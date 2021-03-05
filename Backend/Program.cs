using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Backend.Gql;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Task = System.Threading.Tasks.Task;

namespace Backend {
    [GuidAttribute("44AF8280-342C-47DB-9106-B20E610F451F")]
    public class Program {
        public static async Task<int> Main(string[] args)
        {
            JsonConvert.DefaultSettings = () => {
                var settings = new JsonSerializerSettings();
                settings.Converters.Add(new StringEnumConverter());
                settings.Converters.Add(new DateTimeConverter());
                settings.Converters.Add(new IPAddressConverter());
                settings.Converters.Add(new IPEndPointConverter());
                settings.Converters.Add(new Id64Converter());
                settings.Formatting = Formatting.None;
                settings.NullValueHandling = NullValueHandling.Include;
                settings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
                return settings;
            };

            try
            {
                var cts = new CancellationTokenSource();
                AppDomain.CurrentDomain.ProcessExit += (s, e) => {
                    Core.Stop();
                    cts.Cancel();
                };
                // server.Listen("http://192.168.1.110:8080/", $"/media/sf_Frontend");
                Core.Listen();
                await Task.Delay(-1, cts.Token);
            }
            catch (Exception)
            {
                // ignored
            }

            return 0;
        }
    }
}
