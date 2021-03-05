using System;
using System.Collections.Generic;
using System.Diagnostics;
using Backend.Gql;
using Backend.Gql.Sql;
using Backend.Gql.Types;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static Map<T> GetMap<T>(Selection query, Response context) where T : UniqueObject
        {
            try {
                IEnumerable<T> result;
                if (!(query.TargetType is GqlQuery gqlQuery)) {
                    return null;
                }

                if (!(gqlQuery.ReturnType is GqlMap map)) {
                    return null;
                }

                if (!(map.InstanceGqlType is IGqlUnique gqlObject)) {
                    return null;
                }

                Select sql = null;
                gqlObject.GetSql(query, ref sql);
                var types = new List<Type>();
                Selection.CollectTypes(ref types, query.TargetType, query);
                //Console.WriteLine($"[ GraphQL ] {query}");
                Console.WriteLine($"[ SQL ] {sql}");
                using (var conn = Core.GetDbConnection(context.Session)) {
                    result = conn.Query(
                        sql.ToString(),
                        types.ToArray(),
                        objects => {
                            var pos = 0;
                            return (T)gqlQuery.CollectObjects(query, objects, ref pos);
                        },
                        sql.Parameters
                    );
                }

                return new Map<T>(gqlObject.SqlTable, result);
            }
            catch (Exception e) {
                Debug.WriteLine(e);
                context.AddError(query.ToString(), e.Message);
            }

            return null;
        }
    }
}