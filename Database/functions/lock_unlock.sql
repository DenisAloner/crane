CREATE OR REPLACE FUNCTION public.lock_source_address(_uncommitted_operation bigint)
    RETURNS void AS
$BODY$
DECLARE
    _zone zones%ROWTYPE;
BEGIN
    UPDATE addresses
    SET state = 'LOCKED'::enum_states
    FROM uncommitted_operations
    WHERE uncommitted_operations.id = _uncommitted_operation
      AND addresses.id = uncommitted_operations.source;
    SELECT zones.* INTO _zone FROM zones WHERE zones.uncommitted_operation = _uncommitted_operation;
    PERFORM signal_request_done(_zone.id, _zone.message);
END;
$BODY$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.unlock_source_address(_uncommitted_operation bigint)
    RETURNS void AS
$BODY$
DECLARE
    _zone    zones%ROWTYPE;
    _address bigint;
BEGIN
    SELECT addresses.id
    INTO _address
    FROM addresses,
         uncommitted_operations
    WHERE uncommitted_operations.id = _uncommitted_operation
      AND addresses.id = uncommitted_operations.source;
    UPDATE addresses
    SET state = 'UNLOCKED'::enum_states
    WHERE addresses.id = _address;
    UPDATE warehouse
    SET state = 'LOCKED'::enum_states
    FROM operations,
         changes
    WHERE warehouse.id = changes.id
      AND changes.operation = operations.id
      AND operations.destination = _address;
    SELECT zones.* INTO _zone FROM zones WHERE zones.uncommitted_operation = _uncommitted_operation;
    PERFORM signal_request_done(_zone.id, _zone.message);
END;
$BODY$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.lock_destination_address(_uncommitted_operation bigint)
    RETURNS void AS
$BODY$
DECLARE
    _zone zones%ROWTYPE;
BEGIN
    UPDATE addresses
    SET state = 'LOCKED'::enum_states
    FROM operations
    WHERE operations.id = _uncommitted_operation
      AND addresses.id = operations.destination;
    SELECT zones.* INTO _zone FROM zones WHERE zones.uncommitted_operation = _uncommitted_operation;
    PERFORM signal_request_done(_zone.id, _zone.message);
END;
$BODY$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.unlock_destination_address(_uncommitted_operation bigint)
    RETURNS void AS
$BODY$
DECLARE
    _zone    zones%ROWTYPE;
    _address bigint;
BEGIN
    SELECT addresses.id
    INTO _address
    FROM addresses,
         operations
    WHERE operations.id = _uncommitted_operation
      AND addresses.id = operations.destination;
    UPDATE addresses
    SET state = 'UNLOCKED'::enum_states
    WHERE addresses.id = _address;
    UPDATE warehouse
    SET state = 'LOCKED'::enum_states
    FROM operations,
         changes
    WHERE warehouse.id = changes.id
      AND changes.operation = operations.id
      AND operations.destination = _address;
    SELECT zones.* INTO _zone FROM zones WHERE zones.uncommitted_operation = _uncommitted_operation;
    PERFORM signal_request_done(_zone.id, _zone.message);
END;
$BODY$ LANGUAGE plpgsql;