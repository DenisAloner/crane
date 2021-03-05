using System;

namespace Backend.Plc.PlcTypes
{
    public class PlcUInt16 : IPlcType
    {
        public int Size => 2;
        public void Write(ref byte[] bytes, ref int index, object value)
        {
            if ((index & 1) != 0)
            {
                index++;
            }
            var valueBytes = BitConverter.GetBytes((ushort)value);
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
            var valueBytes = new byte[2];
            valueBytes[1] = bytes[index];
            index++;
            valueBytes[0] = bytes[index];
            index++;
            return BitConverter.ToUInt16(valueBytes);
        }
    }

    public class PlcSInt16 : IPlcType
    {
        public int Size => 2;
        public void Write(ref byte[] bytes, ref int index, object value)
        {
            if ((index & 1) != 0)
            {
                index++;
            }
            var valueBytes = BitConverter.GetBytes((short)value);
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
            var valueBytes = new byte[2];
            valueBytes[1] = bytes[index];
            index++;
            valueBytes[0] = bytes[index];
            index++;
            return BitConverter.ToInt16(valueBytes);
        }
    }
}