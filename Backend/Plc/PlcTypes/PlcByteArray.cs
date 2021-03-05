using System;
using System.Diagnostics;
using System.Reflection;

namespace Backend.Plc.PlcTypes
{
    public class PlcArray<TType> : IPlcType
    {
        public static IPlcType ElementType = PlcTypeMapper.GetPlcType(typeof(TType));
        public int Size { get; }
        public readonly int ArraySize;

        public PlcArray(int arraySize)
        {
            ArraySize = arraySize;
            Size = ElementType.Size * arraySize;
        }

        public object Read(ref byte[] bytes, ref int index)
        {
            if ((index & 1) != 0)
            {
                index++;
            }
            var propertyValue = new TType[ArraySize];
            for (var i = 0; i < ArraySize; i++)
            {
                propertyValue[i] = (TType)ElementType.Read(ref bytes, ref index);
            }
            return propertyValue;
        }

        public void Write(ref byte[] bytes, ref int index, object value)
        {
            var valueArray = value as TType[];
            for (var i = 0; i < ArraySize; i++)
            {
                ElementType.Write(ref bytes, ref index, valueArray[i]);
            }
        }
    }

    public class PlcByteArray : IPlcType
    {
        public int Size { get; }
        public readonly int ArraySize;

        public PlcByteArray(int arraySize)
        {
            ArraySize = arraySize;
            Size = arraySize;
        }

        public object Read(ref byte[] bytes, ref int index)
        {
            if ((index & 1) != 0)
            {
                index++;
            }
            var propertyValue = new byte[Size];
            Array.Copy(bytes, index, propertyValue, 0, Size);
            index += Size;
            return propertyValue;
        }

        public void Write(ref byte[] bytes, ref int index, object value)
        {
            var valueArray = value as byte[];
            Array.Copy(valueArray, 0, bytes, index, Size);
            index += Size;
        }
    }
}