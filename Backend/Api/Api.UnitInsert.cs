using System;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object UnitInsert(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var name = arguments["name"].Get<string>();
            try {
                Id64? result;
                using (var scope = new TransactionScope()) {
                    using var connection = Core.GetDbConnection(context.Session);
                    result = connection.ExecuteScalar<Id64>("INSERT INTO units(name) values(@name) RETURNING id",
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