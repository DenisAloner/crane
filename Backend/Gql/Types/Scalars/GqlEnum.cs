using System;

namespace Backend.Gql.Types.Scalars {
    public class GqlEnum<T> : GqlScalar<T> where T : struct, Enum {
        public override object Parse(object value, Response context)
        {
            if (value is string token) {
                if (Enum.TryParse<T>(token, out var number)) return number;
                if (token == "null") return null;
            }
            context.AddError("", $"Could not convert input <{value}> string to enum or null");
            return null;
        }

        public override string BuildSchemeJavascript()
        {
            return $"Scheme.enum({typeof(T).Name})";
        }
    }
}