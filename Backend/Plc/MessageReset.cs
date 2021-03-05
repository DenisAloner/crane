using Backend.Gql.Types.Scalars;
using Backend.Plc.PlcTypes;

namespace Backend.Plc
{
    public class MessageReset : Message
    {

        public MessageReset()
        {
        }
        public MessageReset(Id64 zone) : base(zone,Messages.RESET, default)
        {
        }

        public override byte[] GetBytes()
        {
            return PlcClass<MessageReset>.GetBytes(this);
        }
    }
}