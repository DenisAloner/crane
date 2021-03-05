using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Diagnostics;
using System.Reflection;
using Backend.Gql;
using Backend.Gql.Types.Scalars;

namespace Backend.Plc.PlcTypes
{
    [AttributeUsage(AttributeTargets.Property)]
    public class UsedForPlc : Attribute
    {
    }

    [AttributeUsage(AttributeTargets.Property)]
    public class UsedForPlcArray : UsedForPlc
    {
        public readonly int Size;

        public UsedForPlcArray(int size)
        {
            Size = size;
        }
    }

    static class PlcTypeMapper
    {

        public static readonly Dictionary<Type, IPlcType> Types = new Dictionary<Type, IPlcType>
        {
            {typeof(byte), new PlcUInt8()},
            {typeof(sbyte), new PlcSInt8()},
            {typeof(ushort), new PlcUInt16()},
            {typeof(short),new PlcSInt16()},
            {typeof(uint),new PlcUInt32()},
            {typeof(int), new PlcSInt32()},
            {typeof(ulong), new PlcUInt64()},
            {typeof(long), new PlcSInt64()},
            {typeof(float),new PlcReal32()},
            {typeof(Id64), new PlcId64()}
        };

        //public static readonly Dictionary<Type, IPlcClass> Classes = new Dictionary<Type, IPlcClass>
        //{
        //};

        public static IPlcType GetPlcType(Type type)
        {
            if (Types.TryGetValue(type, out var plcType)) return plcType;
            Debug.WriteLine($"Тип <{type}> не зарегистрирован");
            Environment.Exit(Environment.ExitCode);
            throw new Exception("Error");
        }

        static PlcTypeMapper()
        {
            RegisterEnum<Messages>();
            RegisterEnum<Modes>();
            RegisterEnum<OperationTypes>();
            RegisterEnum<AddressTypes>();
            RegisterEnum<Status>();
            RegisterEnum<RequestTypes>();
            Types.Add(typeof(AddressDefinition),new PlcClass<AddressDefinition>());
            Types.Add(typeof(Position),new PlcClass<Position>());
            Types.Add(typeof(MessageCyclic), new PlcClass<MessageCyclic>());
        }

        //public static Func<Type, PropertyInfo, IPlcType> Register(Type generic)
        //{
        //    return (type, propertyInfo) => Activator.CreateInstance(generic.MakeGenericType(type), propertyInfo) as IPlcType;
        //}

        //public static Func<Type, PropertyInfo, IPlcType> RegisterComplex(Type c)
        //{
        //    return (type, propertyInfo) => Activator.CreateInstance(typeof(PlcPropertyClass<,>).MakeGenericType(type, c), propertyInfo) as IPlcType;
        //}

        public static void RegisterEnum<T>() where T : Enum
        {
            Types.Add(typeof(T), Types[Enum.GetUnderlyingType(typeof(T))]);
        }
    }


    public interface IPlcClass : IPlcType
    {
        public ImmutableList<IPlcProperty> Props { get; }
    }

    public class PlcClass<T> : IPlcClass where T : new()
    {
        public static ImmutableList<IPlcProperty> _Props { get; }
        public static int _Size { get; }
        public ImmutableList<IPlcProperty> Props => _Props;

        public int Size => _Size;

        static PlcClass()
        {
            var type = typeof(T);
            var typeOrder = new List<Type>();
            do
            {
                typeOrder.Insert(0, type);
                type = type.BaseType;
            } while (type != null);
            var size = 0;
            var props = new List<IPlcProperty>();
            try
            {
                foreach (var currentType in typeOrder)
                {
                    var propertyInfos = currentType.GetProperties(BindingFlags.Public | BindingFlags.Instance |
                                                      BindingFlags.DeclaredOnly);
                    foreach (var propertyInfo in propertyInfos)
                    {
                        var customAttributes = propertyInfo.GetCustomAttributes(typeof(UsedForPlc), false);
                        foreach (var customAttribute in customAttributes)
                        {
                            Debug.WriteLine($"{typeof(T)}.{propertyInfo.Name}");
                            switch (customAttribute)
                            {
                                case UsedForPlcArray array:
                                    {
                                        if (!propertyInfo.PropertyType.IsArray)
                                        {
                                            Debug.WriteLine($"Тип <{propertyInfo.PropertyType}> не является Array");
                                            Environment.Exit(Environment.ExitCode);
                                        }

                                        var elementType = propertyInfo.PropertyType.GetElementType();
                                        IPlcProperty plcType;
                                        if (elementType == typeof(byte))
                                        {
                                            plcType = Activator.CreateInstance(typeof(PlcPropertyByteArray<>).MakeGenericType(typeof(T)), propertyInfo, array.Size) as IPlcProperty;
                                        }
                                        else
                                        {
                                            plcType = Activator.CreateInstance(typeof(PlcPropertyArray<,>).MakeGenericType(typeof(T), elementType), propertyInfo, array.Size) as IPlcProperty;
                                        }
                                        props.Add(plcType);
                                        if (plcType.Size > 1 && (size & 1) != 0)
                                        {
                                            size++;
                                        }
                                        size += plcType.Size;
                                        Debug.WriteLine($"{typeof(T)}.{propertyInfo.Name} size: {plcType.Size}, total: {size}");
                                    }
                                    break;
                                case UsedForPlc _:
                                    {
                                        var plcType = Activator.CreateInstance(typeof(PlcProperty<,>).MakeGenericType(typeof(T), propertyInfo.PropertyType), propertyInfo) as IPlcProperty;
                                        props.Add(plcType);
                                        if (plcType.Size > 1 && (size & 1) != 0)
                                        {
                                            size++;
                                        }
                                        size += plcType.Size;
                                        Debug.WriteLine($"{typeof(T)}.{propertyInfo.Name} size: {plcType.Size}, total: {size}");
                                    }
                                    break;
                            }
                        }
                    }
                }
                _Size = size;
                Debug.WriteLine($"{typeof(T)} size is {_Size}");
                _Props = props.ToImmutableList();
            }
            catch (Exception e)
            {
                Debug.WriteLine(e);
                throw;
            }

        }

        public static byte[] GetBytes(T value)
        {
            var result = new byte[_Size];
            var index = 0;
            foreach (var prop in _Props)
            {
                prop.WriteProperty(ref result, ref index, value);
            }
            return result;
        }

        public static T GetMessage(byte[] bytes)
        {
            var result = new T();
            var index = 0;
            foreach (var prop in _Props)
            {
                prop.ReadProperty(ref bytes, ref index, result);
            }
            return result;
        }

        public virtual void Write(ref byte[] bytes, ref int index, object value)
        {
            foreach (var prop in Props)
            {
                prop.WriteProperty(ref bytes, ref index, value);
            }
        }

        public object Read(ref byte[] bytes, ref int index)
        {
            var result = new T();
            foreach (var prop in Props)
            {
                prop.ReadProperty(ref bytes, ref index, result);
            }
            return result;
        }

    }

    //public sealed class PlcPropertyClass<TClass, TType> : IPlcProperty where TType : new()
    //{
    //    public static IPlcClass PropertyType = PlcTypeMapper.Classes[typeof(TType)];
    //    public readonly Func<TClass, TType> Getter;
    //    public readonly Action<TClass, TType> Setter;

    //    public PlcPropertyClass(PropertyInfo propertyInfo)
    //    {
    //        Getter = (Func<TClass, TType>)Delegate.CreateDelegate(typeof(Func<TClass, TType>), propertyInfo.GetMethod);
    //        Setter = (Action<TClass, TType>)Delegate.CreateDelegate(typeof(Action<TClass, TType>), propertyInfo.SetMethod);
    //    }

    //    public int Size => PropertyType.Size;

    //    public void WriteProperty(ref byte[] bytes, ref int index, object value)
    //    {
    //        var propertyValue = Getter((TClass)value);
    //        foreach (var prop in PropertyType.Props)
    //        {
    //            prop.WriteProperty(ref bytes, ref index, propertyValue);
    //        }
    //    }

    //    public void ReadProperty(ref byte[] bytes, ref int index, object value)
    //    {
    //        var propertyValue = new TType();
    //        foreach (var prop in PropertyType.Props)
    //        {
    //            prop.ReadProperty(ref bytes, ref index, propertyValue);
    //        }
    //        Setter((TClass)value, propertyValue);
    //    }

    //}
}
