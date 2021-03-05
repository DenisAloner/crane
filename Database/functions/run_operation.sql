CREATE OR REPLACE FUNCTION public.run_operation(_uncommitted_operation bigint, _user bigint)
    RETURNS type_task AS
$BODY$
DECLARE
    _zone_row                  zones%ROWTYPE;
    _source_row                addresses%ROWTYPE;
    _destination_row           addresses%ROWTYPE;
    _desk_row                  addresses%ROWTYPE;
    _conditions                bool[];
    _address1                  type_definition;
    _address2                  type_definition;
    _address3                  type_definition;
    _weight                    real;
    _operation_type            enum_operations;
    _uncommitted_operation_row uncommitted_operations%ROWTYPE;
BEGIN

    PERFORM check_operation_owner(_uncommitted_operation, _user);

    SELECT uncommitted_operations.*
    INTO _uncommitted_operation_row
    FROM uncommitted_operations
    WHERE uncommitted_operations.id = _uncommitted_operation
    LIMIT 1;

    IF _uncommitted_operation_row IS NULL THEN
        RAISE EXCEPTION 'Операция % не найдена в списке незавершенных',_uncommitted_operation;
    END IF;

    SELECT addresses.*
    INTO _source_row
    FROM uncommitted_operations,
         addresses
    WHERE uncommitted_operations.id = _uncommitted_operation
      AND addresses.id = uncommitted_operations.source;

    SELECT zones.* INTO _zone_row FROM zones WHERE zones.id = _source_row.zone;

    IF _zone_row.message = 0 AND _zone_row.status & enum_statuses_to_smallint('BUSY'::enum_statuses) =
                                 enum_statuses_to_smallint('BUSY'::enum_statuses) AND
       NOT _uncommitted_operation_row.is_virtual THEN
        RAISE EXCEPTION 'Кран не готово к выполнению операции';
    END IF;

    SELECT addresses.*
    INTO _destination_row
    FROM operations,
         addresses
    WHERE operations.id = _uncommitted_operation
      AND addresses.id = operations.destination;

    IF _source_row.type = 'DESK'::enum_addresses AND
       (_destination_row.type = 'ODD_CELL'::enum_addresses OR _destination_row.type = 'EVEN_CELL'::enum_addresses) THEN
        IF NOT EXISTS(SELECT
                      FROM uncommitted_changes
                      WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation) THEN
            RAISE EXCEPTION 'Нет изменений по операции';
        END IF;
        IF EXISTS(SELECT
                  FROM warehouse,
                       changes,
                       operations
                  WHERE warehouse.id = changes.id
                    AND changes.operation = operations.id
                    AND operations.destination = _destination_row.id) THEN
            RAISE EXCEPTION 'Конечный адрес занят';
        END IF;
        IF EXISTS(SELECT
                  FROM uncommitted_changes
                  WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation
                    AND uncommitted_changes.increment <= 0) THEN
            RAISE EXCEPTION 'Операция не допускает изменений с количеством меньшим или равным 0';
        END IF;
        IF EXISTS(SELECT
                  FROM uncommitted_changes
                  WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation
                    AND uncommitted_changes.nomenclature = empty_container()
                    AND uncommitted_changes.increment != 1) THEN
            RAISE EXCEPTION 'Количество по изменению для пустого контейнера должно быть равно 1';
        END IF;
        IF EXISTS(SELECT
                  FROM uncommitted_changes
                  WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation
                    AND uncommitted_changes.nomenclature = empty_container()) AND EXISTS(SELECT
                                                                                         FROM uncommitted_changes
                                                                                         WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation
                                                                                           AND NOT uncommitted_changes.nomenclature = empty_container()) THEN
            RAISE EXCEPTION 'Изменения по операции не могут одновременно содержать и пустой контейнер, и номенклатуру';
        END IF;
        _operation_type := 'DESK_TO_CELL'::enum_operations;
        _address1 := (_source_row.id, _source_row.type, _source_row.x, _source_row.y, _source_row.z);
        _address2 := (_destination_row.id, _destination_row.type, _destination_row.x, _destination_row.y,
                      _destination_row.z);
        _address3 := (0, 'DESK'::enum_addresses, 0, 0, 0);
    ELSIF (_source_row.type = 'ODD_CELL'::enum_addresses OR _source_row.type = 'EVEN_CELL'::enum_addresses) AND
          _destination_row.type = 'DESK'::enum_addresses THEN
        IF NOT EXISTS(SELECT
                      FROM warehouse,
                           changes,
                           operations
                      WHERE warehouse.id = changes.id
                        AND changes.operation = operations.id
                        AND operations.destination = _source_row.id) THEN
            RAISE EXCEPTION 'Начальный адрес не занят';
        END IF;
        WITH _full AS (SELECT COALESCE(_current.nomenclature, _changes.nomenclature) AS nomenclature,
                              COALESCE(_current.quantity, 0)                         AS quantity,
                              COALESCE(_changes.increment, 0)                        AS increment
                       FROM (SELECT changes.*
                             FROM changes,
                                  warehouse,
                                  operations
                             WHERE warehouse.id = changes.id
                               AND operations.id = changes.operation
                               AND operations.destination = _source_row.id) _current
                                FULL OUTER JOIN (SELECT uncommitted_changes.*
                                                 FROM uncommitted_changes
                                                 WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation) _changes
                                                on _current.nomenclature = _changes.nomenclature),
             empty AS (SELECT * FROM _full WHERE nomenclature = empty_container())
        SELECT ARRAY [EXISTS(SELECT FROM _full WHERE quantity = 0),
                   EXISTS(SELECT FROM _full WHERE NOT (quantity + increment) = 0),
                   CASE
                       WHEN EXISTS(SELECT FROM empty)
                           THEN (CASE (SELECT (quantity + increment) FROM empty)
                                     WHEN 0 THEN FALSE
                                     ELSE TRUE
                           END)
                       ELSE FALSE END]
        INTO _conditions;
        IF _conditions[1] THEN
            RAISE EXCEPTION 'Операция не допускает изменений по номенклатуре, которая отсутствует на начальном адресе';
        END IF;
        IF _conditions[2] THEN
            RAISE EXCEPTION 'Изменения меняют количество номенклатуры не в 0';
        END IF;
        IF _conditions[3] THEN
            RAISE EXCEPTION 'Изменения приводят к наличию и пустого контейнера, и номенклатуры';
        END IF;
        _operation_type := 'CELL_TO_DESK'::enum_operations;
        _address1 := (_source_row.id, _source_row.type, _source_row.x, _source_row.y, _source_row.z);
        _address2 := (_destination_row.id, _destination_row.type, _destination_row.x, _destination_row.y,
                      _destination_row.z);
        _address3 := (0, 'DESK'::enum_addresses, 0, 0, 0);
    ELSIF (_source_row.type = 'ODD_CELL'::enum_addresses OR _source_row.type = 'EVEN_CELL'::enum_addresses) AND
          (_destination_row.type = 'ODD_CELL'::enum_addresses OR
           _destination_row.type = 'EVEN_CELL'::enum_addresses) THEN
        IF NOT EXISTS(SELECT
                      FROM warehouse,
                           changes,
                           operations
                      WHERE warehouse.id = changes.id
                        AND changes.operation = operations.id
                        AND operations.destination = _source_row.id) THEN
            RAISE EXCEPTION 'Начальный адрес не занят';
        END IF;
        IF NOT EXISTS(SELECT
                      FROM uncommitted_changes
                      WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation) THEN
            RAISE EXCEPTION 'Нет изменений по операции';
        END IF;
        IF NOT _source_row.id = _destination_row.id AND EXISTS(SELECT
                                                               FROM warehouse,
                                                                    changes,
                                                                    operations
                                                               WHERE warehouse.id = changes.id
                                                                 AND changes.operation = operations.id
                                                                 AND operations.destination = _destination_row.id) THEN
            RAISE EXCEPTION 'Конечный адрес занят';
        END IF;
        WITH _full AS (SELECT COALESCE(_current.nomenclature, _changes.nomenclature) AS nomenclature,
                              _changes.id                                            AS id,
                              COALESCE(_current.quantity, 0)                         AS quantity,
                              COALESCE(_changes.increment, 0)                        AS increment
                       FROM (SELECT changes.*
                             FROM changes,
                                  warehouse,
                                  operations
                             WHERE warehouse.id = changes.id
                               AND operations.id = changes.operation
                               AND operations.destination = _source_row.id) _current
                                FULL OUTER JOIN (SELECT uncommitted_changes.*
                                                 FROM uncommitted_changes
                                                 WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation) _changes
                                                ON _current.nomenclature = _changes.nomenclature),
             empty AS (SELECT * FROM _full WHERE nomenclature = empty_container())
        SELECT ARRAY [CASE
                          WHEN NOT _source_row.id = _destination_row.id THEN EXISTS(SELECT FROM _full WHERE id IS NULL)
                          ELSE FALSE END,
                   EXISTS(SELECT FROM _full WHERE quantity = 0 AND increment <= 0),
                   EXISTS(SELECT FROM _full WHERE (quantity + increment) < 0),
                   CASE
                       WHEN EXISTS(SELECT FROM empty)
                           THEN (CASE (SELECT (quantity + increment) FROM empty)
                                     WHEN 0 THEN FALSE
                                     WHEN 1 THEN EXISTS(SELECT
                                                        FROM _full
                                                        WHERE (quantity + increment) > 0
                                                          AND NOT nomenclature = empty_container())
                                     ELSE TRUE
                           END)
                       ELSE FALSE END,
                   NOT EXISTS(SELECT FROM _full WHERE (quantity + increment) > 0),
                   EXISTS(SELECT FROM _full WHERE increment != 0),
                   EXISTS(SELECT FROM _full WHERE id IS NOT NULL AND increment = 0),
                   EXISTS(SELECT FROM _full WHERE id IS NULL)]
        INTO _conditions;
        IF _conditions[1] THEN
            RAISE EXCEPTION 'Есть номенклатура, для которой не задано изменение';
        END IF;
        IF _conditions[2] THEN
            RAISE EXCEPTION 'Номенклатура отсутствует на начальном адресе, но количество в изменении меньше или равно 0';
        END IF;
        IF _conditions[3] THEN
            RAISE EXCEPTION 'На начальном адресе количество меньше, чем требуется забрать по изменению';
        END IF;
        IF _conditions[4] THEN
            RAISE EXCEPTION 'Изменения приводят к наличию и пустого контейнера, и номенклатуры';
        END IF;
        IF (_source_row.id = _destination_row.id) OR
           (_source_row.id != _destination_row.id AND EXISTS(SELECT
                                                             FROM uncommitted_changes
                                                             WHERE uncommitted_changes.uncommitted_operation = _uncommitted_operation
                                                               AND uncommitted_changes.increment != 0)) THEN
            IF _conditions[5] THEN
                RAISE EXCEPTION 'После проведения изменений по операции, не останется номенклатуры для перемещения на конечный адрес';
            END IF;
            IF (_source_row.id = _destination_row.id) THEN
                IF _conditions[6] THEN
                    IF _conditions[7] THEN
                        RAISE EXCEPTION 'Начальный и конечный адрес совпадают, поэтому необходимо добавлять изменения с нулевым количеством только в случае инвентаризации';
                    END IF;
                ELSE
                    IF _conditions[8] THEN
                        RAISE EXCEPTION 'Есть номенклатура, для которой не задано изменение. В случае инвентаризации, изменение с нулевым количеством должно быть явно задано для каждой номенклатуры';
                    END IF;
                END IF;
            END IF;
            SELECT addresses.*
            INTO _desk_row
            FROM addresses
            WHERE addresses.type = 'DESK'::enum_addresses
              AND addresses.zone = _zone_row.id;
            _operation_type := 'CELL_TO_DESK_TO_CELL'::enum_operations;

            _address1 := (_source_row.id, _source_row.type, _source_row.x, _source_row.y, _source_row.z);
            _address2 := (_desk_row.id, _desk_row.type, _desk_row.x, _desk_row.y, _desk_row.z);
            _address3 := (_destination_row.id, _destination_row.type, _destination_row.x, _destination_row.y,
                          _destination_row.z);
        ELSE
            SELECT addresses.*
            INTO _desk_row
            FROM addresses
            WHERE addresses.type = 'DESK'::enum_addresses
              AND addresses.zone = _zone_row.id;
            _operation_type := 'CELL_TO_DESK_TO_CELL_WITHOUT_CONFIRMATION'::enum_operations;
            _address1 := (_source_row.id, _source_row.type, _source_row.x, _source_row.y, _source_row.z);
            _address2 := (_desk_row.id, _desk_row.type, _desk_row.x, _desk_row.y, _desk_row.z);
            _address3 := (_destination_row.id, _destination_row.type, _destination_row.x, _destination_row.y,
                          _destination_row.z);
        END IF;
    ELSE
        RAISE EXCEPTION 'ERROR % %',_source_row.type,_destination_row.type;
    END IF;
    UPDATE zones
    SET uncommitted_operation = _uncommitted_operation
    WHERE zones.id = _zone_row.id;
    UPDATE uncommitted_operations
    SET type = _operation_type
    WHERE uncommitted_operations.id = _uncommitted_operation;
    IF _uncommitted_operation_row.is_virtual THEN
        RETURN (_zone_row.id, 0::bigint, _operation_type, _uncommitted_operation, _address1, _address2,
                _address3, 1::smallint);
    ELSE
        RETURN (_zone_row.id, _zone_row.message, _operation_type, _uncommitted_operation, _address1, _address2,
                _address3, 0::smallint);
    END IF;
END ;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;