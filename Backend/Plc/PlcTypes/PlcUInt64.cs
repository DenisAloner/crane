using System;
using System.Reflection;

namespace Backend.Plc.PlcTypes
{
    public class PlcUInt64 : IPlcType
    {
        public int Size => 8;
        public void Write(ref byte[] bytes, ref int index, object value)
        {
            if ((index & 1) != 0)
            {
                index++;
            }
            var valueBytes = BitConverter.GetBytes((ulong)value);
            bytes[index] = valueBytes[7];
            index++;
            bytes[index] = valueBytes[6];
            index++;
            bytes[index] = valueBytes[5];
            index++;
            bytes[index] = valueBytes[4];
            index++;
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
            valueBytes[7] = bytes[index];
            index++;
            valueBytes[6] = bytes[index];
            index++;
            valueBytes[5] = bytes[index];
            index++;
            valueBytes[4] = bytes[index];
            index++;
            valueBytes[3] = bytes[index];
            index++;
            valueBytes[2] = bytes[index];
            index++;
            valueBytes[1] = bytes[index];
            index++;
            valueBytes[0] = bytes[index];
            index++;
            return BitConverter.ToUInt64(valueBytes);
        }
    }

    public class PlcSInt64 : IPlcType
    {
        public int Size => 8;
        public void Write(ref byte[] bytes, ref int index, object value)
        {
            if ((index & 1) != 0)
            {
                index++;
            }
            var valueBytes = BitConverter.GetBytes((long)value);
            bytes[index] = valueBytes[7];
            index++;
            bytes[index] = valueBytes[6];
            index++;
            bytes[index] = valueBytes[5];
            index++;
            bytes[index] = valueBytes[4];
            index++;
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
            valueBytes[7] = bytes[index];
            index++;
            valueBytes[6] = bytes[index];
            index++;
            valueBytes[5] = bytes[index];
            index++;
            valueBytes[4] = bytes[index];
            index++;
            valueBytes[3] = bytes[index];
            index++;
            valueBytes[2] = bytes[index];
            index++;
            valueBytes[1] = bytes[index];
            index++;
            valueBytes[0] = bytes[index];
            index++;
            return BitConverter.ToInt64(valueBytes);
        }
    }
}