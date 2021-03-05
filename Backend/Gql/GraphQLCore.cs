using System;
using System.Collections.Generic;
using System.Net;
using Backend.Gql.Types;
using Backend.Gql.Types.Scalars;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Backend.Gql {

    [AttributeUsage(AttributeTargets.Property)]
    public class GqlProperty : Attribute {
        public GqlProperty(string name = null, string column = null, bool isDbValue = true, Type type = null)
        {
            Type = type;
            Name = name;
            SqlColumn = column;
            IsDbValue = isDbValue;
        }

        public string SqlColumn { get; set; }
        public string Name { get; set; }
        public bool IsDbValue { get; set; }
        public Type Type { get; set; }
    }

    public class Id64Converter : JsonConverter {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(Id64);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            switch (reader.Value) {
                case string value: return long.Parse(value);
                default: return (long)reader.Value;
            }
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            writer.WriteValue(value.ToString());
        }
    }

    class IPAddressConverter : JsonConverter {
        public override bool CanConvert(Type objectType)
        {
            return (objectType == typeof(IPAddress));
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            writer.WriteValue(value.ToString());
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            return IPAddress.Parse((string)reader.Value);
        }
    }

    class IPEndPointConverter : JsonConverter {
        public override bool CanConvert(Type objectType)
        {
            return (objectType == typeof(IPEndPoint));
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            var ep = (IPEndPoint)value;
            var jObject = new JObject { { "Address", JToken.FromObject(ep.Address, serializer) }, { "Port", ep.Port } };
            jObject.WriteTo(writer);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            var jObject = JObject.Load(reader);
            var address = jObject["Address"].ToObject<IPAddress>(serializer);
            var port = (int)jObject["Port"];
            return new IPEndPoint(address, port);
        }
    }

    public class DateTimeConverter : JsonConverter {
        private static readonly DateTime Epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        public override bool CanConvert(Type objectType)
        {
            return (objectType == typeof(DateTime));
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            writer.WriteValue(((DateTime)value - Epoch).TotalMilliseconds);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            //return IPAddress.ParseQueries((string)reader.Value);
            throw new NotImplementedException();
        }
    }

    public enum Privileges {
        USERS_EDIT,
        UNITS_EDIT,
        REASONS_EDIT,
        ZONES_EDIT,
        NOMENCLATURES_EDIT,
        OWNERS_EDIT,
        PRODUCT_TYPES_EDIT,
        SERVICE_ALLOWED
    }

    public enum Directions {
        NONE,
        ARRIVAL,
        ISSUE,
        ANY
    }

    public enum AddressTypes : short {
        DESK = 1,
        ODD_CELL = 2,
        EVEN_CELL = 3
    }

    public enum OperationTypes : short {
        DESK_TO_CELL = 1,
        CELL_TO_DESK = 2,
        CELL_TO_CELL = 3,
        CELL_TO_DESK_TO_CELL = 4,
        CELL_TO_DESK_TO_CELL_WITHOUT_CONFIRMATION = 5
    }

    public enum Modes : byte {
        MANUAL = 1,
        AUTO = 2
    }

    public enum States : short {
        UNLOCKED = 1,
        LOCKED = 2
    }

    public class UniqueObject : IHasId {
        [GqlProperty] public Id64 id { get; set; }
        public virtual object GetId => id.ToString();
    }

    public class User : UniqueObject {
        [GqlProperty] public string login { get; set; }
        [GqlProperty] public string password { get; set; }
        [GqlProperty] public Privileges[] privileges { get; set; }
        [GqlProperty] public string full_name { get; set; }
        [GqlProperty] public string personnel_number { get; set; }
    }

    public class Reason : UniqueObject {
        [GqlProperty] public string name { get; set; }
        [GqlProperty] public Directions direction { get; set; }
        [GqlProperty] public Owner owner { get; set; }
    }

    public class Operation : UniqueObject {
        [GqlProperty] public Address destination { get; set; }
        [GqlProperty] public float weight { get; set; }
        [GqlProperty(SqlColumn = "user_id")] public User user { get; set; }
        [GqlProperty] public DateTime time_stamp { get; set; }
    }

    public class Change : UniqueObject {
        [GqlProperty] public Address source { get; set; }
        [GqlProperty] public Operation operation { get; set; }
        [GqlProperty] public Nomenclature nomenclature { get; set; }
        [GqlProperty] public float quantity { get; set; }
        [GqlProperty] public Owner owner { get; set; }
        [GqlProperty] public float increment { get; set; }
        [GqlProperty] public Reason reason { get; set; }
        [GqlProperty] public string basis { get; set; }
    }

    public class Warehouse : Change {
        [GqlProperty] public States state { get; set; }
    }

    public class Unit : UniqueObject {
        [GqlProperty] public string name { get; set; }
    }

    public class ProductType : UniqueObject {
        [GqlProperty] public string name { get; set; }
    }

    public class Nomenclature : UniqueObject {
        [GqlProperty] public string designation { get; set; }
        [GqlProperty] public string name { get; set; }
        [GqlProperty] public Unit unit { get; set; }
        [GqlProperty] public ProductType product_type { get; set; }
    }

    public class Owner : UniqueObject {
        [GqlProperty] public string name { get; set; }
    }

    public class Address : UniqueObject {
        [GqlProperty] public AddressTypes type { get; set; }
        [GqlProperty] public string name { get; set; }
        [GqlProperty] public Zone zone { get; set; }
        [GqlProperty] public int x { get; set; }
        [GqlProperty] public int y { get; set; }
        [GqlProperty] public int z { get; set; }
        [GqlProperty] public States state { get; set; }
    }

    public class UncommittedOperation : Operation {
        [GqlProperty] public Address source { get; set; }
        [GqlProperty] public OperationTypes type { get; set; }
        [GqlProperty] public bool is_virtual { get; set; }
    }

    public class UncommittedChange : UniqueObject {
        [GqlProperty] public UncommittedOperation uncommitted_operation { get; set; }
        [GqlProperty] public Nomenclature nomenclature { get; set; }
        [GqlProperty] public float increment { get; set; }
        [GqlProperty] public Reason reason { get; set; }
        [GqlProperty] public Owner owner { get; set; }
        [GqlProperty] public string basis { get; set; }
    }

    public class Zone : UniqueObject {
        [GqlProperty] public UncommittedOperation uncommitted_operation { get; set; }
        [GqlProperty] public short status { get; set; }
        [GqlProperty] public short request { get; set; }
        [GqlProperty] public Id64 message { get; set; }
    }

    public class Device : UniqueObject {
        [GqlProperty] public int x { get; set; }
        [GqlProperty] public int y { get; set; }
        [GqlProperty] public int z { get; set; }
        [GqlProperty] public uint[] errors { get; set; }
        [GqlProperty] public uint[] warnings { get; set; }
        [GqlProperty] public short address { get; set; }
        [GqlProperty] public short progress { get; set; }
        [GqlProperty] public byte mode { get; set; }
    }

    public class WebWorker : IHasId {
        [GqlProperty(IsDbValue = false)] public long id { get; set; }
        [GqlProperty(IsDbValue = false)] public string ip { get; set; }
        [GqlProperty] public User user { get; set; }
        public object GetId => $"worker{id}";
    }


    public interface IMap : IHasId {
        IEnumerable<IHasId> Items { get; set; }
    }

    public class Map<T> : IMap where T : IHasId {
        public readonly string Id;
        public IEnumerable<IHasId> Items { get; set; }

        public Map(string id, IEnumerable<T> items)
        {
            Id = id;
            Items = (IEnumerable<IHasId>)items;
        }

        public object GetId => Id;
    }

}
