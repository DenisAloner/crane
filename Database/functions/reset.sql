CREATE OR REPLACE FUNCTION public.reset(_zone bigint)
    RETURNS boolean AS
$BODY$
DECLARE
    _zone_row zones%ROWTYPE;
    _address  bigint;
BEGIN
    SELECT zones.* INTO _zone_row FROM zones WHERE zones.id = _zone LIMIT 1;
    IF _zone_row IS NULL THEN
        RAISE EXCEPTION 'Рабочая зона не найдена';
    END IF;
    IF _zone_row.uncommitted_operation IS NOT NULL THEN
        SELECT addresses.id
        INTO _address
        FROM addresses,
             uncommitted_operations
        WHERE uncommitted_operations.id = _zone_row.uncommitted_operation
          AND addresses.id = uncommitted_operations.source;
        UPDATE addresses
        SET state = 'UNLOCKED'::enum_states
        WHERE addresses.id = _address;
        UPDATE warehouse
        SET state = 'UNLOCKED'::enum_states
        FROM operations,
             changes
        WHERE warehouse.id = changes.id
          AND changes.operation = operations.id
          AND operations.destination = _address;
        SELECT addresses.id
        INTO _address
        FROM addresses,
             operations
        WHERE operations.id = _zone_row.uncommitted_operation
          AND addresses.id = operations.destination;
        UPDATE addresses
        SET state = 'UNLOCKED'::enum_states
        WHERE addresses.id = _address;
        UPDATE warehouse
        SET state = 'UNLOCKED'::enum_states
        FROM operations,
             changes
        WHERE warehouse.id = changes.id
          AND changes.operation = operations.id
          AND operations.destination = _address;
        UPDATE zones SET uncommitted_operation = NULL WHERE zones.id = _zone;
    END IF;
    RETURN TRUE;
END ;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;