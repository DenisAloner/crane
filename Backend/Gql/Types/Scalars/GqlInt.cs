﻿namespace Backend.Gql.Types.Scalars {
    public class GqlInt : GqlScalar<int> {
        public override object Parse(object value, Response context)
        {
            if (value is string token) {
                if (int.TryParse(token, out var number)) return number;
                if (token == "null") return null;
            }
            context.AddError("", $"Could not convert input <{value}> string to boolean or null");
            return null;
        }

        public override string BuildSchemeJavascript()
        {
            return "GqlLong";
        }
    }
}