using System;
using System.Reflection;

namespace Backend.Gql.Types {
    public class GqlField : IGqlType, IHasArguments {
        public readonly string Name;
        public bool ArgumentsRequired { get; set; } = true;

        public GqlField(IGqlType value, PropertyInfo property, bool isDatabaseValue, string sqlColumn,
            string sqlTable, string name)
        {
            Value = value;
            Property = property;
            IsDatabaseValue = isDatabaseValue;
            SqlColumn = sqlColumn;
            SqlTable = sqlTable;
            Name = name;
        }

        public PropertyInfo Property { get; }
        public IGqlType Value { get; }

        public bool IsDatabaseValue { get; }
        public string SqlColumn { get; }

        public string SqlTable { get; }

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
            return Value.Resolve(query, Property.GetValue(obj), response);
        }

        public IGqlType HasSelection(string key) => Value.HasSelection(key);

        public IGqlType HasArgument(string key) =>
            Arguments != null ? Arguments.TryGetValue(key, out var value) ? value : null : null;

        public object CollectObjects(Selection query, object[] objects, ref int index)
        {
            return Value.CollectObjects(query, objects, ref index);
        }

        public string BuildSchemeJavascript()
        {
            return
                $"field('{Name}',{Value.BuildSchemeJavascript()}{(Arguments == null ? "" : $",{Arguments.JavascriptDescription()}")})";

        }

        public GqlArgumentsList Arguments { get; set; }
    }
}