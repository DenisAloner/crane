using System;
using Backend.Plc.PlcTypes;

namespace Backend.Plc
{
    public class MessageErrors : Message
    {
        public const int ErrorsArraySizeInBytes = 44;
        public const int WarningArraySizeInBytes = 12;

        [UsedForPlcArray(ErrorsArraySizeInBytes)] public byte[] Errors { get; set; }
        [UsedForPlcArray(8)] public ushort[] StackerFcXErrors { get; set; }
        [UsedForPlcArray(8)] public ushort[] StackerFcYErrors { get; set; }
        [UsedForPlcArray(8)] public ushort[] StackerFcZErrors { get; set; }
        [UsedForPlcArray(8)] public ushort[] ConveyorFcErrors { get; set; }
        [UsedForPlcArray(WarningArraySizeInBytes)] public byte[] Warnings { get; set; }
        [UsedForPlcArray(8)] public ushort[] StackerFcXWarnings { get; set; }
        [UsedForPlcArray(8)] public ushort[] StackerFcYWarnings { get; set; }
        [UsedForPlcArray(8)] public ushort[] StackerFcZWarnings { get; set; }
        [UsedForPlcArray(8)] public ushort[] ConveyorFcWarnings { get; set; }

        public MessageErrors()
        {
            Errors = new byte[ErrorsArraySizeInBytes];
            StackerFcXErrors = new ushort[8];
            StackerFcYErrors = new ushort[8];
            StackerFcZErrors = new ushort[8];
            ConveyorFcErrors = new ushort[8];
            Warnings = new byte[WarningArraySizeInBytes];
            StackerFcXWarnings = new ushort[8];
            StackerFcYWarnings = new ushort[8];
            StackerFcZWarnings = new ushort[8];
            ConveyorFcWarnings = new ushort[8];
        }

        public override byte[] GetBytes()
        {
            return PlcClass<MessageErrors>.GetBytes(this);
        }
    }
}