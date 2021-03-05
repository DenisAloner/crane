CREATE OR REPLACE FUNCTION public.operator_accept(_uncommitted_operation bigint, _user bigint)
    RETURNS bool AS
$BODY$
DECLARE
    _zone_row zones%ROWTYPE;
BEGIN
    PERFORM check_operation_owner(_uncommitted_operation, _user);
    SELECT *
    INTO _zone_row
    FROM zones
    WHERE zones.uncommitted_operation = _uncommitted_operation;
    IF _zone_row IS NULL THEN
        RAISE EXCEPTION 'Не найдена операция с данным кодом';
    END IF;
    IF _zone_row.request != 3 THEN
        RAISE EXCEPTION 'Операция не ожидает в данный момент подтверждения оператора';
    END IF;
    PERFORM signal_request_done(_zone_row.id, _zone_row.message);
    RETURN TRUE;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;