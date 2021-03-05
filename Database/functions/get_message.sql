CREATE OR REPLACE FUNCTION public.get_message()
    RETURNS TABLE
            (
                id    bigint,
                value text
            )
AS
$BODY$
DECLARE
    _message_row messages%ROWTYPE;
BEGIN
    -- RETURN QUERY SELECT message_queue.id,message_queue.value FROM message_queue LIMIT 300;
    SELECT messages.* INTO _message_row FROM messages LIMIT 300;
    IF NOT (_message_row IS NULL) THEN
        RETURN QUERY SELECT _message_row.id id, (_message_row.value::text) as value;
    END IF;
    RETURN;
END ;
$BODY$ LANGUAGE plpgsql;