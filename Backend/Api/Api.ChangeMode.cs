using System;
using System.Data;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Backend.Plc;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object ChangeMode(Selection query, Response context)
        {
            bool? result = null;
            var arguments = query.Arguments;
            var id = arguments["id"].Get<Id64>();
            var mode = arguments["mode"].Get<byte>();

            try {
                using (var scope = new TransactionScope())
                {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<bool>("change_mode", new { _user = context.Session.User },
                        commandType: CommandType.StoredProcedure);
                    var workZone = Core.PlcClient.GetZone(id);
                    Core.PlcClient.AddMSg(new MessageChangeMode(workZone.id, (Modes) mode));
                    scope.Complete();
                }

                return true;
            }
            catch (Exception e) {
                Debug.WriteLine(e);
                context.AddError(query.ToString(), e.Message);
            }

            return null;
        }
    }
}