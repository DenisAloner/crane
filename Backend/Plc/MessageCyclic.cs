using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Backend.Plc.PlcTypes;

namespace Backend.Plc {
    public class MessageCyclic : Message {

        [UsedForPlc] public Status Status { get; set; }
        [UsedForPlc] public Modes Mode { get; set; }
        [UsedForPlc] public Position StackerPosition { get; set; }
        [UsedForPlc] public RequestTypes RequestType { get; set; }
        [UsedForPlc] public Id64 OperationId { get; set; }
        [UsedForPlc] public short Address { get; set; }
        [UsedForPlc] public short Progress { get; set; }
        [UsedForPlc] public float Weight { get; set; }

        public MessageCyclic()
        {
            StackerPosition = new Position();
        }

        public override byte[] GetBytes()
        {
            return PlcClass<MessageCyclic>.GetBytes(this);
        }
    }
}