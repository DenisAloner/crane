REVOKE ALL ON SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

GRANT USAGE ON SCHEMA public TO arsenalum_sd_users_editor;
GRANT USAGE ON seq_keys TO arsenalum_sd_users_editor;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO arsenalum_sd_users_editor;
GRANT EXECUTE ON FUNCTION enum_privileges_to_role(enum_privileges) TO arsenalum_sd_users_editor;
ALTER FUNCTION user_insert(text,text) OWNER TO arsenalum_sd_users_editor;
ALTER FUNCTION user_delete(bigint) OWNER TO arsenalum_sd_users_editor;
ALTER FUNCTION privilege_insert(bigint, text) OWNER TO arsenalum_sd_users_editor;
ALTER FUNCTION privilege_delete(bigint, text) OWNER TO arsenalum_sd_users_editor;

GRANT USAGE ON SCHEMA public TO arsenalum_users_editor;
GRANT SELECT, UPDATE ON users TO arsenalum_users_editor;
GRANT EXECUTE ON FUNCTION
    user_insert(text,text),
    user_delete(bigint),
    privilege_insert(bigint,text),
    privilege_delete(bigint,text)
    TO arsenalum_users_editor;

GRANT USAGE ON SCHEMA public TO arsenalum_sd_operator;
GRANT USAGE ON seq_keys TO arsenalum_sd_operator;
GRANT SELECT, INSERT, UPDATE, DELETE ON
    uncommitted_changes,
    uncommitted_operations,
    operations,
    warehouse,
    changes
    TO arsenalum_sd_operator;
GRANT SELECT ON
    addresses,
    nomenclatures,
    product_types,
    reasons,
    units,
    zones,
    owners
    TO arsenalum_sd_operator;
GRANT UPDATE (state) ON addresses TO arsenalum_sd_operator;
GRANT SELECT (id) ON users TO arsenalum_sd_operator;
GRANT UPDATE ON zones TO arsenalum_sd_operator;
GRANT EXECUTE ON FUNCTION
    check_operation_owner(bigint,bigint),
    empty_container(),
    signal_request_done(bigint,bigint)
    TO arsenalum_sd_operator;
ALTER FUNCTION uncommitted_operation_insert(bigint, bigint, bigint, boolean) OWNER TO arsenalum_sd_operator;
ALTER FUNCTION uncommitted_operation_delete(bigint,bigint) OWNER TO arsenalum_sd_operator;
ALTER FUNCTION run_operation(bigint, bigint) OWNER TO arsenalum_sd_operator;
ALTER FUNCTION operator_accept(bigint,bigint) OWNER TO arsenalum_sd_operator;

GRANT USAGE ON SCHEMA public TO arsenalum_operator;
GRANT USAGE ON seq_keys TO arsenalum_operator;
GRANT SELECT ON
    addresses,
    uncommitted_changes,
    uncommitted_operations,
    operations,
    warehouse,
    zones,
    changes,
    nomenclatures,
    owners,
    units,
    product_types,
    reasons
    TO arsenalum_operator;
GRANT INSERT, DELETE ON uncommitted_changes TO arsenalum_operator;
GRANT SELECT (id, full_name) ON users TO arsenalum_operator;
GRANT EXECUTE ON FUNCTION uncommitted_operation_insert(bigint, bigint, bigint, boolean) TO arsenalum_operator;
GRANT EXECUTE ON FUNCTION uncommitted_operation_delete(bigint, bigint) TO arsenalum_operator;
GRANT EXECUTE ON FUNCTION run_operation(bigint, bigint) TO arsenalum_operator;
GRANT EXECUTE ON FUNCTION operator_accept(bigint,bigint) TO arsenalum_operator;

GRANT USAGE ON SCHEMA public TO arsenalum_owners_editor;
GRANT USAGE ON seq_keys TO arsenalum_owners_editor;
GRANT SELECT, INSERT, UPDATE, DELETE ON owners TO arsenalum_owners_editor;

GRANT USAGE ON SCHEMA public TO arsenalum_nomenclatures_editor;
GRANT USAGE ON seq_keys TO arsenalum_nomenclatures_editor;
GRANT SELECT, INSERT, UPDATE, DELETE ON nomenclatures TO arsenalum_nomenclatures_editor;

GRANT USAGE ON SCHEMA public TO arsenalum_product_types_editor;
GRANT USAGE ON seq_keys TO arsenalum_product_types_editor;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_types TO arsenalum_product_types_editor;

GRANT USAGE ON SCHEMA public TO arsenalum_reasons_editor;
GRANT USAGE ON seq_keys TO arsenalum_reasons_editor;
GRANT SELECT ON owners TO arsenalum_reasons_editor;
GRANT SELECT, INSERT, UPDATE, DELETE ON reasons TO arsenalum_reasons_editor;

GRANT USAGE ON SCHEMA public TO arsenalum_units_editor;
GRANT USAGE ON seq_keys TO arsenalum_units_editor;
GRANT SELECT, INSERT, UPDATE, DELETE ON units TO arsenalum_units_editor;

GRANT USAGE ON seq_keys TO arsenalum_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON uncommitted_changes,uncommitted_operations,operations,warehouse,zones,changes TO arsenalum_service;
--GRANT EXECUTE ON FUNCTION done_operation_after_error(bigint) TO arsenalum_service;
--GRANT EXECUTE ON FUNCTION rollback_operation_after_error(bigint) TO arsenalum_service;
GRANT EXECUTE ON FUNCTION change_mode(bigint) TO arsenalum_service;
GRANT EXECUTE ON FUNCTION reset(bigint) TO arsenalum_service;
--GRANT EXECUTE ON FUNCTION release_safety_lock(bigint) TO arsenalum_service;
--ALTER FUNCTION reset(bigint) OWNER TO arsenalum_sd_operator;