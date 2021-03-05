CREATE OR REPLACE FUNCTION enum_statuses_to_smallint(_status enum_statuses)
    RETURNS smallint
    IMMUTABLE AS
$BODY$
BEGIN
    RETURN CASE _status
               WHEN 'ERROR'::enum_statuses THEN 1
               WHEN 'WARNING'::enum_statuses THEN 2
               WHEN 'RESET'::enum_statuses THEN 4
               WHEN 'BUSY'::enum_statuses THEN 8
               WHEN 'CANCELED'::enum_statuses THEN 16
        END;
END;
$BODY$ LANGUAGE plpgsql;
