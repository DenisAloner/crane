using System;
using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Backend.Gql.Types
{
    public class GqlList<T> : IGqlType,INullable where T : IGqlType, new() {
        private static readonly T InstanceGqlType = new T();

        private static readonly Type ListType = typeof(List<>).MakeGenericType(InstanceGqlType.GetClrType());
        public Type GetClrType() => ListType;

        public object Parse(object value, Response context)
        {
            if (value == null) return null;
            switch (value) {
                case string s: {
                    if (s == "null") return null;
                    var instance = (IList)Activator.CreateInstance(ListType);
                    var i = context.Errors.Count;
                    var parseValue = InstanceGqlType.Parse(s, context);
                    if (i != context.Errors.Count) return null;
                    instance.Add(parseValue);
                    return instance;
                }
                case List<object> list: {
                    var instance = (IList)Activator.CreateInstance(ListType);
                    foreach (var item in list) {
                        var i = context.Errors.Count;
                        var parseValue = InstanceGqlType.Parse(item, context);
                        if (i != context.Errors.Count) return null;
                        instance.Add(parseValue);
                    }

                    return instance;
                }
                default:
                    context.AddError("", $"Не удалось преобразовать входную строку <{value}> в коллекцию");
                    return null;
            }
        }

        public object Resolve(Selection query, object obj, Response response)
        {
            if (!(obj is IList list)) return null;
            if (list.Count == 0) return null;
            var result = new JArray();
            foreach (var item in list) {
                result.Add(InstanceGqlType.Resolve(query, item, response));
            }

            return result;
        }

        public IGqlType HasSelection(string key) => InstanceGqlType.HasSelection(key);
        public IGqlType HasArgument(string key) => InstanceGqlType.HasArgument(key);

        public object CollectObjects(Selection query, object[] objects, ref int index)
        {
            return InstanceGqlType.CollectObjects(query, objects, ref index);
        }

        public string BuildSchemeJavascript()
        {
            //return $"Scheme.array({InstanceGqlType.BuildSchemeJavascript()})";
            return InstanceGqlType.BuildSchemeJavascript();
        }
    }
}