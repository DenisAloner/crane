using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Backend.Plc.PlcTypes;

namespace Backend.Plc {
    public class MessageChangeMode : Message {
        [UsedForPlc] public Modes Mode { get; set; }

        public MessageChangeMode()
        {
        }

        public MessageChangeMode(Id64 zone, Modes mode) : base(zone,Messages.CHANGE_MODE, default)
        {
            Mode = mode;
        }

        public override byte[] GetBytes()
        {
            return PlcClass<MessageChangeMode>.GetBytes(this);
        }
    }
}