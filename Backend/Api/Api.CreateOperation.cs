using System;
using System.Data;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object UncommittedOperationInsert(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var source = arguments["source"].Get<Id64>();
            var destination = arguments["destination"].Get<Id64>();
            var is_virtual = arguments["is_virtual"].Get<bool>();
            try {
                Id64? result;
                using (var scope = new TransactionScope()) {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<Id64>("uncommitted_operation_insert",
                        new { _source = source, _destination = destination, _user = context.Session.User,_is_virtual = is_virtual },
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