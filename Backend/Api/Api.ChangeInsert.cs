using System;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object UncommittedChangeInsert(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var uncommitted_operation = arguments["uncommitted_operation"].Get<Id64>();
            var nomenclature = arguments["nomenclature"].Get<Id64>();
            var increment = arguments["increment"].Get<float>();
            var reason = arguments["reason"].Get<Id64>();
            var owner = arguments["owner"].Get<Id64>();
            var basis = arguments["basis"].Get<string>();
            try {
                Id64? result;
                using (var scope = new TransactionScope())
                {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<Id64>(
                        "INSERT INTO uncommitted_changes(uncommitted_operation,nomenclature,increment,reason,owner,basis) values(@uncommitted_operation,@nomenclature,@increment,@reason,@owner,@basis) RETURNING id",
                        new { uncommitted_operation, nomenclature, increment, reason, owner, basis });
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