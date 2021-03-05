using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text;
using Backend.Gql.Types;
using Backend.Gql.Types.Scalars;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Backend.Gql {
    public sealed class Schema : IGqlType {
        public static Dictionary<Type, IGqlType> GqlTypes = new Dictionary<Type, IGqlType>();
        public static Dictionary<Type, IGqlUnique> UniqueTypes = new Dictionary<Type, IGqlUnique>();
        public static Dictionary<string, IGqlUnique> ResolveTypes = new Dictionary<string, IGqlUnique>();
        public static Dictionary<string, GqlQuery> Queries = new Dictionary<string, GqlQuery>();

        private static readonly Lazy<Schema> Lazy = new Lazy<Schema>(() => new Schema());


        private static void AddType(IGqlUnique type)
        {
            GqlTypes.Add(type.GetClrType(), type);
            UniqueTypes.Add(type.GetClrType(), type);
            ResolveTypes.Add(type.GetClrType().Name, type);
        }

        private static void RegisterTypes()
        {
            foreach (var gqlObjectType in UniqueTypes.Values) {
                List<(PropertyInfo PropInfo, GqlProperty MappedName, string SqlTable)> propertyInfos = null;
                switch (gqlObjectType) {
                    case IGqlExtendedUnique gqlType: {
                            propertyInfos = gqlType.GetClrType().GetProperties(BindingFlags.Public
                                                                   | BindingFlags.Instance
                                                                   | BindingFlags.DeclaredOnly)
                                .Where(_ => _.GetCustomAttributes(typeof(GqlProperty), false).Length > 0).Select(_ => (PropInfo: _, MappedName: (GqlProperty)_.GetCustomAttributes(typeof(GqlProperty), false).First(), SqlTable: gqlType.SqlTable)).ToList();
                        }
                        propertyInfos.AddRange(gqlType.GetClrType().BaseType.GetProperties()
                            .Where(_ => _.GetCustomAttributes(typeof(GqlProperty), false).Length > 0).Select(_ => (PropInfo: _, MappedName: (GqlProperty)_.GetCustomAttributes(typeof(GqlProperty), false).First(), SqlTable: gqlType.TargetGqlObject.SqlTable)).ToList());
                        break;
                    case { } gqlType: {
                            propertyInfos = gqlType.GetClrType().GetProperties()
                                .Where(_ => _.GetCustomAttributes(typeof(GqlProperty), false).Length > 0).Select(_ => (PropInfo: _, MappedName: (GqlProperty)_.GetCustomAttributes(typeof(GqlProperty), false).First(), SqlTable: gqlType.SqlTable)).ToList();
                        }
                        break;
                }
                if (propertyInfos == null || !propertyInfos.Any()) continue;
                foreach (var (property, gqlInfo, sqlTable) in propertyInfos) {
                    Console.WriteLine($"[ TYPE ] {gqlInfo.Name ?? property.Name}");
                    if (property.PropertyType.IsArray) {
                        gqlObjectType.Fields.Add(gqlInfo.Name ?? property.Name,
                            new GqlField((IGqlType)Activator.CreateInstance(typeof(GqlList<>).MakeGenericType(GqlTypes[property.PropertyType.GetElementType()].GetType())), property, gqlInfo.IsDbValue, gqlInfo.SqlColumn ?? property.Name, sqlTable, property.Name));
                        continue;
                    }
                    if (!GqlTypes.TryGetValue(gqlInfo.Type != null ? gqlInfo.Type : property.PropertyType, out var gqlType)) {
                        throw new Exception($"GQL: Not found type <${property.PropertyType}>");
                    }
                    gqlObjectType.Fields.Add(gqlInfo.Name ?? property.Name,
                    new GqlField(gqlType, property, gqlInfo.IsDbValue, gqlInfo.SqlColumn ?? property.Name, sqlTable, property.Name));
                }
            }
        }

        public void RegisterQuery(string name, Func<Selection, Response, object> fn, IGqlType returnGqlType, GqlArgumentsList args = null, bool isPublic = false)
        {
            var query = new GqlQuery { Name = name, Resolver = fn, ReturnType = returnGqlType, Arguments = args, IsPublic = isPublic };
            Queries.Add(name, query);
        }

        public void RegisterUpdateQueries<T>(string nameTemplate) where T : UniqueObject
        {
            nameTemplate = $"{nameTemplate}_update_";
            var type = UniqueTypes[typeof(T)];
            foreach (var (key, field) in type.Fields) {
                if (key == "id") continue;
                var gqlType = field.Value is IGqlUnique ? new GqlId64() : field.Value;
                RegisterQuery($"{nameTemplate}{key}", (token, context) => {
                    var result = Backend.Api.Set<T>(token, context, key);
                    return result;
                }, new GqlBool(), new GqlArgumentsList
                {
                    {"id",new GqlNonNullId64()},
                    {"old",gqlType},
                    {"new",gqlType}
                });
            }
        }

        private Schema()
        {
            GqlTypes.Add(typeof(Id64), new GqlId64());
            GqlTypes.Add(typeof(string), new GqlString());
            GqlTypes.Add(typeof(long?), new GqlLong());
            GqlTypes.Add(typeof(long), new GqlNonNullLong());
            GqlTypes.Add(typeof(int), new GqlInt());
            GqlTypes.Add(typeof(Directions), new GqlEnum<Directions>());
            GqlTypes.Add(typeof(Privileges), new GqlEnum<Privileges>());
            GqlTypes.Add(typeof(AddressTypes), new GqlEnum<AddressTypes>());
            GqlTypes.Add(typeof(OperationTypes), new GqlEnum<OperationTypes>());
            GqlTypes.Add(typeof(States), new GqlEnum<States>());
            GqlTypes.Add(typeof(float?), new GqlFloat());
            GqlTypes.Add(typeof(float), new GqlNonNullFloat());
            GqlTypes.Add(typeof(bool), new GqlBool());
            GqlTypes.Add(typeof(DateTime), new GqlDateTime());
            GqlTypes.Add(typeof(byte), new GqlByte());
            GqlTypes.Add(typeof(short), new GqlShort());
            GqlTypes.Add(typeof(ushort), new GqlShort());
            GqlTypes.Add(typeof(uint), new GqlUnsignedInt());
            AddType(new GqlUnique<Unit>("units", "unit"));
            AddType(new GqlUnique<ProductType>("product_types", "product_type"));
            AddType(new GqlUnique<Nomenclature>("nomenclatures", "nomenclature"));
            AddType(new GqlUnique<Owner>("owners", "owner"));
            AddType(new GqlUnique<Reason>("reasons", "reason"));
            AddType(new GqlUnique<User>("users", "user"));
            AddType(new GqlUnique<Operation>("operations", "operation"));
            AddType(new GqlUnique<Address>("addresses", "address"));
            AddType(new GqlUnique<Change>("changes", "change"));
            AddType(new GqlExtendedUnique<Warehouse>("warehouse", "warehouse"));
            AddType(new GqlExtendedUnique<UncommittedOperation>("uncommitted_operations", "uncommitted_operation"));
            AddType(new GqlUnique<UncommittedChange>("uncommitted_changes", "uncommitted_change"));
            AddType(new GqlUnique<Zone>("zones", "zone"));
            AddType(new GqlUnique<Device>("coordinates", "device"));
            AddType(new GqlUnique<WebWorker>("coordinates", "webworker"));
            RegisterTypes();

            UniqueTypes[typeof(Change)].Fields["operation"].Arguments = new GqlArgumentsList(false)
            {
                {"destination", new GqlList<GqlNonNullId64>()}
            };
            UniqueTypes[typeof(Warehouse)].Fields["operation"].Arguments = new GqlArgumentsList(false)
            {
                {"destination", new GqlList<GqlNonNullId64>()}
            };

            RegisterQuery("create_token", (query, context) => {
                try {
                    if (!query.Arguments.TryGetValue("seed", out var seed))
                        throw new Exception("Отсутствует аргумент <seed>");
                    var result = Core.CreateSessionToken(seed.Get<string>());
                    if (result == null) throw new Exception("Введен неверный логин/пароль");
                    return result;
                }
                catch (Exception e) {
                    Debug.WriteLine(e);
                    context.AddError(query.ToString(), e.Message);
                }
                return null;
            }, new GqlGuid(), new GqlArgumentsList
            {
                {"seed", new GqlString()}
            }, true);
            RegisterQuery("users", Api.GetMap<User>, new GqlMap(UniqueTypes[typeof(User)]), new GqlArgumentsList(false)
            {
                { "id", new GqlList<GqlNonNullId64>() }
            });

            RegisterQuery("product_types", Backend.Api.GetMap<ProductType>, new GqlMap(UniqueTypes[typeof(ProductType)]), new GqlArgumentsList(false)
            {
                { "id",new GqlList<GqlNonNullId64>() }
            });

            RegisterQuery("units", Backend.Api.GetMap<Unit>, new GqlMap(UniqueTypes[typeof(Unit)]), new GqlArgumentsList(false)
            {
                { "id", new GqlList<GqlNonNullId64>() }
            });

            RegisterQuery("zones", Backend.Api.GetMap<Zone>, new GqlMap(UniqueTypes[typeof(Zone)]), new GqlArgumentsList(false)
            {
                { "id", new GqlList<GqlNonNullId64>() }
            });

            RegisterQuery("unit_insert", Backend.Api.UnitInsert, new GqlNonNullId64(), new GqlArgumentsList
            {
                {"name",new GqlString()}
            });
            RegisterQuery("unit_delete", Backend.Api.RemoveObject<Unit>, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });
            RegisterUpdateQueries<Unit>("unit");

            RegisterQuery("owner_insert", Api.OwnerInsert, new GqlNonNullId64(), new GqlArgumentsList
            {
                {"name",new GqlString()}
            });
            RegisterQuery("owner_delete", Backend.Api.RemoveObject<Owner>, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });
            RegisterUpdateQueries<Owner>("owner");

            RegisterQuery("nomenclatures", Backend.Api.GetMap<Nomenclature>, new GqlMap(UniqueTypes[typeof(Nomenclature)]), new GqlArgumentsList(false)
            {
                { "id", new GqlList<GqlNonNullId64>() }
            });
            RegisterQuery("nomenclature_insert", Backend.Api.NomenclatureInsert, new GqlNonNullId64(), new GqlArgumentsList
            {
                {"designation",new GqlString()},
                {"name",new GqlString()},
                {"unit",new GqlNonNullId64()},
                {"product_type",new GqlNonNullId64()}
            });
            RegisterQuery("nomenclature_delete", Backend.Api.RemoveObject<Nomenclature>, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });
            RegisterUpdateQueries<Nomenclature>("nomenclature");
            RegisterQuery("owners", Backend.Api.GetMap<Owner>, new GqlMap(UniqueTypes[typeof(Owner)]), new GqlArgumentsList(false)
            {
                { "id", new GqlList<GqlNonNullId64>()}
            });
            RegisterQuery("reasons", Backend.Api.GetMap<Reason>, new GqlMap(UniqueTypes[typeof(Reason)]), new GqlArgumentsList(false)
            {
                { "id",new GqlList<GqlNonNullId64>() }
            });
            RegisterQuery("changes", Backend.Api.GetMap<Change>, new GqlMap(UniqueTypes[typeof(Change)]), new GqlArgumentsList(false)
            {
                { "id", new GqlList<GqlNonNullId64>() }
            });
            RegisterQuery("warehouse", Backend.Api.GetMap<Warehouse>, new GqlMap(UniqueTypes[typeof(Warehouse)]), new GqlArgumentsList(false)
            {
                { "id",new GqlList<GqlNonNullId64>() },
                { "operation", new GqlList<GqlNonNullLong>() }
            });
            RegisterQuery("addresses", Backend.Api.GetMap<Address>, new GqlMap(UniqueTypes[typeof(Address)]), new GqlArgumentsList(false)
            {
                { "id", new GqlList<GqlNonNullId64>() }
            });
          
            RegisterQuery("uncommitted_change_insert", Backend.Api.UncommittedChangeInsert, new GqlNonNullId64(), new GqlArgumentsList
            {
                {"uncommitted_operation",new GqlNonNullId64()},
                {"nomenclature",new GqlNonNullId64()},
                {"increment",new  GqlNonNullFloat()},
                {"reason",new GqlNonNullId64()},
                {"owner",new GqlNonNullId64()},
                {"basis",new GqlString()},
            });
            RegisterQuery("uncommitted_change_delete", Backend.Api.RemoveObject<UncommittedChange>, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });
            RegisterQuery("run_operation", Backend.Api.RunOperation, new GqlBool(), new GqlArgumentsList
            {
                {"uncommitted_operation",new GqlNonNullId64()}
            });
            RegisterQuery("operator_accept", Backend.Api.OperatorAccept, new GqlBool(), new GqlArgumentsList
            {
                {"uncommitted_operation",new GqlNonNullId64()}
            });
            RegisterUpdateQueries<Address>("address");
            RegisterQuery("uncommitted_operation_insert", Backend.Api.UncommittedOperationInsert, new GqlId64(), new GqlArgumentsList
            {
                { "source",new GqlNonNullId64()},
                { "destination",new GqlNonNullId64()},
                { "is_virtual",new GqlBool()}
            });
            RegisterQuery("operations", Backend.Api.GetMap<Operation>, new GqlMap(UniqueTypes[typeof(Operation)]), new GqlArgumentsList(false)
            {
                { "id",new GqlList<GqlNonNullId64>() }
            });
            RegisterQuery("uncommitted_operations", Backend.Api.GetMap<UncommittedOperation>, new GqlMap(UniqueTypes[typeof(UncommittedOperation)]), new GqlArgumentsList(false)
            {
                { "id",new GqlList<GqlNonNullId64>() }
            });
            RegisterQuery("uncommitted_changes", Backend.Api.GetMap<UncommittedChange>, new GqlMap(UniqueTypes[typeof(UncommittedChange)]), new GqlArgumentsList(false)
            {
                {"id", new GqlList<GqlNonNullId64>()},
                {"uncommitted_operation", new GqlList<GqlNonNullId64>()}
            });
            RegisterQuery("webworkers", Backend.Api.GetMapWebWorkers, new GqlMap(UniqueTypes[typeof(WebWorker)]), new GqlArgumentsList(false)
            {
                { "id", new GqlList<GqlString>() }
            });
            RegisterQuery("devices", Backend.Api.Devices, new GqlMap(UniqueTypes[typeof(Device)]), new GqlArgumentsList(false)
            {
                { "id", new NonNull<GqlList<GqlNonNullId64>>() }
            });

            RegisterQuery("uncommitted_operation_delete", Backend.Api.UncommittedOperationDelete, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });

            RegisterQuery("user_insert", Backend.Api.UserInsert, new GqlNonNullId64(), new GqlArgumentsList
            {
                {"login",new GqlString()},
                {"password",new GqlString()}
            });
            RegisterQuery("user_delete", Backend.Api.UserDelete, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });
            RegisterUpdateQueries<User>("user");
            RegisterUpdateQueries<ProductType>("product_type");

            RegisterQuery("user_update_privilege", Api.SetPrivilege, new GqlNonNullId64(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()},
                {"privilege",new GqlEnum<Privileges>()},
                {"old",new GqlBool()},
                {"new",new GqlBool()}
            });

            RegisterQuery("change_mode", Backend.Api.ChangeMode, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()},
                {"mode",new GqlByte()}
            });


            RegisterQuery("reset", Backend.Api.Reset, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });

            RegisterQuery("release_safety_lock", Backend.Api.ReleaseSafetyLock, new GqlBool(), new GqlArgumentsList
            {
                {"password",new GqlString()}
            });

            RegisterQuery("product_type_insert", Backend.Api.ProductTypeInsert, new GqlBool(), new GqlArgumentsList
            {
                {"name",new GqlString()}
            });

            RegisterQuery("product_type_delete", Backend.Api.RemoveObject<ProductType>, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });

            RegisterQuery("reason_insert", Backend.Api.ReasonInsert, new GqlNonNullId64(), new GqlArgumentsList
            {
                {"name",new GqlString()},
                {"direction",new GqlEnum<Directions>()}
            });
            RegisterQuery("reason_delete", Backend.Api.RemoveObject<Reason>, new GqlBool(), new GqlArgumentsList
            {
                {"id",new GqlNonNullId64()}
            });
            RegisterUpdateQueries<Reason>("reason");
            RegisterUpdateQueries<UncommittedChange>("uncommitted_change");
            RegisterQuery("operation_update_weight", (token, context) =>
            {
                var result = Backend.Api.Set<Operation>(token, context, "weight");
                return result;
            }, new GqlBool(), new GqlArgumentsList
            {
                {"id", new GqlNonNullId64()},
                {"old", new GqlNonNullFloat()},
                {"new", new GqlNonNullFloat()}
            });
            Debug.WriteLine(BuildSchemeJavascript());
        }


        public byte[] Handle(string query, Session.Session session)
        {
            string id = null;
            var data = new JArray();
            var response = new Response(session);
            var pos = query.IndexOf("#");
            if (pos != -1) {
                id = query.Substring(0, pos);
                query = query.Substring(pos + 1);
                var gqlQuery = ParseQueries(query, response);
                if (!response.Errors.HasValues) {
                    foreach (var value in gqlQuery) {
                        if (value.TargetType is GqlQuery q) {
                            var errorsCount = response.Errors.Count;
                            var answer = q.Resolve(value, response);
                            if (errorsCount == response.Errors.Count) { data.Add(answer); }
                        } else {
                            response.AddError(value.ToString(), "Запрашиваемый метод не найден");
                        }
                    }
                }
            } else {
                response.AddError(query, "Идентификатор не указан");
            }
            var result = new JObject { new JProperty("data", data.HasValues ? data : null) };
            if (id != null) result.Add(new JProperty("id", id));
            if (response.Errors.HasValues) {
                result.Add(new JProperty("errors", response.Errors));
            }
            return Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(result));
        }

        public byte[] HandleUnauthorizedUser(string query)
        {
            var data = new JArray();
            var response = new Response(null);
            var gqlQuery = ParseQueries(query, response);
            if (!response.Errors.HasValues) {
                foreach (var value in gqlQuery) {
                    if (value.TargetType is GqlQuery q) {
                        if (q.IsPublic) {
                            var errorsCount = response.Errors.Count;
                            var answer = q.Resolve(value, response);
                            if (errorsCount == response.Errors.Count) { data.Add(answer); }
                        } else {
                            response.AddError(value.ToString(), "Доступ к методу запрещен для неавторизованных пользователей");
                        }
                    } else {
                        response.AddError(value.ToString(), "Запрашиваемый метод не найден");
                    }
                }
            }
            var result = new JObject { new JProperty("data", data.HasValues ? data : null) };
            if (response.Errors.HasValues) {
                result.Add(new JProperty("errors", response.Errors));
            }
            return Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(result));
        }

        public static Schema Instance => Lazy.Value;

        public static bool CreateSelection(List<Selection> queries, Stack<Selection> tokens, string name, out Selection token, Response response)
        {
            token = null;
            var currentToken = tokens.Peek();
            if (currentToken.Arguments == null) {
                if (currentToken.TargetType is IHasArguments hasArgsGqlType && hasArgsGqlType.Arguments != null && hasArgsGqlType.Arguments.Required) {
                    response.AddError("", $"Список аргументов помечен как обязательный");
                    return false;
                }
            } else {
                if (currentToken.TargetType is IHasArguments hasArgsGqlType) {
                    foreach (var (key, arg) in hasArgsGqlType.Arguments) {
                        if (currentToken.Arguments != null && currentToken.Arguments.ContainsKey(key)) continue;
                        arg.Parse(null, response);
                        if (response.Errors.Count == 0) continue;
                        response.AddError("", $"Parse error: non-null argument is null");
                        return false;
                    }
                } else {
                    response.AddError("", $"Тип не принимает список аргументов");
                    return false;
                }
            }
            var fieldType = currentToken.TargetType.HasSelection(name);
            if (fieldType == null) {
                response.AddError("", $"Parser error: field <{name}> not found");
                return false;
            }
            token = new Selection {
                Name = name,
                TargetType = fieldType
            };
            if (tokens.Count == 1) {
                queries.Add(token);
            } else
            {
                currentToken.Selections ??= new Dictionary<string, Selection>();
                currentToken.Selections.Add(name, token);
            }
            return true;
        }


        public static bool CreateArgument(Stack<Selection> tokens, Argument argument, Response response)
        {
            var currentToken = tokens.Peek();
            var argumentType = currentToken.TargetType.HasArgument(argument.Name);
            //Debug.WriteLine(currentToken);
            //Debug.WriteLine(argumentType);
            if (argumentType == null) {
                response.AddError("", $"Parser error: argument <{argument.Name}> not found in description");
                return false;
            }
            argument.Value = argumentType.Parse(argument.Value, response);
            if (response.Errors.Count != 0) { return false; }
            argument.IsList = argument.Value != null && argument.Value.GetType().IsGenericType &&
                              argument.Value.GetType().GetGenericTypeDefinition() == typeof(List<>);
            currentToken.Arguments.Add(argument.Name, argument);
            return true;
        }

        public static List<Selection> ParseQueries(string value, Response response)
        {
            var queries = new List<Selection>();
            var tokens = new Stack<Selection>();
            tokens.Push(new Selection { TargetType = Instance });
            var tokenStart = -1;
            var tokenEnd = -1;
            var mode = TokenTypes.SELECTION;
            Argument argument = null;
            List<object> argValueList = null;
            for (var i = 0; i < value.Length; i++) {
                var symbol = value[i];
                switch (symbol) {
                    case '{':
                        switch (mode) {
                            case TokenTypes.ARGUMENT_NAME:
                                response.AddError("", $"Parser error at {i}");
                                return null;
                            case TokenTypes.ARGUMENT_VALUE:
                                response.AddError("", $"Parser error at {i}");
                                return null;
                            case TokenTypes.SELECTION_BODY:
                                if (tokenStart != -1) {
                                    response.AddError("", $"Parser error at {i}: selection body was expected");
                                    return null;
                                }
                                mode = TokenTypes.SELECTION;
                                tokenStart = -1;
                                break;
                            case TokenTypes.SELECTION:
                                if (tokenStart != -1) {
                                    var name = value.Substring(tokenStart, tokenEnd - tokenStart + 1);
                                    if (!CreateSelection(queries, tokens, name, out var token, response)) { return null; }
                                    tokens.Push(token);
                                    tokenStart = -1;
                                } else {
                                    response.AddError("", $"Parser error at {i}: selection must have a name");
                                    return null;
                                }
                                break;
                        }
                        break;
                    case '}':
                        if (tokenStart != -1) {
                            var name = value.Substring(tokenStart, tokenEnd - tokenStart + 1);
                            if (!CreateSelection(queries, tokens, name, out var token, response)) { return null; }
                            tokenStart = -1;
                        }
                        tokens.Pop();
                        break;
                    case ' ':
                        break;
                    case '(':
                        if (tokenStart != -1) {
                            var name = value.Substring(tokenStart, tokenEnd - tokenStart + 1);
                            if (!CreateSelection(queries, tokens, name, out var token, response)) { return null; }
                            token.Arguments = new Dictionary<string, Argument>();
                            tokens.Push(token);
                            argument = new Argument();
                            mode = TokenTypes.ARGUMENT_NAME;
                            tokenStart = -1;
                        } else {
                            response.AddError("", $"Parser error at {i}: selection must have a name");
                            return null;
                        }
                        break;
                    case ':':
                        switch (mode) {
                            case TokenTypes.ARGUMENT_NAME: {
                                    if (tokenStart != -1) {
                                        if (argument == null) {
                                            response.AddError("", $"Parser error at {i}");
                                            return null;
                                        }
                                        argument.Name = value.Substring(tokenStart, tokenEnd - tokenStart + 1);
                                        mode = TokenTypes.ARGUMENT_VALUE;
                                        tokenStart = -1;
                                    } else {
                                        response.AddError("", $"Parser error at {i}");
                                        return null;
                                    }
                                }
                                break;
                        }
                        break;
                    case '\'': {
                            switch (mode) {
                                case TokenTypes.ARGUMENT_VALUE:
                                    tokenStart = i + 1;
                                    i += 1;
                                    for (; i < value.Length; i++) {
                                        symbol = value[i];
                                        if (symbol != '\'') continue;
                                        tokenEnd = i - 1;
                                        //mode = TokenTypes.COMMA;
                                        break;
                                    }
                                    break;
                                default:
                                    response.AddError("", $"Parser error at {i}");
                                    return null;
                            }
                        }
                        break;
                    case '"': {
                            switch (mode) {
                                case TokenTypes.ARGUMENT_VALUE:
                                    tokenStart = i + 1;
                                    i += 1;
                                    for (; i < value.Length; i++) {
                                        symbol = value[i];
                                        if (symbol != '"') continue;
                                        tokenEnd = i - 1;
                                        //mode = TokenTypes.COMMA;
                                        break;
                                    }
                                    break;
                                default:
                                    response.AddError("", $"Parser error at {i}");
                                    return null;
                            }
                        }
                        break;
                    case '[': {
                            switch (mode) {
                                case TokenTypes.ARGUMENT_VALUE: {
                                        if (tokenStart == -1) {
                                            if (argument == null) {
                                                response.AddError("", $"Parser error at {i}");
                                                return null;
                                            }
                                            argValueList = new List<object>();
                                            mode = TokenTypes.ARGUMENT_VALUE_ARRAY;
                                            tokenStart = -1;
                                        } else {
                                            response.AddError("", $"Parser error at {i}");
                                            return null;
                                        }
                                    }
                                    break;
                                default:
                                    response.AddError("", $"Ошибка разбора запроса ({i}): Ожидалось имя аргумента");
                                    return null;
                            }
                        }
                        break;
                    case ']': {
                            if (mode != TokenTypes.ARGUMENT_VALUE_ARRAY) {
                                response.AddError("", $"Parser error at {i}: closing bracket is not allowed");
                                return null;
                            }
                            if (tokenStart != -1) {
                                if (argument == null) {
                                    response.AddError("", $"Parser error at {i}: argument has no value");
                                    return null;
                                }
                                if (argument.Name == null) {
                                    response.AddError("", $"Parser error at {i}: argument has no value");
                                    return null;
                                }
                                argValueList?.Add(value.Substring(tokenStart, tokenEnd - tokenStart + 1));
                                argument.Value = argValueList;
                                if (!CreateArgument(tokens, argument, response)) return null;
                                mode = TokenTypes.ARGUMENT_ARRAY_END;
                                argument = null;
                                argValueList = null;
                                tokenStart = -1;
                            } else {
                                response.AddError("", $"Parser error at {i}: no value for argument");
                                return null;
                            }
                        }
                        break;
                    case ',':
                        switch (mode) {
                            case TokenTypes.ARGUMENT_VALUE: {
                                    if (tokenStart != -1) {
                                        if (argument == null) {
                                            response.AddError("", $"Parser error at {i}: argument has no value");
                                            return null;
                                        }

                                        if (argument.Name == null) {
                                            response.AddError("", $"Parser error at {i}: argument has no name");
                                            return null;
                                        }

                                        argument.Value = value.Substring(tokenStart, tokenEnd - tokenStart + 1);
                                        if (!CreateArgument(tokens, argument, response)) return null;
                                        argument = new Argument();
                                        tokenStart = -1;
                                    } else {
                                        response.AddError("", $"Parser error at {i}: no value for argument");
                                        return null;
                                    }

                                    mode = TokenTypes.ARGUMENT_NAME;
                                }
                                break;
                            case TokenTypes.ARGUMENT_VALUE_ARRAY: {
                                    if (tokenStart != -1) {
                                        if (argument == null) {
                                            response.AddError("", $"Parser error at {i}");
                                            return null;
                                        }

                                        argValueList?.Add(value.Substring(tokenStart, tokenEnd - tokenStart + 1));
                                        tokenStart = -1;
                                    } else {
                                        response.AddError("", $"Parser error at {i}");
                                        return null;
                                    }
                                }
                                break;
                            default:
                                response.AddError("", $"Ошибка разбора запроса ({i}): Ожидалось значение аргумента");
                                return null;
                        }

                        break;
                    case ')': {
                            if (mode != TokenTypes.ARGUMENT_VALUE && mode != TokenTypes.ARGUMENT_ARRAY_END) {
                                response.AddError("", $"Parser error at {i}: closing bracket is not allowed");
                                return null;
                            }
                            if (mode != TokenTypes.ARGUMENT_ARRAY_END) {
                                if (tokenStart != -1) {
                                    if (argument == null) {
                                        response.AddError("", $"Parser error at {i}: argument has no value");
                                        return null;
                                    }
                                    if (argument.Name == null) {
                                        response.AddError("", $"Parser error at {i}: argument has no value");
                                        return null;
                                    }
                                    argument.Value = value.Substring(tokenStart, tokenEnd - tokenStart + 1);
                                    if (!CreateArgument(tokens, argument, response)) return null;
                                    argument = null;
                                    tokenStart = -1;
                                } else {
                                    response.AddError("", $"Parser error at {i}: no value for argument");
                                    return null;
                                }
                            }
                            mode = TokenTypes.SELECTION_BODY;
                        }
                        break;
                    case '0':
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                    case 'a':
                    case 'b':
                    case 'c':
                    case 'd':
                    case 'e':
                    case 'f':
                    case 'g':
                    case 'h':
                    case 'i':
                    case 'j':
                    case 'k':
                    case 'l':
                    case 'm':
                    case 'n':
                    case 'o':
                    case 'p':
                    case 'q':
                    case 'r':
                    case 's':
                    case 't':
                    case 'u':
                    case 'v':
                    case 'w':
                    case 'x':
                    case 'y':
                    case 'z':
                    case 'A':
                    case 'B':
                    case 'C':
                    case 'D':
                    case 'E':
                    case 'F':
                    case 'G':
                    case 'H':
                    case 'I':
                    case 'J':
                    case 'K':
                    case 'L':
                    case 'M':
                    case 'N':
                    case 'O':
                    case 'P':
                    case 'Q':
                    case 'R':
                    case 'S':
                    case 'T':
                    case 'U':
                    case 'V':
                    case 'W':
                    case 'X':
                    case 'Y':
                    case 'Z':
                    case '_':
                    case '-':
                    case '.':
                        if (tokenStart == -1) {
                            tokenStart = tokenEnd = i;
                            switch (mode) {
                                case TokenTypes.SELECTION_BODY:
                                    tokens.Pop();
                                    mode = TokenTypes.SELECTION;
                                    break;
                            }
                        } else {
                            if (tokenEnd + 1 == i) {
                                tokenEnd = i;
                            } else {
                                switch (mode) {
                                    case TokenTypes.SELECTION: {
                                            var name = value.Substring(tokenStart, tokenEnd - tokenStart + 1);
                                            if (!CreateSelection(queries, tokens, name, out _, response)) { return null; }
                                        }
                                        break;
                                    default:
                                        response.AddError("", $"Ошибка разбора запроса ({i}): Разрыв в недопустимом месте");
                                        return null;
                                }
                                tokenStart = tokenEnd = i;
                            }
                        }
                        break;
                    default:
                        response.AddError("", $"Ошибка разбора запроса ({i}): Недопустимый символ");
                        return null;
                }
            }
            return queries;
        }

        public Type GetClrType()
        {
            throw new NotImplementedException();
        }

        public object Parse(object value, Response context)
        {
            throw new NotImplementedException();
        }

        public object Resolve(Selection query, object obj, Response response)
        {
            throw new NotImplementedException();
        }

        public IGqlType HasSelection(string key)
        {
            return Queries.TryGetValue(key, out var query) ? query : null;
        }

        public IGqlType HasArgument(string key)
        {
            throw new NotImplementedException();
        }

        public object CollectObjects(Selection query, object[] objects, ref int index)
        {
            throw new NotImplementedException();
        }

        private static string JavascriptDescriptionType(IGqlUnique value)
        {
            return
                $"{value.JavascriptTypeName}.addFields([{string.Join(",", value.Fields.Select(_ => _.Value.BuildSchemeJavascript()))}])";
        }

        private static string GetForwardTypeDefinition()
        {
            return string.Join("\r\n",
                UniqueTypes.Select(_ => $"const {_.Value.JavascriptTypeName} = Scheme.newType('{_.Value.Name}')"));
        }

        public string BuildSchemeJavascript()
        {
            return
                $"export function schemeBuild () {{ {string.Join("\r\n", GetForwardTypeDefinition(), string.Join("\r\n", UniqueTypes.Select(_ => JavascriptDescriptionType(_.Value))), string.Join("\r\n", Queries.Select(_ => _.Value.BuildSchemeJavascript())))} }}";
        }
    }
}
