CREATE OR REPLACE FUNCTION public.remove_message(_id bigint)
    RETURNS SETOF messages AS
$BODY$
BEGIN
    DELETE FROM messages WHERE messages.id = _id;
END ;
$BODY$ LANGUAGE plpgsql;