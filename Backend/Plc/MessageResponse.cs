using Backend.Gql.Types.Scalars;
using Backend.Plc.PlcTypes;

namespace Backend.Plc {
    public class MessageResponse : Message {

        public MessageResponse()
        {
        }
        public MessageResponse(Id64 zone, Id64 message) : base(zone, Messages.REQUEST_ACCEPT, message)
        {
        }

        public override byte[] GetBytes()
        {
            return PlcClass<MessageResponse>.GetBytes(this);
        }
    }
}