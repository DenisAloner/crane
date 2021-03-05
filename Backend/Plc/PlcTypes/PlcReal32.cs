using System;

namespace Backend.Plc.PlcTypes
{
    public class PlcReal32 : IPlcType
    {

        public int Size => 4;
        public void Write(ref byte[] bytes, ref int index, object value)
        {
            if ((index & 1) != 0)
            {
                index++;
            }
            var valueBytes = BitConverter.GetBytes((float)value);
            bytes[index] = valueBytes[3];
            index++;
            bytes[index] = valueBytes[2];
            index++;
            bytes[index] = valueBytes[1];
            index++;
            bytes[index] = valueBytes[0];
            index++;
        }

        public object Read(ref byte[] bytes, ref int index)
        {
            if ((index & 1) != 0)
            {
                index++;
            }
            var valueBytes = new byte[8];
            valueBytes[3] = bytes[index];
            index++;
            valueBytes[2] = bytes[index];
            index++;
            valueBytes[1] = bytes[index];
            index++;
            valueBytes[0] = bytes[index];
            index++;
            return BitConverter.ToSingle(valueBytes);
        }
    }
}