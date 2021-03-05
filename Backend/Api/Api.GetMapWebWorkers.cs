using System.Collections.Generic;
using System.Linq;
using Backend.Gql;
using Backend.Gql.Types.Scalars;

namespace Backend {
    public static partial class Api {
        public static object GetMapWebWorkers(Selection query, Response context)
        {
            Dictionary<Id64, User> userMap = null;
            List<WebWorker> webWorkers = null;

            if (query.Arguments != null && query.Arguments.TryGetValue("id", out var value)) {
                var list = (List<string>)value.Value;
                Dictionary<WebWorker, Id64> ids = null;
                foreach (var id in list) {
                    if (!Core.Clients.TryGetValue(id, out var client)) return null;
                    if (webWorkers == null) webWorkers = new List<WebWorker>();
                    var webWorker = new WebWorker { id = client.id, ip = client.ip };
                    if (ids == null) ids = new Dictionary<WebWorker, Id64>();
                    ids.Add(webWorker, client._session.User);
                    webWorkers.Add(webWorker);
                }

                if (ids != null && query.Selections != null &&
                    query.Selections.TryGetValue("user", out var userSelection)) {
                    userMap = GetEnumerable<User>(userSelection, context, ids.Select(k => k.Value).ToList())
                        ?.ToDictionary(k => k.id);
                    foreach (var (key, l) in ids) {
                        key.user = userMap != null && userMap.TryGetValue(l, out var user) ? user : null;
                    }
                }
            } else {
                if (query.Selections != null && query.Selections.TryGetValue("user", out var userSelection)) {
                    userMap = GetEnumerable<User>(userSelection, context)?.ToDictionary(k => k.id);
                }

                webWorkers = Core.Clients.Select(client => new WebWorker {
                    id = client.Value.id,
                    ip = client.Value.ip,
                    user = userMap != null && userMap.TryGetValue(client.Value._session.User, out var user)
                            ? user
                            : null
                })
                    .ToList();
            }

            return new Map<WebWorker>("webworkers", webWorkers);
        }
    }
}