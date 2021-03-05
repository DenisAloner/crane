using System;

namespace Backend.Gql.Types
{
    public interface IGqlType
    {
        Type GetClrType();
        object Resolve(Selection query, object obj, Response response);
        IGqlType HasSelection(string key);
        IGqlType HasArgument(string key);
        object Parse(object value, Response context);
        object CollectObjects(Selection query, object[] objects, ref int index);

      
        string BuildSchemeJavascript();
    }

    public abstract class GqlType<T> : IGqlType
    {
        public virtual Type GetClrType() => typeof(T);
        public abstract object Parse(object value, Response context);
        public abstract object Resolve(Selection query, object obj, Response response);
        public abstract IGqlType HasSelection(string key);
        public abstract IGqlType HasArgument(string key);
        public abstract object CollectObjects(Selection query, object[] objects, ref int index);
        
        public abstract string BuildSchemeJavascript();
    }
}