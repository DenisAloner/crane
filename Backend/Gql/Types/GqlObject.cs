using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Backend.Gql.Types {
    public abstract class GqlObject<T> : GqlType<T>, INullable
    {
        public Dictionary<string, GqlField> Fields { get; set; }

        protected GqlObject()
        {
            Fields = new Dictionary<string, GqlField>();
        }

        public override object Parse(object value, Response context)
        {
            throw new NotImplementedException();
        }

        public override object Resolve(Selection query, object obj, Response response)
        {
            if (query?.Selections == null) return null;
            var result = new JObject();
            foreach (var (key, value) in query.Selections) {
                if (!Fields.TryGetValue(key, out var field)) continue;
                if (!result.ContainsKey(key)) result.Add(new JProperty(key, field.Value.Resolve(value, obj, response)));
            }
            return result;
        }

        public override IGqlType HasSelection(string key) => Fields.TryGetValue(key, out var value) ? value : null;

        public override IGqlType HasArgument(string key) => null;

        public override object CollectObjects(Selection query, object[] objects, ref int index)
        {
            throw new NotImplementedException();
        }

    }
}