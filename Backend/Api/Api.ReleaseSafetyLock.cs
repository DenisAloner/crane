using System;
using System.Data;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Plc;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object ReleaseSafetyLock(Selection query, Response context)
        {
            bool? result = null;

            var arguments = query.Arguments;
            var password = arguments["password"].Get<string>();

            try {
                using (var scope = new TransactionScope()) {
                    using (var conn = Core.GetDbConnection(context.Session)) {
                        result = conn.ExecuteScalar<bool>("release_safety_lock", new { _user = context.Session.User },
                            commandType: CommandType.StoredProcedure);
                       // Core.PlcClient.AddMSg(new MessageReleaseSafetyLock());
                        scope.Complete();
                    }
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