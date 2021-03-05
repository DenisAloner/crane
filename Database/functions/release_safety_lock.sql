CREATE OR REPLACE FUNCTION public.release_safety_lock(_user bigint)
    RETURNS boolean AS
$BODY$
BEGIN
    RETURN TRUE;
END ;
$BODY$ LANGUAGE plpgsql;