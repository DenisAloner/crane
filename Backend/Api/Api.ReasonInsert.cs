using System;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object ReasonInsert(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var name = arguments["name"].Get<string>();
            var direction = arguments["direction"].Get<Directions>();
            try {
                Id64? result;
                using (var scope = new TransactionScope())
                {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<Id64?>(
                        "INSERT INTO reasons(name,direction) values(@name,@direction::enum_directions) RETURNING id",
                        new { name, direction = direction.ToString() });
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