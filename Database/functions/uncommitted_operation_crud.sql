CREATE OR REPLACE FUNCTION public.uncommitted_operation_insert(_source bigint,
                                                               _destination bigint,
                                                               _user bigint,
                                                               _is_virtual boolean)
    RETURNS bigint AS
$BODY$
DECLARE
    _operation        bigint;
BEGIN
    INSERT INTO public.operations(destination, weight, user_id, time_stamp)
    VALUES (_destination, 0.0, _user, 'epoch')
    RETURNING id INTO _operation;
    INSERT INTO uncommitted_operations(id, source, is_virtual) VALUES (_operation, _source, _is_virtual);
    RETURN _operation;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.uncommitted_operation_delete(_id bigint, _user bigint)
    RETURNS void AS
$BODY$
BEGIN
    IF check_operation_owner(_id, _user) THEN
        IF EXISTS(SELECT
                  FROM zones
                  WHERE zones.uncommitted_operation = _id) THEN
            RAISE EXCEPTION 'Нельзя удалить выполняющуюся операцию';
        END IF;
        DELETE FROM uncommitted_changes WHERE uncommitted_changes.uncommitted_operation = _id;
        DELETE FROM uncommitted_operations WHERE uncommitted_operations.id = _id;
        DELETE FROM operations WHERE operations.id = _id;
    END IF;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;