using System;
using System.Reflection;

namespace Backend.Plc.PlcTypes
{

    public class PlcUInt8 : IPlcType
    {
        public int Size => 1;

        public object Read(ref byte[] bytes, ref int index)
        {
            index++;
            return bytes[index-1];
        }

        public void Write(ref byte[] bytes, ref int index, object value)
        {
            bytes[index] = (byte)value;
            index++;
        }
    }

    public class PlcSInt8 : IPlcType
    {
        public int Size => 1;

        public object Read(ref byte[] bytes, ref int index)
        {
            index++;
            return bytes[index - 1];
        }

        public void Write(ref byte[] bytes, ref int index, object value)
        {
            bytes[index] = (byte) value;
            index++;
        }
    }
}