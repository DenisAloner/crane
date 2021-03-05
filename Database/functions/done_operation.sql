CREATE OR REPLACE FUNCTION public.done_operation(_uncommitted_operation bigint)
    RETURNS void AS
$BODY$
DECLARE
    _source_row      addresses%ROWTYPE;
    _destination_row addresses%ROWTYPE;
    _desk            bigint;
    _operation_type  enum_operations;
    _zone            zones%ROWTYPE;
BEGIN
    SELECT zones.* INTO _zone FROM zones WHERE zones.uncommitted_operation = _uncommitted_operation;
    IF (_zone.status & enum_statuses_to_smallint('CANCELED'::enum_statuses) !=
        enum_statuses_to_smallint('CANCELED'::enum_statuses)) THEN
        SELECT addresses.*
        INTO _source_row
        FROM uncommitted_operations,
             addresses
        WHERE uncommitted_operations.id = _uncommitted_operation
          AND addresses.id = uncommitted_operations.source;
        SELECT addresses.*
        INTO _destination_row
        FROM operations,
             addresses
        WHERE operations.id = _uncommitted_operation
          AND addresses.id = operations.destination;
        SELECT addresses.id
        INTO _desk
        FROM addresses
        WHERE addresses.type = 'DESK'::enum_addresses
          AND addresses.zone = _source_row.zone;
        SELECT uncommitted_operations.type
        INTO _operation_type
        FROM uncommitted_operations
        WHERE uncommitted_operations.id = _uncommitted_operation;
        WITH _rows AS (DELETE FROM warehouse USING changes,operations,uncommitted_changes WHERE
                warehouse.id = changes.id AND
                changes.operation = operations.id AND
                operations.destination = _source_row.id AND
                uncommitted_changes.uncommitted_operation = _uncommitted_operation AND
                uncommitted_changes.nomenclature = changes.nomenclature RETURNING uncommitted_changes.id as id,changes.quantity as quantity),
             _change_rows AS (INSERT INTO changes (id, source, operation, nomenclature, quantity, owner, increment,
                                                   reason, basis)
                 SELECT uncommitted_changes.id,
                        CASE WHEN _rows.id IS NULL THEN _desk ELSE _source_row.id END,
                        _uncommitted_operation,
                        uncommitted_changes.nomenclature,
                        uncommitted_changes.increment + COALESCE(_rows.quantity, 0),
                        uncommitted_changes.owner,
                        uncommitted_changes.increment,
                        uncommitted_changes.reason,
                        uncommitted_changes.basis
                 FROM uncommitted_changes
                          LEFT JOIN _rows on _rows.id = uncommitted_changes.id
                 WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation RETURNING changes.id as id,changes.quantity as quantity)
        INSERT
        INTO warehouse(id)
        SELECT _change_rows.id
        FROM _change_rows
        WHERE _change_rows.quantity > 0;
        UPDATE zones SET uncommitted_operation = NULL WHERE zones.id = _zone.id;
        DELETE FROM uncommitted_changes WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation;
        DELETE FROM uncommitted_operations WHERE uncommitted_operations.id = _uncommitted_operation;
        UPDATE operations SET time_stamp = CURRENT_TIMESTAMP WHERE operations.id = _uncommitted_operation;
    ELSE
        UPDATE zones SET uncommitted_operation = NULL WHERE zones.id = _zone.id;
    END IF;
    PERFORM signal_request_done(_zone.id, _zone.message);
END;
$BODY$ LANGUAGE plpgsql;