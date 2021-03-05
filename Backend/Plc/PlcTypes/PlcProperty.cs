using System;
using System.Reflection;

namespace Backend.Plc.PlcTypes
{

    public interface IPlcType
    {
        int Size { get; }
        public object Read(ref byte[] bytes, ref int index);

        public void Write(ref byte[] bytes, ref int index,object value);
    }

    public interface IPlcProperty
    {
        int Size { get; }
        public void WriteProperty(ref byte[] bytes, ref int index, object value);
        public void ReadProperty(ref byte[] bytes, ref int index, object value);
    }

    public class PlcProperty<TClass, TType> : IPlcProperty
    {
        public static IPlcType PropertyType = PlcTypeMapper.GetPlcType(typeof(TType));
        public readonly Func<TClass, TType> Getter;
        public readonly Action<TClass, TType> Setter;

        public PlcProperty(PropertyInfo propertyInfo)
        {
            Getter = (Func<TClass, TType>)Delegate.CreateDelegate(typeof(Func<TClass, TType>), propertyInfo.GetMethod);
            Setter = (Action<TClass, TType>)Delegate.CreateDelegate(typeof(Action<TClass, TType>), propertyInfo.SetMethod);
        }

        public int Size => PropertyType.Size;

        public void WriteProperty(ref byte[] bytes, ref int index, object value)
        {
            PropertyType.Write(ref bytes, ref index, Getter((TClass) value));
        }

        public void ReadProperty(ref byte[] bytes, ref int index, object value)
        {
            Setter((TClass) value, (TType) PropertyType.Read(ref bytes, ref index));
        }

    }

    public class PlcPropertyArray<TClass, TType> : IPlcProperty
    {
        public readonly IPlcType PropertyType;
        public readonly Func<TClass, TType[]> Getter;
        public readonly Action<TClass, TType[]> Setter;

        public PlcPropertyArray(PropertyInfo propertyInfo,int size)
        {
            PropertyType = new PlcArray<TType>(size);
            Getter = (Func<TClass, TType[]>)Delegate.CreateDelegate(typeof(Func<TClass, TType[]>), propertyInfo.GetMethod);
            Setter = (Action<TClass, TType[]>)Delegate.CreateDelegate(typeof(Action<TClass, TType[]>), propertyInfo.SetMethod);
        }

        public int Size => PropertyType.Size;

        public void WriteProperty(ref byte[] bytes, ref int index, object value)
        {
            PropertyType.Write(ref bytes, ref index, Getter((TClass)value));
        }

        public void ReadProperty(ref byte[] bytes, ref int index, object value)
        {
            Setter((TClass)value, (TType[])PropertyType.Read(ref bytes, ref index));
        }
    }
    public class PlcPropertyByteArray<TClass> : IPlcProperty
    {
        public readonly IPlcType PropertyType;
        public readonly Func<TClass, byte[]> Getter;
        public readonly Action<TClass, byte[]> Setter;

        public PlcPropertyByteArray(PropertyInfo propertyInfo, int size)
        {
            PropertyType = new PlcByteArray(size);
            Getter = (Func<TClass, byte[]>)Delegate.CreateDelegate(typeof(Func<TClass, byte[]>), propertyInfo.GetMethod);
            Setter = (Action<TClass, byte[]>)Delegate.CreateDelegate(typeof(Action<TClass, byte[]>), propertyInfo.SetMethod);
        }

        public int Size => PropertyType.Size;

        public void WriteProperty(ref byte[] bytes, ref int index, object value)
        {
            PropertyType.Write(ref bytes, ref index, Getter((TClass)value));
        }

        public void ReadProperty(ref byte[] bytes, ref int index, object value)
        {
            Setter((TClass)value, (byte[])PropertyType.Read(ref bytes, ref index));
        }
    }
}
