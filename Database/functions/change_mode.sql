CREATE OR REPLACE FUNCTION public.change_mode(_user bigint)
    RETURNS boolean AS
$BODY$
BEGIN
    RETURN TRUE;
END ;
$BODY$ LANGUAGE plpgsql;