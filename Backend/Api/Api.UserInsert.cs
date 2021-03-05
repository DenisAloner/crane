using System;
using System.Data;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static object UserInsert(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var login = arguments["login"].Get<string>();
            var password = arguments["password"].Get<string>();
            try {
                Id64? result;
                using (var scope = new TransactionScope()) {
                    using var connection = Core.GetDbConnection(context.Session);
                    result = connection.ExecuteScalar<Id64>("user_insert", new { _login = login, _password = password },
                        commandType: CommandType.StoredProcedure);
                    scope.Complete();
                }
                return result;
            }
            catch (Exception e) {
                Debug.WriteLine(e);
                context.AddError(query.ToString(), e.Message);
            }
            return null;
        }
    }
}