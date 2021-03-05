DO
$$
    DECLARE
        _nomenclature    int := 1;
        _size_x          int := 20;
        _size_y          int := 5;
        _workzone1       bigint;
        _workzone2       bigint;
        _unit            bigint;
        _empty_сontainer bigint;
    BEGIN

        EXECUTE 'CREATE OR REPLACE FUNCTION public.check_empty_container(_id bigint) RETURNS void AS
        $BODY$
        BEGIN
        END;
        $BODY$ LANGUAGE plpgsql IMMUTABLE';

        TRUNCATE public.workzones CASCADE;
        DELETE FROM public.warehouse;
        DELETE FROM public.changes;
        DELETE FROM public.states;
        DELETE FROM incomplete_operations;
        DELETE FROM operations;
        DELETE FROM addresses;
        DELETE FROM public.users;
        DELETE FROM public.nomenclature;
        DELETE FROM units;
        DELETE FROM public.reasons;
        DELETE FROM public.affiliation;
        ALTER SEQUENCE keys RESTART WITH 1;

        INSERT INTO public.units(value) VALUES ('шт') RETURNING units.id INTO _unit;
        INSERT INTO public.nomenclature(designation, name, unit)
        VALUES ('ТАРА.001', 'Пустой контейнер', _unit) RETURNING nomenclature.id INTO _empty_сontainer;

        EXECUTE 'CREATE OR REPLACE FUNCTION public.emptyContainer() RETURNS bigint AS
        $BODY$
        BEGIN
            return ' || _empty_сontainer || ';
        END;
        $BODY$ LANGUAGE plpgsql IMMUTABLE';

        EXECUTE 'CREATE OR REPLACE FUNCTION public.check_empty_container(_id bigint) RETURNS void AS
        $BODY$
        BEGIN
        IF _id = emptyContainer() THEN
            RAISE EXCEPTION ''Запрещено удалять данный вид номенклатуры'';
        END IF;
        END;
        $BODY$ LANGUAGE plpgsql IMMUTABLE';

        INSERT INTO workzones(index, incomplete_operation, status)
        VALUES (1, NULL, 0) RETURNING workzones.id INTO _workzone1;
        INSERT INTO workzones(index, incomplete_operation, status)
        VALUES (2, NULL, 0) RETURNING workzones.id INTO _workzone2;
        INSERT INTO addresses(label, kind, workzone, x, y, z) VALUES ('Стол 1', 'DESK', _workzone1, 850, 80, 910);
        INSERT INTO addresses(label, kind, workzone, x, y, z) VALUES ('Стол 2', 'DESK', _workzone2, 700, 125, -922.5);
        FOR _y IN 1..(_size_y)
            LOOP
                FOR _x IN 1..(_size_x)
                    LOOP
                        INSERT INTO addresses(label, kind, workzone, x, y, z)
                        VALUES ('А:' || _y || ':' || _x, 'CELL', _workzone1, 2690 + (_x - 1) * 1543.5,
                                80 + (_y - 1) * 950,
                                910);
                        INSERT INTO addresses(label, kind, workzone, x, y, z)
                        VALUES ('Б:' || _y || ':' || _x, 'CELL', _workzone1, 2675 + (_x - 1) * 1543.5,
                                80 + (_y - 1) * 950,
                                -910);
                        INSERT INTO addresses(label, kind, workzone, x, y, z)
                        VALUES ('В:' || _y || ':' || _x, 'CELL', _workzone2, 2550 + (_x - 1) * 1542,
                                125 + (_y - 1) * 950,
                                922.5);
                        INSERT INTO addresses(label, kind, workzone, x, y, z)
                        VALUES ('Г:' || _y || ':' || _x, 'CELL', _workzone2, 2560 + (_x - 1) * 1543.5,
                                125 + (_y - 1) * 950,
                                -922.5);
                    END LOOP;
            END LOOP;
        INSERT INTO public.affiliation(value) VALUES ('Сторона 1');
        INSERT INTO public.affiliation(value) VALUES ('Сторона 2');
        INSERT INTO public.reasons(value, direction, affiliation) VALUES ('в производство', 'ISSUE', NULL);
        INSERT INTO public.reasons(value, direction, affiliation) VALUES ('в списание', 'ISSUE', NULL);
        INSERT INTO public.reasons(value, direction, affiliation) VALUES ('в брак', 'ISSUE', NULL);
        INSERT INTO public.reasons(value, direction, affiliation)
        VALUES ('в Сторона 1', 'ISSUE', (SELECT id FROM public.affiliation WHERE value = 'Сторона 1' LIMIT 1));
        INSERT INTO public.reasons(value, direction, affiliation)
        VALUES ('в Сторона 2', 'ISSUE', (SELECT id FROM public.affiliation WHERE value = 'Сторона 2' LIMIT 1));
        INSERT INTO public.reasons(value, direction, affiliation) VALUES ('закупка', 'ARRIVAL', NULL);
        INSERT INTO public.reasons(value, direction, affiliation) VALUES ('из цеха', 'ARRIVAL', NULL);
        INSERT INTO public.reasons(value, direction, affiliation) VALUES ('перемещение', 'ANY', NULL);
        INSERT INTO public.units(value) VALUES ('кг');
        INSERT INTO public.units(value) VALUES ('упа');
        FOR index IN 0..(_nomenclature - 1)
            LOOP
                INSERT INTO public.nomenclature(designation, name, unit)
                VALUES (('Обозначение ' || index), ('Наименование ' || index),
                        (SELECT id FROM public.units ORDER BY random() LIMIT 1));
            END LOOP;
        INSERT INTO users(login, password, fullname, personnel_number) VALUES ('root', '12345', 'Иванов И.И.', 'None');
        INSERT INTO users(login, password, fullname, personnel_number)
        SELECT ('Оператор ' || index), index, 'ФИО', ('Табельный номер ' || index)
        FROM generate_series(1, 10) AS index;

        --INSERT INTO public.changes select num, 51, 36, num, 34, 26, '' from  generate_series(200, 3200) num;

    END
$$;