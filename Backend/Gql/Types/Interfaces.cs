namespace Backend.Gql.Types {
    public interface INullable {
    }

    public interface IHasId {
        object GetId { get; }
    }
}