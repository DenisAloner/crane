using System;

namespace Backend.Gql.Types.Scalars {
    public class GqlDateTime : GqlScalar<DateTime> {
        public override object Parse(object value, Response context)
        {
            if (value is string token) {
                if (DateTime.TryParse(token, out var number)) return number;
                if (token == "null") return null;
            }
            context.AddError("", $"Could not convert input <{value}> string to timestamp or null");
            return null;
        }

        public override string BuildSchemeJavascript()
        {
            return "GqlDate";
        }
    }
}