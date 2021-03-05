CREATE OR REPLACE FUNCTION public.signal_insert(_name text, _id bigint)
    RETURNS void AS
$BODY$
BEGIN
    PERFORM pg_notify('arsenalum', jsonb_build_object('id', _name, 'insert', to_hex(_id))::text);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;

CREATE OR REPLACE FUNCTION public.signal_update(_name text, _id bigint, _column text)
    RETURNS void AS
$BODY$
BEGIN
    PERFORM pg_notify('arsenalum', jsonb_build_object('id', _name, 'update',
                                                      ARRAY [to_hex(_id), _column])::text);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;

CREATE OR REPLACE FUNCTION public.signal_delete(_name text, _id bigint)
    RETURNS void AS
$BODY$
BEGIN
    PERFORM pg_notify('arsenalum', jsonb_build_object('id', _name, 'delete', to_hex(_id))::text);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;

CREATE OR REPLACE FUNCTION public.signal_request_done(_zone bigint, _message bigint)
    RETURNS void AS
$BODY$
BEGIN
    PERFORM pg_notify('arsenalum_sse',
                      jsonb_build_object('$type', 'WRITING_TO_DATABASE_COMPLETED'::enum_requests, 'work_zone',
                                         to_hex(_zone), 'id', to_hex(_message))::text);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;