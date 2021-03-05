using System;
using Backend.Gql.Types.Scalars;

namespace Backend {
    namespace Session {
        public class Session {
            public readonly Id64 User;
            public readonly Guid Token;
            public readonly string ConnectionString;

            public Session(Id64 user, Guid token, string login, string password)
            {
                User = user;
                Token = token;
                ConnectionString = $"User Id={(long)User};Password={password};";
            }
        }
    }
}
