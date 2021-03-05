using System;
using System.Collections.Generic;
using System.Linq;
using Backend.Gql.Types;

namespace Backend.Gql {
    public enum TokenTypes {
        SELECTION,
        SELECTION_BODY,
        ARGUMENT_NAME,
        ARGUMENT_VALUE,
        ARGUMENT_VALUE_ARRAY,
        ARGUMENT_ARRAY_END
    }

    public class Argument {
        public bool IsList;
        public string Name;
        public object Value;

        public T Get<T>()
        {
            return (T) Value;
        }

        //public static implicit operator string(Argument arg)
        //{
        //    return (string)arg.Value;
        //}

        //public static implicit operator float(Argument arg)
        //{
        //    return (float)arg.Value;
        //}

        //public static implicit operator Id64(Argument arg)
        //{
        //    return (Id64)arg.Value;
        //}

        //public static implicit operator long(Argument arg)
        //{
        //    return (long)arg.Value;
        //}

        //public static implicit operator int(Argument arg)
        //{
        //    return (int)arg.Value;
        //}

        //public static implicit operator short(Argument arg)
        //{
        //    return (short)arg.Value;
        //}

        //public static implicit operator Privileges(Argument arg)
        //{
        //    return (Privileges)arg.Value;
        //}

        //public static implicit operator Directions(Argument arg)
        //{
        //    return (Directions)arg.Value;
        //}

        //public static implicit operator bool(Argument arg)
        //{
        //    return (bool)arg.Value;
        //}

        //public static implicit operator byte(Argument arg)
        //{
        //    return (byte)arg.Value;
        //}
    }

    public class Selection {
        public IGqlType TargetType;
        public string Name;
        public Dictionary<string, Selection> Selections;
        public Dictionary<string, Argument> Arguments;

        public override string ToString()
        {
            return
                $"{Name}<{TargetType}>{(Arguments != null ? $"({string.Join(',', Arguments.Select(_ => $"{_.Value.Name}:{_.Value.Value}"))})" : string.Empty)}{(Selections != null ? $"{{{string.Join(" ", Selections.Select(_ => _.Value.ToString()))}}}" : string.Empty)}";
        }

        public static void CollectTypes(ref List<Type> types, IGqlType type, Selection selection)
        {
            switch (type) {
                case GqlQuery gqlQuery: {
                        CollectTypes(ref types, gqlQuery.ReturnType, selection);
                    }
                    break;
                case GqlMap gqlMap: {
                        CollectTypes(ref types, gqlMap.InstanceGqlType, selection);
                    }
                    break;
                case GqlField gqlObjectProperty: {
                        CollectTypes(ref types, gqlObjectProperty.Value, selection);
                    }
                    break;
                case IGqlUnique gqlObject: {
                        types.Add(gqlObject.GetClrType());
                        if (selection.Selections != null)
                            foreach (var value in selection.Selections.Values) {
                                CollectTypes(ref types, value.TargetType, value);
                            }
                    }
                    break;
            }
        }
    }
}
