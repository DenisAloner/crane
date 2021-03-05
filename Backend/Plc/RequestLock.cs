using System;
using System.Data;
using System.Diagnostics;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend.Plc
{
    class RequestLock : RequestStatus
    {

        public readonly Id64 Operation;
        public readonly short Address;

        public RequestLock(Status status, Id64 message, RequestTypes request, Id64 operation, short address) : base(status, message, request)
        {
            Operation = operation;
            Address = address;
        }
        public override void Execute(IDbConnection connection, IDbTransaction tran, Id64 zone)
        {
            connection.Execute(
                "UPDATE zones SET status=@status,message=@message,request=@request WHERE zones.id=@zone",
                new { status = (short)Status, zone, message = Message, request = (short)Request }, tran);
            Debug.WriteLine(Address);
            connection.Execute(Address switch
            {
                1 => "lock_source_address",
                2 => "lock_destination_address",
                _ => throw new Exception("Невалидный тип адреса")
            }, new { _uncommitted_operation = Operation }, tran, commandType: CommandType.StoredProcedure);
            Debug.WriteLine($"RequestOperation {Status}");
        }
    }

    class RequestUnlock : RequestStatus
    {

        public readonly Id64 Operation;
        public readonly short Address;

        public RequestUnlock(Status status, Id64 message, RequestTypes request, Id64 operation, short address) : base(status, message, request)
        {
            Operation = operation;
            Address = address;
        }
        public override void Execute(IDbConnection connection, IDbTransaction tran, Id64 zone)
        {
            connection.Execute(
                "UPDATE zones SET status=@status,message=@message,request=@request WHERE zones.id=@zone",
                new { status = (short)Status, zone, message = Message, request = (short)Request }, tran);
            Debug.WriteLine(Address);
            connection.Execute(Address switch
            {
                1 => "unlock_source_address",
                2 => "unlock_destination_address",
                _ => throw new Exception("Невалидный тип адреса")
            }, new { _uncommitted_operation = Operation }, tran, commandType: CommandType.StoredProcedure);
            Debug.WriteLine($"RequestOperation {Status}");
        }
    }
}