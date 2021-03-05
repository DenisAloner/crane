using Backend.Gql.Types.Scalars;
using Backend.Plc.PlcTypes;

namespace Backend.Plc {
    public enum Messages : short {
        CURRENT_DATA = 1,
        ERRORS_WARNINGS = 2,
        SERVICE = 3,
        AXIS_SERVICE = 4,
        RESET = 9,
        RUN_TASK = 10,
        CANCEL_TASK = 11,
        REQUEST_ACCEPT = 12,
        CHANGE_BYPASS = 15,
        CHANGE_MODE = 16,
    }

    public class Message
    {
        [UsedForPlc] public Id64 Zone { get; set; }
        [UsedForPlc] public Messages Type { get; set; }
        [UsedForPlc] public Id64 Id { get; set; }

        public virtual byte[] GetBytes()
        {
            return PlcClass<Message>.GetBytes(this);
        }

        public Message()
        {
        }

        protected Message(Id64 zone, Messages type, Id64 id)
        {
            Zone = zone;
            Type = type;
            Id = id;
        }
    }
}