using System;
using System.Collections.Generic;
using Backend.Gql.Sql;
using Newtonsoft.Json.Linq;

namespace Backend.Gql.Types
{
    public interface IGqlUnique : IGqlType
    {

        string Name { get; }
        string JavascriptTypeName { get; }
        Dictionary<string, GqlField> Fields { get; set; }
        string SqlTable { get; }

        void GetSql(Selection query, ref Select sql, string alias = null);
    }

    public class GqlUnique<T> : GqlObject<T>, IGqlUnique where T : IHasId
    {
        public string Name { get; }

        public string JavascriptTypeName { get; }

        public string SqlTable { get; }

        public GqlUnique(string sqlTable, string name)
        {
            SqlTable = sqlTable;
            Name = name;
            JavascriptTypeName = $"type{name.ToPascalCase()}";
        }

        public override object Parse(object value, Response context)
        {
            throw new NotImplementedException();
        }

        public override object Resolve(Selection query, object obj, Response response)
        {
            if (!(obj is IHasId gObj)) return null;
            var result = new JObject {new JProperty("id", gObj.GetId)};
            if (query?.Selections == null) return result;
            foreach (var (key, value) in query.Selections)
            {
                if (!Fields.TryGetValue(key, out var field)) continue;
                if (!result.ContainsKey(key)) result.Add(new JProperty(key, field.Resolve(value, obj, response)));
            }

            return result;
        }

        public virtual void GetSql(Selection query, ref Select sql, string alias = null)
        {
            if (sql == null)
            {
                sql = new Sql.Sql().Select();
                alias = sql.GenerateAlias;
                sql.From(SqlTable, alias);
            }

            sql.Column($"{alias}.id");
            string nestedName = null;
            if (this is IGqlExtendedUnique gqlExtendedObject)
            {
                nestedName = sql.GenerateAlias;
                sql.LeftJoin(gqlExtendedObject.TargetGqlObject.SqlTable, new Equal($"{alias}.id", $"{nestedName}.id"),
                    nestedName);
            }

            if (query.Selections == null) return;
            if (query.Arguments != null)
            {
                foreach (var (key, value) in query.Arguments)
                {
                    sql.Parameters.Add(key, value.Value);
                    var name = key == "id" ? alias : Fields[key].SqlTable == SqlTable ? alias : nestedName;
                    sql.Where(value.IsList
                        ? new Equal($"{name}.{key}", $"ANY(@{key})")
                        : new Equal($"{name}.{key}", $"@{key}"));
                }
            }

            foreach (var value in query.Selections.Values)
            {
                if (!(value.TargetType is GqlField gqlObjectPropertyType &&
                      !(gqlObjectPropertyType.Value is IGqlUnique) && gqlObjectPropertyType.IsDatabaseValue)) continue;
                if (gqlObjectPropertyType.SqlColumn == "id") continue;
                sql.Column(gqlObjectPropertyType.SqlTable == SqlTable
                    ? $"{alias}.{gqlObjectPropertyType.SqlColumn}"
                    : $"{nestedName}.{gqlObjectPropertyType.SqlColumn}");
            }

            foreach (var value in query.Selections.Values)
            {
                if (!(value.TargetType is GqlField gqlObjectPropertyType &&
                      gqlObjectPropertyType.Value is IGqlUnique gqlObjectType &&
                      gqlObjectPropertyType.IsDatabaseValue)) continue;
                var name = gqlObjectPropertyType.SqlTable == SqlTable ? alias : nestedName;
                var joinName = sql.GenerateAlias;
                sql.LeftJoin(gqlObjectType.SqlTable,
                    new Equal($"{name}.{gqlObjectPropertyType.SqlColumn}", $"{joinName}.id"), joinName);
                gqlObjectType.GetSql(value, ref sql, joinName);
            }
        }

        public override object CollectObjects(Selection query, object[] objects, ref int index)
        {
            var obj = objects[index];
            index += 1;
            if (query.Selections == null)
            {
                if (query.TargetType is GqlField gqlObjectPropertyType &&
                    gqlObjectPropertyType.Value is IGqlUnique)
                {
                    return obj;
                }

                return null;
            }

            foreach (var value in query.Selections.Values)
            {
                var i = index;
                value.TargetType.CollectObjects(value, objects, ref index);
                if (i == index) continue;
                if (obj != null && value.TargetType is GqlField gqlObjectPropertyType)
                    gqlObjectPropertyType.Property.SetValue(obj, objects[i]);
            }

            return obj;
        }

        public override string BuildSchemeJavascript()
        {
            return $"{JavascriptTypeName}";
        }
    }
}