CREATE OR REPLACE FUNCTION public.set_weight(_zone bigint, _weight real)
    RETURNS void AS
$BODY$
DECLARE
    _id         bigint;
    _message_id bigint;
BEGIN
    SELECT uncommitted_operations.id
    INTO _id
    FROM zones,
         uncommitted_operations
    WHERE zones.id = _zone
      AND uncommitted_operations.id = zones.uncommitted_operation;
    IF _id IS NULL THEN
        RAISE EXCEPTION 'Не удалось назначить массу';
    END IF;
    SELECT zones.message
    INTO _message_id
    FROM zones
    WHERE zones.id = _zone;
    UPDATE operations SET weight = _weight WHERE operations.id = _id;
    PERFORM signal_request_done(_zone, _message_id);
END;
$BODY$ LANGUAGE plpgsql;