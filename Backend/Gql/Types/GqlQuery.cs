using System;
using Newtonsoft.Json.Linq;

namespace Backend.Gql.Types
{
    public class GqlQuery : IGqlType, IHasArguments {
        public bool IsPublic;
        public string Name;
        public IGqlType ReturnType;
        
        public Func<Selection, Response, object> Resolver;

        public JObject Resolve(Selection query, Response context)
        {
            return new JObject { new JProperty(Name, ReturnType.Resolve(query, Resolver(query, context), context)) };
        }

        public Type GetClrType()
        {
            throw new NotImplementedException();
        }

        public object Parse(object value, Response context)
        {
            throw new NotImplementedException();
        }

        public object Resolve(Selection query, object obj, Response response)
        {
            throw new NotImplementedException();
        }

        public IGqlType HasSelection(string key) => ReturnType.HasSelection(key);

        public IGqlType HasArgument(string key) =>
            Arguments != null ? Arguments.TryGetValue(key, out var value) ? value : null : null;

        public object CollectObjects(Selection query, object[] objects, ref int index)
        {
            return ReturnType.CollectObjects(query, objects, ref index);
        }

     
        public GqlArgumentsList Arguments { get; set; }

        public string BuildSchemeJavascript()
        {
            return $"Scheme.newQuery('{Name}',{ReturnType.BuildSchemeJavascript()}{(Arguments == null ? "" : $",{Arguments.JavascriptDescription()}")})";
        }

       
    }
}