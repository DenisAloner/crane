namespace Backend.Gql.Types.Scalars
{
    public class GqlUnsignedInt : GqlScalar<uint> {
        public override object Parse(object value, Response context)
        {
            if (value is string token) {
                if (uint.TryParse(token, out var number)) return number;
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
}