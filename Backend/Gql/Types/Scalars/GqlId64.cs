using System.Globalization;
using Newtonsoft.Json.Linq;

namespace Backend.Gql.Types.Scalars {
    public class GqlId64 : GqlScalar<Id64?> {
        public override object Parse(object value, Response context)
        {
            if (value is string token) {
                if (long.TryParse(token, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var number)) return new Id64(number);
                if (token == "null") return null;
            }
            context.AddError("", $"Could not convert input <{value}> string to number or null");
            return null;
        }

        public override object Resolve(Selection query, object obj, Response response)
        {
            return obj is Id64 id64 ? JToken.FromObject(id64) : null;
        }

        public override string BuildSchemeJavascript()
        {
            return "GqlId64";
        }
    }

    public class GqlNonNullId64 : GqlScalar<Id64> {
        public override object Parse(object value, Response context)
        {
            if (value is string token &&
                long.TryParse(token, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var number)) return new Id64(number);
            context.AddError("", $"Could not convert input <{value}> string to number");
            return null;
        }

        public override object Resolve(Selection query, object obj, Response response)
        {
            return obj is Id64 id64 ? JToken.FromObject(id64) : null;
        }

        public override string BuildSchemeJavascript()
        {
            return "GqlNonNullId64";
        }
    }
}