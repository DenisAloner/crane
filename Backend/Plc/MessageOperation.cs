using System;
using System.Diagnostics;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Backend.Plc.PlcTypes;

namespace Backend.Plc {
    public class MessageOperation : Message
    {
        [UsedForPlc] public Id64 Operation { get; set; }
        [UsedForPlc] public OperationTypes OperationType { get; set; }
        [UsedForPlc] public AddressDefinition Address1 { get; set; }
        [UsedForPlc] public AddressDefinition Address2 { get; set; }
        [UsedForPlc] public AddressDefinition Address3 { get; set; }
        [UsedForPlc] public short IsVirtual { get; set; }

        public MessageOperation()
        {

        }

        public MessageOperation(Id64 zone, Id64 message,Id64 operation, OperationTypes operationType, AddressDefinition address1, AddressDefinition address2, AddressDefinition address3, short isVirtual) : base(zone, Messages.RUN_TASK, message)
        {
            Operation = operation;
            OperationType = operationType;
            Address1 = address1;
            Address2 = address2;
            Address3 = address3;
            IsVirtual = isVirtual;
        }

        public override byte[] GetBytes()
        {
            var t1 = DateTime.UtcNow;
            Debug.WriteLine($"MessageOperation: ${t1}");
            return PlcClass<MessageOperation>.GetBytes(this);
        }
    }
}