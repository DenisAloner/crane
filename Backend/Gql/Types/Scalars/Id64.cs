using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using Dapper;
using NpgsqlTypes;

namespace Backend.Gql.Types.Scalars
{
    public readonly struct Id64: IEquatable<Id64> {

        private readonly long _value;

        public const int Size = sizeof(long);

        public override int GetHashCode()
        {
            return _value.GetHashCode();
        }

        public Id64(long value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value.ToString("x");
        }

        public static explicit operator Id64(long value)
        {
            return new Id64(value);
        }

        public static explicit operator long(Id64 value)
        {
            return value._value;
        }

        public static bool operator ==(Id64 a, Id64 b)
        {
            return a._value == b._value;
        }

        public static bool operator !=(Id64 a, Id64 b)
        {
            return a._value != b._value;
        }

        public bool Equals(Id64 other)
        {
            return _value == other._value;
        }

        public override bool Equals(object obj)
        {
            return obj is Id64 other && Equals(other);
        }

        public static bool TryParse(string value,out Id64 result)
        {
            if (!long.TryParse(value, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var number))
            {
                result = default;
                return false;
            }
            result = new Id64(number);
            return true;
        }
    }

    public class Id64Handler : SqlMapper.TypeHandler<Id64> {
        public override Id64 Parse(object value)
        {
            return (Id64) (long) value;
        }

        public override void SetValue(IDbDataParameter parameter, Id64 value)
        {
            parameter.Value = (long) value;
        }
    }

    public class Id64ListHandler : SqlMapper.TypeHandler<List<Id64>> {
        public override List<Id64> Parse(object value)
        {
            // TODO: реализовать, чтобы можно было обрабатывать возвращаемый из базы данных long[]
            throw new NotImplementedException();
        }

        public override void SetValue(IDbDataParameter parameter, List<Id64> value)
        {
            parameter.Value = value.Select(x => (long) x).ToList();
        }
    }

    //public class Id64Parameter : SqlMapper.ICustomQueryParameter {
    //    private readonly Id64 _value;

    //    public Id64Parameter(Id64 value)
    //    {
    //        _value = value;
    //    }

    //    public void AddParameter(IDbCommand command, string name)
    //    {
    //        var parameter = new NpgsqlParameter {
    //            ParameterName = name,
    //            Value = _value,
    //            DataTypeName = "id64"
    //        };
    //        command.Parameters.Add(parameter);
    //    }
    //}
}