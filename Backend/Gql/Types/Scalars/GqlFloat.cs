using System.Globalization;

namespace Backend.Gql.Types.Scalars {
    public class GqlFloat : GqlScalar<float?> {
        public override object Parse(object value, Response context)
        {
            if (value is string token) {
                if (float.TryParse(token,NumberStyles.Any, CultureInfo.InvariantCulture, out var number)) return number;
                if (token == "null") return null;
            }
            context.AddError("", $"Could not convert input <{value}> string to number or null");
            return null;
        }

        public override string BuildSchemeJavascript()
        {
            return "GqlLong";
        }
    }

    public class GqlNonNullFloat : GqlScalar<float> {
        public override object Parse(object value, Response context)
        {
            if (value is string token && float.TryParse(token, NumberStyles.Any, CultureInfo.InvariantCulture, out var number)) return number;
            context.AddError("", $"Could not convert input <{value}> string to number");
            return null;
        }

        public override string BuildSchemeJavascript()
        {
            return "GqlLong";
        }
    }
}