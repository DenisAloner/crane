CREATE OR REPLACE FUNCTION public.check_addresses(_uncommitted_operation bigint)
    RETURNS void AS
$BODY$
DECLARE
    _source_row      addresses%ROWTYPE;
    _destination_row addresses%ROWTYPE;
BEGIN
    SELECT addresses.* INTO _source_row
    FROM uncommitted_operations,
         addresses
    WHERE uncommitted_operations.id = _uncommitted_operation
      AND addresses.id = uncommitted_operations.source;
    SELECT addresses.* INTO _destination_row
    FROM operations,
         addresses
    WHERE operations.id = _uncommitted_operation
      AND addresses.id = operations.destination;
    IF NOT (_source_row.zone = _destination_row.zone) THEN
        RAISE EXCEPTION 'Начальный и конечный адреса находятся в разных рабочих зонах';
    END IF;
    IF _source_row.type = 'DESK'::enum_addresses AND _destination_row.type = 'DESK'::enum_addresses THEN
        RAISE EXCEPTION 'Недопустимое сочетание типов адресов';
    END IF;
END;
$BODY$ LANGUAGE plpgsql;