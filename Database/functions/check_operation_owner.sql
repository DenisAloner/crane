CREATE OR REPLACE FUNCTION public.check_operation_owner(_uncommitted_operation bigint, _user bigint)
    RETURNS boolean AS
$BODY$
BEGIN
    IF NOT EXISTS(SELECT
                  FROM operations
                  WHERE operations.id = _uncommitted_operation
                    AND operations.user_id = _user) THEN
        RAISE EXCEPTION 'Отказ в выполнении команды, так как операция(%) создана другим пользователем(%)',_uncommitted_operation,_user;
    END IF;
    RETURN TRUE;
END;
$BODY$ LANGUAGE plpgsql;