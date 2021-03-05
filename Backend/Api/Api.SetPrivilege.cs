using System;
using System.Data;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object SetPrivilege(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var id = arguments["id"].Get<Id64>();
            var privilege = arguments["privilege"].Get<Privileges>();
            var old = arguments["old"].Get<bool>();
            var @new = arguments["new"].Get<bool>();
            try {
                using (var scope = new TransactionScope()) {
                    using var conn = Core.GetDbConnection(context.Session);
                    conn.ExecuteScalar<long>($"privilege_{(@new ? "insert" : "delete")}",
                        new { _user = id, _privilege_text = privilege.ToString() },
                        commandType: CommandType.StoredProcedure);
                    scope.Complete();
                }
                return id;
            }
            catch (Exception e) {
                Debug.WriteLine(e);
                context.AddError(query.ToString(), e.Message);
            }

            return null;
        }
    }
}