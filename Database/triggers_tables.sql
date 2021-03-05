CREATE OR REPLACE FUNCTION get_address_name(_id bigint) RETURNS text AS
$$
DECLARE
    _addresses_row addresses%ROWTYPE;
BEGIN
    SELECT addresses.* INTO _addresses_row FROM addresses WHERE addresses.id = _id LIMIT 1;
    IF (_addresses_row IS NULL) THEN
        RAISE EXCEPTION 'Адрес не найден';
    END IF;
    RETURN _addresses_row.name;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_reason_name(_id bigint) RETURNS text AS
$$
DECLARE
    _reason_row reasons%ROWTYPE;
BEGIN
    SELECT reasons.* INTO _reason_row FROM reasons WHERE reasons.id = _id LIMIT 1;
    IF (_reason_row IS NULL) THEN
        RAISE EXCEPTION 'Причина не найдена';
    END IF;
    RETURN _reason_row.name;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_column_comparator(_column text, _integration boolean default FALSE,
                                                    _value_mapper text default 'NEW.%1$I') RETURNS text AS
$$
DECLARE
    _result text = format(
            'IF NEW.%1$I IS DISTINCT FROM OLD.%1$I THEN PERFORM signal_update(TG_TABLE_NAME, NEW.id, %1$L);',
            _column);
BEGIN
    IF _integration THEN
        _result = _result || format(
                        'INSERT INTO messages(value) VALUES (json_build_object(''type'',''update_''||TG_TABLE_NAME,''id'',NEW.id,%1$L,' ||
                        _value_mapper || '));',
                        _column);
    END IF;
    RETURN _result || 'END IF;';
END ;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION create_handler(_table text, _update text, _insert text, _delete text) RETURNS text AS
$$
BEGIN
    RETURN format('CREATE OR REPLACE FUNCTION handler_%I() RETURNS trigger AS
$BODY$
BEGIN
    IF (TG_OP = ''INSERT'') THEN
        %s
        PERFORM signal_insert(TG_TABLE_NAME, NEW.id);
        RETURN NEW;
    ELSIF (TG_OP = ''UPDATE'') THEN
        IF NEW.id != OLD.id THEN
            RAISE EXCEPTION ''Изменять идентификатор запрещено'';
        END IF;
        %s
        RETURN NEW;
    ELSIF (TG_OP = ''DELETE'') THEN
        %s
        PERFORM signal_delete(TG_TABLE_NAME, OLD.id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;', _table, _insert, _update, _delete);
END
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION create_trigger(_table text, _update text, _insert text default '',
                                          _delete text default '') RETURNS void AS
$$
BEGIN
    EXECUTE concat(create_handler(_table, _update, _insert, _delete), format('DROP TRIGGER IF EXISTS tr_%1$I ON %1$I;
CREATE TRIGGER tr_%1$I
    AFTER INSERT OR UPDATE OR DELETE
    ON %1$I
    FOR EACH ROW
EXECUTE PROCEDURE handler_%1$I();', _table));
END
$$ LANGUAGE plpgsql;

DO
$$
    BEGIN
        EXECUTE create_trigger('users', concat(
                create_column_comparator('login', true),
                create_column_comparator('password'),
                create_column_comparator('full_name'),
                create_column_comparator('personnel_number'),
                create_column_comparator('privileges')
            ),
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''insert_users'', ''id'', NEW.id,''login'',NEW.login));',
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''delete_users'', ''id'', OLD.id));');
        EXECUTE create_trigger('nomenclatures', concat(
                create_column_comparator('designation', true),
                create_column_comparator('name', true),
                create_column_comparator('unit', true),
                create_column_comparator('product_type', true)
            ),
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''insert_nomenclatures'', ''id'', NEW.id,''name'',NEW.name,''unit'',NEW.unit));',
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''delete_nomenclatures'', ''id'', OLD.id));');
        EXECUTE create_trigger('warehouse', concat(
                create_column_comparator('state')
            ));
        EXECUTE create_trigger('operations', concat(
                create_column_comparator('destination', true, 'get_address_name(NEW.%1$I)'),
                create_column_comparator('weight', true),
                create_column_comparator('user_id', true),
                create_column_comparator('time_stamp', true, 'extract(epoch from NEW.%1$I)')
            ),
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'',''insert_operations'',''id'',NEW.id,''destination'',get_address_name(NEW.destination),''time_stamp'',extract(epoch from NEW.time_stamp),''user_id'',NEW.user_id));',
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''delete_operations'',''id'', OLD.id));');
        EXECUTE create_trigger('reasons', concat(
                create_column_comparator('name'),
                create_column_comparator('direction'),
                create_column_comparator('owner')
            ));
        EXECUTE create_trigger('changes', concat(
                create_column_comparator('source', true, 'get_address_name(NEW.%1$I)'),
                create_column_comparator('operation', true),
                create_column_comparator('nomenclature', true),
                create_column_comparator('owner', true),
                create_column_comparator('reason', true, 'get_reason_name(NEW.%1$I)'),
                create_column_comparator('quantity', true),
                create_column_comparator('increment', true),
                create_column_comparator('basis', true)
            ),
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''insert_changes'', ''source'', get_address_name(NEW.source),''operation'',NEW.operation,''nomenclature'',NEW.nomenclature,''owner'',NEW.owner,''reason'',get_reason_name(NEW.reason),''quantity'',NEW.quantity,''increment'',NEW.increment,''basis'',NEW.basis));',
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''delete_changes'', ''id'', OLD.id));');
        EXECUTE create_trigger('units', concat(
                create_column_comparator('name', true)
            ),
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''insert_units'', ''id'', NEW.id,''name'',NEW.name));',
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''delete_units'', ''id'', OLD.id));');
        EXECUTE create_trigger('addresses', concat(
                create_column_comparator('name'),
                create_column_comparator('type'),
                create_column_comparator('zone'),
                create_column_comparator('x'),
                create_column_comparator('y'),
                create_column_comparator('z'),
                create_column_comparator('state')
            ));
        EXECUTE create_trigger('uncommitted_operations', concat(
                create_column_comparator('source'),
                create_column_comparator('type'),
                create_column_comparator('is_virtual')
            ), 'PERFORM check_addresses(NEW.id);');
        EXECUTE create_trigger('uncommitted_changes', concat(
                create_column_comparator('uncommitted_operation'),
                create_column_comparator('nomenclature'),
                create_column_comparator('reason'),
                create_column_comparator('owner'),
                create_column_comparator('basis')
            ), 'IF EXISTS(SELECT FROM zones WHERE zones.uncommitted_operation = OLD.uncommitted_operation) THEN
            RAISE EXCEPTION ''Вносить изменения по выполняющейся операции запрещено'';
        END IF;', 'IF EXISTS(SELECT FROM zones WHERE zones.uncommitted_operation = OLD.uncommitted_operation) THEN
            RAISE EXCEPTION ''Вносить изменения по выполняющейся операции запрещено'';
        END IF;');
        EXECUTE create_trigger('zones', concat(
                'IF NEW.uncommitted_operation IS DISTINCT FROM OLD.uncommitted_operation THEN
               IF OLD.uncommitted_operation is NOT NULL AND NEW.uncommitted_operation IS NOT NULL THEN
                   RAISE EXCEPTION ''В рабочей зоне уже выполняется операция'';
               END IF;
               PERFORM signal_update(TG_TABLE_NAME, NEW.id, ''uncommitted_operation'');
           END IF;',
                create_column_comparator('status'),
                create_column_comparator('message'),
                create_column_comparator('request')
            ));
        EXECUTE create_trigger('owners', concat(
                create_column_comparator('name', true)
            ),
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''insert_owners'', ''id'', NEW.id,''name'',NEW.name));',
                               'INSERT INTO messages(value) VALUES (json_build_object(''type'', ''delete_owners'', ''id'', OLD.id));');
        EXECUTE create_trigger('product_types', concat(
                create_column_comparator('name')
            ));
    END
$$;
