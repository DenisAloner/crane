namespace Backend.Gql.Types.Scalars {
    public class GqlString : GqlScalar<string> {
        public override object Parse(object value, Response context)
        {
            if (value is string token) {
                return token == "null" ? null : token.Trim('\'', '"');
            }
            context.AddError("", $"Could not convert input <{value}> to string or null");
            return null;
        }

        public override string BuildSchemeJavascript()
        {
            return "GqlString";
        }
    }
}