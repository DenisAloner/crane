CREATE OR REPLACE FUNCTION public.privilege_insert(_user bigint, _privilege_text text)
    RETURNS bool AS
$BODY$
DECLARE
    _privilege enum_privileges;
BEGIN
    _privilege := _privilege_text::enum_privileges;
    UPDATE users SET privileges=array_append(privileges, _privilege) WHERE id = _user;
    EXECUTE FORMAT('GRANT %s TO %I', enum_privileges_to_role(_privilege), _user);
    RETURN TRUE;
END ;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;

CREATE OR REPLACE FUNCTION public.privilege_delete(_user bigint, _privilege_text text)
    RETURNS bool AS
$BODY$
DECLARE
    _privilege enum_privileges;
BEGIN
    _privilege := _privilege_text::enum_privileges;
    UPDATE users SET privileges=array_remove(privileges, _privilege) WHERE id = _user;
    EXECUTE FORMAT('REVOKE %s FROM %I', enum_privileges_to_role(_privilege), _user);
    RETURN TRUE;
END ;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER ;