using System;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object OwnerInsert(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var name = arguments["name"].Get<string>();
            try {
                Id64? result;
                using (var scope = new TransactionScope()) {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<Id64?>("INSERT INTO owners(name) values(@name) RETURNING id",
                        new { name });
                    Debug.WriteLine($"OwnerInsert: {result}");
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