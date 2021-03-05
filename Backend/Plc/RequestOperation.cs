using System.Data;
using System.Diagnostics;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend.Plc
{
    class RequestOperation : RequestStatus
    {

        public readonly Id64 Operation;

        public RequestOperation(Status status, Id64 message, RequestTypes request, Id64 operation) : base(status, message, request)
        {
            Operation = operation;
        }
        public override void Execute(IDbConnection connection, IDbTransaction tran, Id64 zone)
        {
            connection.Execute(
                "UPDATE zones SET status=@status,message=@message,request=@request WHERE zones.id=@zone",
                new { status = (short)Status, zone, message = Message, request = (short)Request }, tran);
            connection.Execute("done_operation", new { _uncommitted_operation = Operation }, tran, commandType: CommandType.StoredProcedure);
            Debug.WriteLine($"RequestOperation {Status}");
        }
    }
}
