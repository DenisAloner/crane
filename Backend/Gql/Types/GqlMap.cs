using System;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Backend.Gql.Types {
    public class GqlMap : IGqlType, INullable {
        public IGqlUnique InstanceGqlType { get; }
        private readonly Type _mapType;
        public Type GetClrType() => _mapType;

        public object Parse(object value, Response context)
        {
            throw new NotImplementedException();
        }

        public GqlMap(IGqlUnique type)
        {
            InstanceGqlType = type;
            _mapType = typeof(Map<>).MakeGenericType(InstanceGqlType.GetClrType());
        }

        public object Resolve(Selection query, object obj, Response context)
        {
            if (!(obj is IMap map)) return null;
            var jObject = new JObject {new JProperty("id", map.GetId)};
            if (map.Items.Any()) {
                foreach (var item in map.Items) {
                    if (!(InstanceGqlType.Resolve(query, item, context) is JObject content)) continue;
                    content.Remove("id");
                    jObject.Add(new JProperty(item.GetId.ToString(), content));
                }
            }
            return jObject;
        }

        public IGqlType HasSelection(string key) => InstanceGqlType.HasSelection(key);
        public IGqlType HasArgument(string key) => InstanceGqlType.HasArgument(key);

        public object CollectObjects(Selection query, object[] objects, ref int index)
        {
            return InstanceGqlType.CollectObjects(query, objects, ref index);
        }

        public string BuildSchemeJavascript()
        {
            return $"Scheme.map({InstanceGqlType.BuildSchemeJavascript()})";
        }
    }
}