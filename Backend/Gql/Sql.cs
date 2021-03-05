using System;
using System.Collections.Generic;
using System.Linq;
using Dapper;

namespace Backend.Gql {
    namespace Sql {
        public class Command { }

        public class Clause { }

        public class Where : Clause {
            private readonly List<Condition> _conditions;

            public Where()
            {
                _conditions = new List<Condition>();
            }

            public Where Condition(Condition condition)
            {
                _conditions.Add(condition);
                return this;
            }

            public override string ToString()
            {
                return $"WHERE {string.Join(" AND ", _conditions)}";
            }
        }

        public class LeftJoin : Clause {
            public readonly string Table;
            public readonly string Alias;
            private readonly List<Condition> _conditions;

            public LeftJoin(string table, string alias)
            {
                Table = table;
                Alias = alias;
                _conditions = new List<Condition>();
            }

            public override string ToString()
            {
                return $"LEFT JOIN {Table} {(Alias != null ? $"AS {Alias} " : string.Empty)}ON {string.Join(',', _conditions)}";
            }

            public LeftJoin Condition(Condition condition)
            {
                _conditions.Add(condition);
                return this;
            }
        }

        public class From : Clause {
            private readonly List<(string Table, string Alias)> _tables;

            public From()
            {
                _tables = new List<(string Table, string Alias)>();
            }

            public void Add(string table, string alias)
            {
                _tables.Add((table, alias));
            }

            public override string ToString()
            {
                return $"FROM {string.Join(',', _tables.Select(x => $"{x.Table} {x.Alias}"))}";
            }
        }

        public class Condition { }

        public class Equal : Condition {
            public string Left;
            public string Right;

            public Equal(string left, string right)
            {
                Left = left;
                Right = right;
            }

            public override string ToString()
            {
                return $"{Left}={Right}";
            }
        }

        public class Select : Command {
            private readonly Dictionary<Type, List<Clause>> _clauses;
            private readonly List<string> _columns;
            private readonly From _from;
            public readonly DynamicParameters Parameters;

            private int _tableCounter = 0;

            public string GenerateAlias => $"t{_tableCounter++}";

            public Select()
            {
                _from = new From();
                _columns = new List<string>();
                _clauses = new Dictionary<Type, List<Clause>>();
                Parameters = new DynamicParameters();
            }

            public Select From(string table, string alias)
            {
                _from.Add(table, alias);
                return this;
            }

            public LeftJoin LeftJoin(string table, Condition condition = null, string alias = null)
            {
                var clause = new LeftJoin(table, alias);
                clause.Condition(condition);
                if (!_clauses.TryGetValue(typeof(LeftJoin), out var list)) {
                    list = new List<Clause>();
                    _clauses.Add(typeof(LeftJoin), list);
                }
                list.Add(clause);
                return clause;
            }

            public Where Where(Condition condition = null)
            {
                var clause = new Where();
                clause.Condition(condition);
                if (!_clauses.TryGetValue(typeof(Where), out var list)) {
                    list = new List<Clause>();
                    _clauses.Add(typeof(Where), list);
                }
                list.Add(clause);
                return clause;
            }

            public override string ToString()
            {
                var leftJoin = _clauses.TryGetValue(typeof(LeftJoin), out var listLeftJoin)
                    ? " " + string.Join(" ", listLeftJoin)
                    : null;
                var where = _clauses.TryGetValue(typeof(Where), out var listWhere)
                    ? " " + string.Join(" ", listWhere)
                    : null;
                return $"SELECT {string.Join(',', _columns)} {_from}{leftJoin}{where}";
            }

            public void Column(string name)
            {
                _columns.Add(name);
            }

            public bool ExistLeftJoin(string table)
            {
                return _clauses.TryGetValue(typeof(LeftJoin), out var list) && list.Cast<LeftJoin>().Any(clause => clause.Table == table);
            }
        }

        public class Sql {
            private Command _command;

            public Select Select()
            {
                _command = new Select();
                return (Select)_command;
            }

            public override string ToString()
            {
                return _command.ToString();
            }
        }
    }
}
