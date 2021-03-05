using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using Backend.Gql;
using Backend.Gql.Sql;
using Backend.Gql.Types;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static IEnumerable<T> GetEnumerable<T>(Selection query, Response context, IList ids = null)
            where T : UniqueObject
        {
            try {
                IEnumerable<T> result;
                if (!(query.TargetType is GqlField gqlObjectProperty)) {
                    return null;
                }

                if (!(gqlObjectProperty.Value is IGqlUnique objFld)) {
                    return null;
                }

                Select sql = null;
                objFld.GetSql(query, ref sql);
                var types = new List<Type>();
                Selection.CollectTypes(ref types, query.TargetType, query);
                //Console.WriteLine($"[ GraphQL ] {query}");
                //Console.WriteLine($"[ SQL ] {sql}");
                using (var conn = Core.GetDbConnection(context.Session)) {
                    result = conn.Query(
                        sql.ToString(),
                        types.ToArray(),
                        objects => {
                            var pos = 0;
                            return (T)objFld.CollectObjects(query, objects, ref pos);
                        },
                        sql.Parameters
                    );
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