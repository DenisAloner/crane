using Newtonsoft.Json.Linq;

namespace Backend.Gql
{
    public class Response {
        public JArray Errors;
        public Session.Session Session;

        public Response(Session.Session session)
        {
            Session = session;
            Errors = new JArray();
        }

        public void AddError(string hint, string message)
        {
            Errors.Add(new JObject { new JProperty("query", hint), new JProperty("error", message) });
        }
    }
}