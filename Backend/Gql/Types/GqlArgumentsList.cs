using System.Collections.Generic;
using System.Linq;

namespace Backend.Gql.Types {
    public class GqlArgumentsList: Dictionary<string, IGqlType> {
        public bool Required { get; set; }

        public GqlArgumentsList(bool required = true)
        {
            Required = required;
        }

        public string JavascriptDescription()
        {
            return
                $"args([{string.Join(",", this.Select(_ => $"argument('{_.Key}',{_.Value.BuildSchemeJavascript()})"))}]{(Required == false ? ",false" : "")})";
        }
    }

    public interface IHasArguments {
        GqlArgumentsList Arguments { get; set; }
    }
}

