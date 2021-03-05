using System.Data;
using Backend.Gql.Types.Scalars;

namespace Backend.Plc {
    public abstract class Request {
        public abstract void Execute(IDbConnection connection, IDbTransaction tran, Id64 workZone);

    }
}