using System.Collections.Generic;
using Backend.Gql;
using Backend.Gql.Types.Scalars;

namespace Backend {
    public static partial class Api {
        public static object Devices(Selection query, Response context)
        {
            var pos = new List<Device>();
            if (query.Arguments == null) {
                foreach (var zone in Core.PlcClient.Zones.Values) {
                    var device = new Device { id = zone.id };
                    var position = zone.Position;
                    device.x = position.X;
                    device.y = position.Y;
                    device.z = position.Z;
                    device.errors = zone.Errors;
                    device.warnings = zone.Warnings;
                    device.address = zone.Address;
                    device.progress = zone.Progress;
                    device.mode = (byte) zone.Mode;
                    pos.Add(device);
                }
            } else {
                List<Id64> ids = null;
                foreach (var (key, value) in query.Arguments) {
                    if (key != "id") continue;
                    if (value.IsList)
                        ids = (List<Id64>)value.Value;
                    else
                        ids = new List<Id64> { (Id64)value.Value };
                }

                foreach (var index in ids) {
                    var zone = Core.PlcClient.GetZone(index);
                    var device = new Device { id = zone.id };
                    var position = zone.Position;
                    device.x = position.X;
                    device.y = position.Y;
                    device.z = position.Z;
                    device.errors = zone.Errors;
                    device.warnings = zone.Warnings;
                    device.address = zone.Address;
                    device.progress = zone.Progress;
                    device.mode = (byte)zone.Mode;
                    pos.Add(device);
                }
            }

            return new Map<Device>("devices", pos);
        }
    }
}