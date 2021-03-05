CREATE OR REPLACE FUNCTION public.enum_privileges_to_role(_privilege enum_privileges)
    RETURNS text
    IMMUTABLE AS
$BODY$
DECLARE
    _prefix constant text := 'arsenalum_';
BEGIN
    RETURN CASE _privilege
               WHEN 'USERS_EDIT' THEN _prefix || 'users_editor'
               WHEN 'UNITS_EDIT' THEN _prefix || 'units_editor'
               WHEN 'REASONS_EDIT' THEN _prefix || 'reasons_editor'
               WHEN 'ZONES_EDIT' THEN _prefix || 'operator'
               WHEN 'NOMENCLATURES_EDIT' THEN _prefix || 'nomenclatures_editor'
               WHEN 'OWNERS_EDIT' THEN _prefix || 'owners_editor'
               WHEN 'PRODUCT_TYPES_EDIT' THEN _prefix || 'product_types_editor'
               WHEN 'SERVICE_ALLOWED' THEN _prefix || 'service'
        END;
END;
$BODY$ LANGUAGE plpgsql;