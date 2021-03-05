using System;
using System.Data;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object UncommittedOperationDelete(Selection query, Response context)
        {
            bool? result = null;
            var arguments = query.Arguments;
            var id = arguments["id"].Get<Id64>();
            try {
                using (var scope = new TransactionScope())
                {
                    using var conn = Core.GetDbConnection(context.Session);
                    conn.Execute("uncommitted_operation_delete",
                        new { _id = id, _user = context.Session.User },
                        commandType: CommandType.StoredProcedure);
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