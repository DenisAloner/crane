using System;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object NomenclatureInsert(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var designation = arguments["designation"].Get<string>();
            var name = arguments["name"].Get<string>();
            var unit = arguments["unit"].Get<Id64>();
            var product_type = arguments["product_type"].Get<Id64>();
            try {
                long? result;
                using (var scope = new TransactionScope())
                {
                    using var conn = Core.GetDbConnection(context.Session);
                    result = conn.ExecuteScalar<long>(
                        "INSERT INTO nomenclatures(designation,name,unit,product_type) values(@designation,@name, @unit,@product_type) RETURNING id",
                        new { designation, name, unit, product_type });
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