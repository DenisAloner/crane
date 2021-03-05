using System;
using System.Data;
using System.Diagnostics;
using System.Transactions;
using Backend.Gql;
using Backend.Gql.Types.Scalars;
using Backend.Plc;
using Dapper;
using Npgsql;

namespace Backend {
    public static partial class Api {
        //public static object RunOperation(Selection query, Response context)
        //{
        //    bool? result = null;
        //    var arguments = query.Arguments;
        //    var incomplete_operation = arguments["incomplete_operation"].Get<Id64>();
        //    while (true)
        //        try {
        //            using (var scope = new TransactionScope()) {
        //                using (var conn = Core.GetDbConnection(context.Session))
        //                {
        //                    var msg = conn.Query<MessageOperation,Address, MessageOperation>("run_operation", (task, address) =>
        //                        {
        //                            return task;
        //                        },
        //                        new {_incomplete_operation = incomplete_operation, _user = context.Session.User},
        //                        commandType: CommandType.StoredProcedure);
        //                    Debug.WriteLine(JsonConvert.SerializeObject(msg.First()));
        //                    Core.PlcClient.AddMSg(msg.First());
        //                    scope.Complete();
        //                }
        //            }

        //            return true;
        //        }
        //        catch (Exception e) {
        //            switch (e) {
        //                case PostgresException pgException when pgException.SqlState == "40001":
        //                    Debug.WriteLine("40001");
        //                    break;
        //                case TransactionAbortedException tranException
        //                    when tranException.InnerException is PostgresException pgException &&
        //                         pgException.SqlState == "40001":
        //                    Debug.WriteLine("40001");
        //                    break;
        //                default:
        //                    Debug.WriteLine(e);
        //                    context.AddError(query.ToString(), e.Message);
        //                    return null;
        //            }
        //        }
        //}

        public static object RunOperation(Selection query, Response context)
        {
            var arguments = query.Arguments;
            var uncommittedOperation = arguments["uncommitted_operation"].Get<Id64>();
            MessageOperation msg = null;
            var repeat = true;

            
            while (repeat) {
                try {
                    using (var scope = new TransactionScope()) {
                        using var connection = Core.GetNpgsqlConnection(context.Session);
                        connection.Open();
                        using (var command = new NpgsqlCommand("run_operation", connection)) {
                            command.Parameters.AddWithValue("_uncommitted_operation", (long)uncommittedOperation);
                            command.Parameters.AddWithValue("_user", (long)context.Session.User);
                            command.CommandType = CommandType.StoredProcedure;
                            using var reader = command.ExecuteReader();
                            reader.Read();
                            msg = new MessageOperation(
                                (Id64)(long)reader.GetValue(0),
                                (Id64)(long)reader.GetValue(1),
                                (Id64)(long)reader.GetValue(3),
                                reader.GetFieldValue<OperationTypes>(2),
                                reader.GetFieldValue<AddressDefinition>(4), 
                                reader.GetFieldValue<AddressDefinition>(5), 
                                reader.GetFieldValue<AddressDefinition>(6),
                                reader.GetFieldValue<short>(7));
                        }
                        scope.Complete();
                    }
                    repeat = false;
                }
                catch (Exception e) {
                    switch (e) {
                        case PostgresException pgException when pgException.SqlState == "40001":
                            Debug.WriteLine("40001");
                            break;
                        case TransactionAbortedException tranException
                            when tranException.InnerException is PostgresException pgException &&
                                 pgException.SqlState == "40001":
                            Debug.WriteLine("40001");
                            break;
                        default:
                            Debug.WriteLine(e);
                            context.AddError(query.ToString(), e.Message);
                            return null;
                    }
                }
            }

            if (msg.IsVirtual == 1)
            {
                repeat = true;
                while (repeat)
                {
                    try
                    {
                        using (var scope = new TransactionScope())
                        {
                            using var connection = Core.GetDbConnection();
                            connection.Execute("done_operation", new { _uncommitted_operation = uncommittedOperation }, commandType: CommandType.StoredProcedure);
                            scope.Complete();
                        }
                        repeat = false;
                    }
                    catch (Exception e)
                    {
                        switch (e)
                        {
                            case PostgresException pgException when pgException.SqlState == "40001":
                                Debug.WriteLine("40001");
                                break;
                            case TransactionAbortedException tranException
                                when tranException.InnerException is PostgresException pgException &&
                                     pgException.SqlState == "40001":
                                Debug.WriteLine("40001");
                                break;
                            default:
                                Debug.WriteLine(e);
                                context.AddError(query.ToString(), e.Message);
                                return null;
                        }
                    }
                }
                return true;
            }

            try {
                Core.PlcClient.AddMSg(msg);
                return true;
            }
            catch (Exception) {
                // ignored
            }

            return null;
        }
    }
}