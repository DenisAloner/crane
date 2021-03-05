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
        public static object Reset(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var id = arguments["id"].Get<Id64>();
            try {
                using var scope = new TransactionScope();
                using var conn = Core.GetDbConnection(context.Session);
                conn.ExecuteScalar<bool>("reset", new { _zone = id },
                    commandType: CommandType.StoredProcedure);
                Core.PlcClient.AddMSg(new MessageReset(id));
                scope.Complete();
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