using System;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object Set<T>(Selection query, Response context, string column) where T : UniqueObject
        {
            var objField = Schema.UniqueTypes[typeof(T)];
            var fieldType = objField.Fields[column].Property.PropertyType;
            var arguments = query.Arguments;
            var parameters = new DynamicParameters();
            var id = query.Arguments["id"].Get<Id64>();
            parameters.Add("id", id);
            string oldValueCondition;
            if (arguments.TryGetValue("old", out var oldValue) && oldValue.Value != null) {
                if (fieldType == typeof(Directions)) {
                    parameters.Add("old", oldValue.Value.ToString());
                    oldValueCondition = "=@old::enum_directions";
                } else {
                    parameters.Add("old", oldValue.Value);
                    oldValueCondition = "=@old";
                }
            } else {
                oldValueCondition = " IS NULL";
            }

            string newValueCondition;
            if (arguments.TryGetValue("new", out var newValue) && newValue.Value != null) {
                if (fieldType == typeof(Directions)) {
                    parameters.Add("new", newValue.Value.ToString());
                    newValueCondition = "=@new::enum_directions";
                } else {
                    parameters.Add("new", newValue.Value);
                    newValueCondition = "=@new";
                }
            } else {
                newValueCondition = "=NULL";
            }

            var sqlQuery =
                $"UPDATE {objField.SqlTable} SET {column}{newValueCondition} WHERE id=@id AND {column}{oldValueCondition}";
            Console.WriteLine(sqlQuery);
            try
            {
                using var scope = new TransactionScope();
                using var conn = Core.GetDbConnection(context.Session);
                if (conn.Execute(sqlQuery, parameters) != 0) {
                } else {
                    throw new InvalidOperationException("Не удалось обновить поле");
                }

                scope.Complete();
                return true;
            }
            catch (Exception e) {
                Debug.WriteLine(e.Message);
                Debug.WriteLine(e.StackTrace);
                context.AddError(query.ToString(), e.Message);
            }

            return null;
        }
    }
}