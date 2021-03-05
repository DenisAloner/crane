DO
$BODY$
    DECLARE
        _size_x      int := 20;
        _size_y      int := 1;
        _user        bigint;
        _reason      bigint;
        _affiliation bigint;
        _address1    bigint;
        _address2    bigint;
        _desk        bigint;
    BEGIN
        SELECT users.id INTO _user FROM users LIMIT 1;
        SELECT reasons.id INTO _reason FROM reasons WHERE reasons.direction = 'ARRIVAL'::direction LIMIT 1;
        SELECT affiliation.id INTO _affiliation FROM affiliation LIMIT 1;
        SELECT b.id
        INTO _desk
        FROM addresses a,
             addresses b
        WHERE a.label = 'В:' || 1 || ':' || 1
          AND b.kind = 'DESK'::kinds
          AND a.workzone = b.workzone;
        FOR _y IN 1..(_size_y)
            LOOP
                FOR _x IN 1..(_size_x)
                    LOOP

                        SELECT addresses.id
                        INTO _address1
                        FROM addresses
                        WHERE addresses.label = 'Г:' || 2 || ':' || _x;
                        INSERT INTO changes(incomplete_operation, nomenclature, increment, reason, affiliation, basis)
                        SELECT create_operation(_address1, _desk, _user),
                               emptycontainer(),
                               -1,
                               _reason,
                               _affiliation,
                               NULL;
                        SELECT addresses.id
                        INTO _address2
                        FROM addresses
                        WHERE addresses.label = 'В:' || 4 || ':' || _x;
                        INSERT INTO changes(incomplete_operation, nomenclature, increment, reason, affiliation, basis)
                        SELECT create_operation(_desk, _address2, _user),
                               emptycontainer(),
                               1,
                               _reason,
                               _affiliation,
                               NULL;
                    END LOOP;
            END LOOP;
    END;
$BODY$;