namespace Backend.Gql.Types
{
    public interface IGqlExtendedUnique : IGqlUnique {
        IGqlUnique TargetGqlObject { get; }
    }

    public class GqlExtendedUnique<T> : GqlUnique<T>, IGqlExtendedUnique where T : IHasId {
        public IGqlUnique TargetGqlObject { get; }

        public GqlExtendedUnique(string sqlTable,string name) : base(sqlTable,name)
        {
            TargetGqlObject = Schema.UniqueTypes[typeof(T).BaseType];
        }
    }

}