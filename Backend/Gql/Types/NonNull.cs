using System;

namespace Backend.Gql.Types {
    public class NonNull<T> : GqlType<T> where T : IGqlType, INullable, new() {
        private static readonly T InstanceGqlType = new T();

        public override Type GetClrType() => InstanceGqlType.GetClrType();
        public override object Parse(object value, Response context)
        {
            var convertedValue = InstanceGqlType.Parse(value, context);
            if (convertedValue != null) {
                return convertedValue;
            }
            context.AddError("", "Значение не может быть равно <null>");
            return null;
        }

        public override object Resolve(Selection query, object obj, Response response) => InstanceGqlType.Resolve(query, obj, response);
        public override IGqlType HasSelection(string key) => InstanceGqlType.HasSelection(key);
        public override IGqlType HasArgument(string key) => InstanceGqlType.HasArgument(key);
        public override object CollectObjects(Selection query, object[] objects, ref int index) => InstanceGqlType.CollectObjects(query, objects, ref index);
       
        public override string BuildSchemeJavascript()
        {
            return $"nonNull({InstanceGqlType.BuildSchemeJavascript()})";
        }
    }
}