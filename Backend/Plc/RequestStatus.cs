using System.Data;
using System.Diagnostics;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend.Plc {
    public class RequestStatus : Request {
        protected readonly Status Status;
        protected readonly Id64 Message;
        protected readonly RequestTypes Request;

        public RequestStatus(Status status, Id64 message, RequestTypes request)
        {
            Status = status;
            Message = message;
            Request = request;
        }

        public override void Execute(IDbConnection connection, IDbTransaction tran, Id64 zone)
        {
            connection.Execute(
                "UPDATE zones SET status=@status,message=@message,request=@request WHERE zones.id=@zone",
                new { status = (short)Status, zone, message = Message, request = (short)Request}, tran);
            Debug.WriteLine($"RequestStatus {Status}");
        }
    }
}