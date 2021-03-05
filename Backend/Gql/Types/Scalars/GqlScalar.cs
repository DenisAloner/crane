namespace Backend.Gql.Types.Scalars {
    public abstract class GqlScalar<T> : GqlType<T> {
        public override object Resolve(Selection query, object obj, Response response) => obj;
        public override IGqlType HasSelection(string key) => null;
        public override IGqlType HasArgument(string key) => null;
        public override object CollectObjects(Selection query, object[] objects, ref int index) => null;
    }
}