namespace Backend.Gql.Types.Scalars {
    public class GqlLong : GqlScalar<long?> {
        public override object Parse(object value, Response context)
        {
            if (value is string token) {
                if (long.TryParse(token, out var number)) return number;
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

    public class GqlNonNullLong : GqlScalar<long> {
        public override object Parse(object value, Response context)
        {
            if (value is string token && long.TryParse(token, out var number)) return number;
            context.AddError("", $"Could not convert input <{value}> string to number");
            return null;
        }

        public override string BuildSchemeJavascript()
        {
            return "GqlLong";
        }
    }
}