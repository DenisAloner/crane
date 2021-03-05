CREATE OR REPLACE FUNCTION public.user_insert(_login text, _password text)
    RETURNS bigint AS
$BODY$
DECLARE
    _user bigint;
BEGIN
    INSERT INTO users(login, password) VALUES (_login, _password) RETURNING id INTO _user;
    EXECUTE FORMAT(
            'CREATE ROLE %I WITH LOGIN NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L',
            _user,
            _password);
    RETURN _user;
END ;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;

CREATE OR REPLACE FUNCTION public.user_delete(_id bigint)
    RETURNS boolean AS
$BODY$
BEGIN
    DELETE FROM users WHERE users.id = _id;
    EXECUTE FORMAT('DROP ROLE %I', _id);
    RETURN TRUE;
END ;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;