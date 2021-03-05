DO $$
    DECLARE
        _user        bigint;
        _desk        bigint;
        _workzone    bigint;
        _reason      bigint;
        _affiliation bigint;
    BEGIN
        SELECT users.id INTO _user FROM users LIMIT 1;
        SELECT reasons.id INTO _reason FROM reasons WHERE reasons.direction = 'ARRIVAL'::direction LIMIT 1;
        SELECT affiliation.id INTO _affiliation FROM affiliation LIMIT 1;
        SELECT workzones.id INTO _workzone FROM workzones WHERE workzones.index = 1;
        SELECT addresses.id INTO _desk
        FROM addresses,
             workzones
        WHERE addresses.kind = 'DESK'::kinds
          AND addresses.workzone = _workzone;
/*        WITH _cells AS (SELECT addresses.id AS id
                        FROM addresses
                        WHERE addresses.kind = 'CELL'::kinds
                          AND addresses.workzone = _workzone)
        INSERT
        INTO changes(incomplete_operation, nomenclature, increment, reason, affiliation, basis)
        SELECT create_operation(_desk, _cells.id, _user), emptycontainer(), 1, _reason, _affiliation, NULL
        FROM _cells;*/
        SELECT workzones.id INTO _workzone FROM workzones WHERE workzones.index = 2;
        SELECT addresses.id INTO _desk
        FROM addresses,
             workzones
        WHERE addresses.kind = 'DESK'::kinds
          AND addresses.workzone = _workzone;
        WITH _cells AS (SELECT addresses.id AS id
                        FROM addresses
                        WHERE addresses.kind = 'CELL'::kinds
                          AND addresses.workzone = _workzone)
        INSERT
        INTO changes(incomplete_operation, nomenclature, increment, reason, affiliation, basis)
        SELECT create_operation(_desk, _cells.id, _user), emptycontainer(), 1, _reason, _affiliation, NULL
        FROM _cells;


    /*    SELECT workzones.id INTO _workzone FROM workzones WHERE workzones.index = 1;
        SELECT addresses.id INTO _desk
        FROM addresses,
             workzones
        WHERE addresses.kind = 'DESK'::kinds
          AND addresses.workzone = _workzone;
        WITH _cells AS (SELECT addresses.id AS id
                        FROM addresses
                        WHERE addresses.kind = 'CELL'::kinds
                          AND addresses.workzone = _workzone)
        INSERT
        INTO changes(incomplete_operation, nomenclature, increment, reason, affiliation, basis)
        SELECT create_operation(_cells.id, _desk, _user), emptycontainer(), -1, _reason, _affiliation, NULL
        FROM _cells;
        SELECT workzones.id INTO _workzone FROM workzones WHERE workzones.index = 2;
        SELECT addresses.id INTO _desk
        FROM addresses,
             workzones
        WHERE addresses.kind = 'DESK'::kinds
          AND addresses.workzone = _workzone;
        WITH _cells AS (SELECT addresses.id AS id
                        FROM addresses
                        WHERE addresses.kind = 'CELL'::kinds
                          AND addresses.workzone = _workzone)
        INSERT
        INTO changes(incomplete_operation, nomenclature, increment, reason, affiliation, basis)
        SELECT create_operation(_cells.id, _desk, _user), emptycontainer(), -1, _reason, _affiliation, NULL
        FROM _cells;*/

    END $$ LANGUAGE plpgsql;