using System;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object ProductTypeInsert(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var name = arguments["name"].Get<string>();
            try {
                long? result;
                using (var scope = new TransactionScope())
                {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<long>(
                        "INSERT INTO product_types(name) values(@name) RETURNING id",
                        new { name });
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