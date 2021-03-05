using System;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object RemoveObject<T>(Selection query, Response context) where T : UniqueObject
        {
            var gqlObjectType = Schema.UniqueTypes[typeof(T)];
            var arguments = query.Arguments;
            var id = arguments["id"].Get<Id64>();
            try {
                long? result;
                using (var scope = new TransactionScope())
                {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<long>($"DELETE FROM {gqlObjectType.SqlTable} WHERE id=@id",
                        new { id });
                    scope.Complete();
                }

                return result > 0;
            }
            catch (Exception e) {
                Debug.WriteLine(e);
                context.AddError(query.ToString(), e.Message);
            }

            return null;
        }
    }
}