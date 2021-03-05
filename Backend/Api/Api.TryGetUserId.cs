using Backend.Gql.Types.Scalars;
using Dapper;

namespace Backend {
    public static partial class Api {
        public static Id64? TryGetUserId(string login, string password)
        {
            Id64? id;
            using (var connection = Core.GetDbConnection()) {
                id = connection.ExecuteScalar<Id64?>("SELECT id FROM users WHERE login=@login AND password=@password",
                    new { login, password });
            }
            return id;
        }
    }
}