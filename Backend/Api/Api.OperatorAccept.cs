using System;
using System.Data;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object OperatorAccept(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var uncommitted_operation = arguments["uncommitted_operation"].Get<Id64>();

            try {
                bool? result;
                using (var scope = new TransactionScope())
                {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<bool>("operator_accept",
                        new { _uncommitted_operation = uncommitted_operation, _user = context.Session.User },
                        commandType: CommandType.StoredProcedure);
                    scope.Complete();
                }

                return result;
            }
            catch (Exception e) {
                Debug.WriteLine(e);
                context.AddError(query.ToString(), e.Message);
            }

            return null;
        }
    }
}