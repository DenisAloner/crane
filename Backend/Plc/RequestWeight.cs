using System.Data;
using System.Diagnostics;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend.Plc {
    public class RequestWeight : RequestStatus {

        protected float Weight;

        public RequestWeight(Status status, Id64 message, RequestTypes request, float weight) : base(status, message, request)
        {
            Weight = weight;
        }

        public override void Execute(IDbConnection connection, IDbTransaction tran, Id64 zone)
        {
            connection.Execute(
                "UPDATE zones SET status=@status,message=@message,request=@request WHERE zones.id=@zone",
                new { status = (short)Status, zone, message = Message, request = (short)Request }, tran);
            connection.Execute("set_weight", new { _zone = zone, _weight = Weight }, tran, commandType: CommandType.StoredProcedure);
            Debug.WriteLine($"RequestWeight {Status}");
        }
    }
}
