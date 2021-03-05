--SET client_encoding = 'win1251';
BEGIN TRANSACTION;
DO
$$
    BEGIN

        SET TIME ZONE 'UTC';

        CREATE extension pgcrypto;

-- Sequence: public.seq_keys
        CREATE SEQUENCE public.seq_keys INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

-- Sequence: public.seq_keys
        CREATE SEQUENCE public.seq_messages INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

-- Type: enum_addresses
        CREATE TYPE public.enum_addresses AS ENUM ('DESK', 'ODD_CELL','EVEN_CELL');

-- Type: type_definition
        CREATE TYPE public.type_definition AS
        (
            id   bigint,
            type enum_addresses,
            x    integer,
            y    integer,
            z    integer
        );

-- Type: operation_types
        CREATE TYPE public.enum_operations AS ENUM ('DESK_TO_CELL', 'CELL_TO_DESK', 'CELL_TO_CELL', 'CELL_TO_DESK_TO_CELL', 'CELL_TO_DESK_TO_CELL_WITHOUT_CONFIRMATION');

-- Type: type_task
        CREATE TYPE public.type_task AS
        (
            zone       bigint,
            message    bigint,
            type       enum_operations,
            operation  bigint,
            address1   type_definition,
            address2   type_definition,
            address3   type_definition,
            is_virtual smallint
        );

-- Type: direction
        CREATE TYPE public.enum_directions AS ENUM ('NONE','ARRIVAL', 'ISSUE','ANY');

-- Type: privilege
        CREATE TYPE public.enum_privileges AS ENUM ('USERS_EDIT', 'UNITS_EDIT', 'REASONS_EDIT', 'ZONES_EDIT', 'NOMENCLATURES_EDIT', 'OWNERS_EDIT', 'PRODUCT_TYPES_EDIT', 'SERVICE_ALLOWED');

-- Type: statuses
        CREATE TYPE public.enum_statuses AS ENUM ('ERROR', 'WARNING', 'RESET', 'BUSY', 'CANCELED');

-- Type: address_states
        CREATE TYPE public.enum_states AS ENUM ('UNLOCKED', 'LOCKED');

-- Type: request_types
        CREATE TYPE public.enum_requests AS ENUM ('WRITING_TO_DATABASE_COMPLETED');

-- Table: public.messages
        CREATE TABLE public.messages
        (
            id    bigint NOT NULL DEFAULT nextval('seq_messages'::regclass),
            value json   NOT NULL,
            CONSTRAINT messages_primary_key PRIMARY KEY (id)
        )
            TABLESPACE pg_default;

-- Table: public.units
        CREATE TABLE public.units
        (
            id   bigint                                         NOT NULL DEFAULT nextval('seq_keys'::regclass),
            name character varying COLLATE pg_catalog."default" NOT NULL,
            CONSTRAINT units_primary_key PRIMARY KEY (id),
            CONSTRAINT units_name_unique UNIQUE (name)
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.product_types

        CREATE TABLE public.product_types
        (
            id   bigint                                         NOT NULL DEFAULT nextval('seq_keys'::regclass),
            name character varying COLLATE pg_catalog."default" NOT NULL,
            CONSTRAINT product_types_primary_key PRIMARY KEY (id),
            CONSTRAINT product_types_name_unique UNIQUE (name)
        )
            TABLESPACE pg_default;

-- Table: public.nomenclatures
        CREATE TABLE public.nomenclatures
        (
            id           bigint                                              NOT NULL DEFAULT nextval('seq_keys'::regclass),
            designation  character varying(255) COLLATE pg_catalog."default" NOT NULL,
            name         character varying(255) COLLATE pg_catalog."default" NOT NULL,
            unit         bigint                                              NOT NULL,
            product_type bigint                                              NOT NULL,
            CONSTRAINT nomenclatures_primary_key PRIMARY KEY (id),
            CONSTRAINT nomenclatures_designation_product_type_unique UNIQUE (designation, product_type),
            CONSTRAINT product_type_foreign_key FOREIGN KEY (product_type)
                REFERENCES public.product_types (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT unit_foreign_key FOREIGN KEY (unit)
                REFERENCES public.units (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.zones
        CREATE TABLE public.zones
        (
            id                    bigint   NOT NULL DEFAULT nextval('seq_keys'::regclass),
            uncommitted_operation bigint,
            status                smallint NOT NULL,
            message               bigint,
            request               smallint,
            CONSTRAINT zones_primary_key PRIMARY KEY (id),
            CONSTRAINT zones_uncommitted_operation_unique UNIQUE (uncommitted_operation)
        ) WITH (OIDS = FALSE)
          TABLESPACE pg_default;

-- Table: public.addresses
        CREATE TABLE public.addresses
        (
            id        bigint                                         NOT NULL DEFAULT nextval('seq_keys'::regclass),
            name      character varying COLLATE pg_catalog."default" NOT NULL,
            type      enum_addresses                                 NOT NULL,
            zone      bigint                                         NOT NULL,
            x         integer                                        NOT NULL,
            y         integer                                        NOT NULL,
            z         integer                                        NOT NULL,
            state     enum_states                                    NOT NULL DEFAULT 'UNLOCKED'::enum_states,
            CONSTRAINT addresses_primary_key PRIMARY KEY (id),
            CONSTRAINT zone_foreign_key FOREIGN KEY (zone)
                REFERENCES public.zones (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.owners
        CREATE TABLE public.owners
        (
            id   bigint                                         NOT NULL DEFAULT nextval('seq_keys'::regclass),
            name character varying COLLATE pg_catalog."default" NOT NULL,
            CONSTRAINT owners_primary_key PRIMARY KEY (id),
            CONSTRAINT owners_name_unique UNIQUE (name)
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.reasons
        CREATE TABLE public.reasons
        (
            id        bigint                                         NOT NULL DEFAULT nextval('seq_keys'::regclass),
            name      character varying COLLATE pg_catalog."default" NOT NULL,
            direction enum_directions                                NOT NULL,
            owner     bigint,
            CONSTRAINT reasons_primary_key PRIMARY KEY (id),
            CONSTRAINT reasons_name_unique UNIQUE (name),
            CONSTRAINT owner_foreign_key FOREIGN KEY (owner)
                REFERENCES public.owners (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.users
        CREATE TABLE public.users
        (
            id               bigint                                             NOT NULL DEFAULT nextval('seq_keys'::regclass),
            login            character varying(32) COLLATE pg_catalog."default" NOT NULL,
            password         character varying(64) COLLATE pg_catalog."default" NOT NULL,
            full_name        character varying COLLATE pg_catalog."default",
            personnel_number character varying COLLATE pg_catalog."default",
            privileges       enum_privileges[]                                  NOT NULL DEFAULT ARRAY []::enum_privileges[],
            CONSTRAINT users_primary_key PRIMARY KEY (id),
            CONSTRAINT users_login_unique UNIQUE (login)
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.operations
        CREATE TABLE public.operations
        (
            id          bigint                      NOT NULL DEFAULT nextval('seq_keys'::regclass),
            destination bigint                      NOT NULL,
            weight      real                        NOT NULL,
            user_id     bigint                      NOT NULL,
            time_stamp  timestamp without time zone NOT NULL,
            CONSTRAINT operations_primary_key PRIMARY KEY (id),
            CONSTRAINT destination_foreign_key FOREIGN KEY (destination)
                REFERENCES public.addresses (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT user_id_foreign_key FOREIGN KEY (user_id)
                REFERENCES public.users (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.changes
        CREATE TABLE public.changes
        (
            id           bigint NOT NULL DEFAULT nextval('seq_keys'::regclass),
            source       bigint NOT NULL,
            operation    bigint NOT NULL,
            nomenclature bigint NOT NULL,
            quantity     real   NOT NULL,
            owner        bigint NOT NULL,
            increment    real   NOT NULL,
            reason       bigint NOT NULL,
            basis        character varying COLLATE pg_catalog."default",
            CONSTRAINT changes_primary_key PRIMARY KEY (id),
            CONSTRAINT changes_operation_nomenclature_unique UNIQUE (operation, nomenclature),
            CONSTRAINT source_foreign_key FOREIGN KEY (source)
                REFERENCES public.addresses (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT operation_foreign_key FOREIGN KEY (operation)
                REFERENCES public.operations (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT nomenclature_foreign_key FOREIGN KEY (nomenclature)
                REFERENCES public.nomenclatures (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT owner_foreign_key FOREIGN KEY (owner)
                REFERENCES public.owners (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT reason_foreign_key FOREIGN KEY (reason)
                REFERENCES public.reasons (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.warehouse
        CREATE TABLE public.warehouse
        (
            id    bigint      NOT NULL,
            state enum_states NOT NULL DEFAULT 'UNLOCKED'::enum_states,
            CONSTRAINT warehouse_id_unique UNIQUE (id),
            CONSTRAINT id_foreign_key FOREIGN KEY (id)
                REFERENCES public.changes (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

-- Table: public.incomplete_operations
        CREATE TABLE public.uncommitted_operations
        (
            id         bigint  NOT NULL,
            source     bigint  NOT NULL,
            type       enum_operations,
            is_virtual boolean NOT NULL DEFAULT FALSE,
            CONSTRAINT uncommitted_operations_primary_key PRIMARY KEY (id),
            CONSTRAINT id_foreign_key FOREIGN KEY (id)
                REFERENCES public.operations (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT source_foreign_key FOREIGN KEY (source)
                REFERENCES public.addresses (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

        ALTER TABLE public.zones
            ADD CONSTRAINT uncommitted_operation_foreign_key FOREIGN KEY (uncommitted_operation)
                REFERENCES public.uncommitted_operations (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION;

-- Table: public.changes
        CREATE TABLE public.uncommitted_changes
        (
            id                    bigint NOT NULL DEFAULT nextval('seq_keys'::regclass),
            uncommitted_operation bigint NOT NULL,
            nomenclature          bigint NOT NULL,
            increment             real   NOT NULL,
            reason                bigint NOT NULL,
            owner                 bigint NOT NULL,
            basis                 character varying COLLATE pg_catalog."default",
            CONSTRAINT uncommitted_changes_uncommitted_operation_nomenclature_unique UNIQUE (uncommitted_operation, nomenclature),
            CONSTRAINT nomenclature_foreign_key FOREIGN KEY (nomenclature)
                REFERENCES public.nomenclatures (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT reason_foreign_key FOREIGN KEY (reason)
                REFERENCES public.reasons (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT owner_foreign_key FOREIGN KEY (owner)
                REFERENCES public.owners (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT uncommitted_operation_foreign__key FOREIGN KEY (uncommitted_operation)
                REFERENCES public.uncommitted_operations (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;

        INSERT INTO public.zones(status) VALUES (0);

        EXECUTE 'CREATE OR REPLACE FUNCTION public.empty_container() RETURNS bigint AS
        $BODY$
        BEGIN
            return -1;
        END;
        $BODY$ LANGUAGE plpgsql IMMUTABLE';

        EXECUTE 'CREATE OR REPLACE FUNCTION public.check_empty_container(_id bigint) RETURNS void AS
        $BODY$
        BEGIN
        END;
        $BODY$ LANGUAGE plpgsql IMMUTABLE';

    END;
$$;

\i functions/user_crud.sql
\i functions/enum_privileges_to_role.sql
\i functions/privilege_crud.sql
\i functions/notify_funtions.sql
\i functions/change_mode.sql
\i functions/check_addresses.sql
\i functions/check_operation_owner.sql
\i functions/uncommitted_operation_crud.sql
\i functions/enum_statuses_to_smallint.sql
\i functions/done_operation.sql
\i functions/operator_accept.sql
\i functions/reset.sql
\i functions/run_operation.sql
\i functions/set_weight.sql
\i functions/lock_unlock.sql
\i functions/get_message.sql
\i functions/remove_message.sql
\i triggers_tables.sql
\i create_roles.sql
\i roles.sql

DO
$$
    DECLARE
        _root_user       bigint;
        _unit            bigint;
        _product_type    bigint;
        _empty_container bigint;
    BEGIN
        _root_user := user_insert('root', '12345');
        EXECUTE 'CREATE OR REPLACE FUNCTION public.root_user() RETURNS bigint AS
                $BODY$
                BEGIN return ' || _root_user || ';
                END;
                $BODY$ LANGUAGE plpgsql IMMUTABLE';
        PERFORM privilege_insert(root_user(), 'USERS_EDIT');
        PERFORM privilege_insert(root_user(), 'UNITS_EDIT');
        PERFORM privilege_insert(root_user(), 'REASONS_EDIT');
        PERFORM privilege_insert(root_user(), 'ZONES_EDIT');
        PERFORM privilege_insert(root_user(), 'NOMENCLATURES_EDIT');
        PERFORM privilege_insert(root_user(), 'OWNERS_EDIT');
        PERFORM privilege_insert(root_user(), 'PRODUCT_TYPES_EDIT');
        PERFORM privilege_insert(root_user(), 'SERVICE_ALLOWED');

        INSERT INTO public.units(name) VALUES ('шт') RETURNING units.id INTO _unit;
        INSERT INTO public.product_types(name)
        VALUES ('Без вида детали')
        RETURNING product_types.id INTO _product_type;
        INSERT INTO public.nomenclatures(designation, name, unit, product_type)
        VALUES ('ТАРА.001', 'Пустой контейнер', _unit, _product_type)
        RETURNING nomenclatures.id INTO _empty_container;

        EXECUTE 'CREATE OR REPLACE FUNCTION public.empty_container() RETURNS bigint AS
        $BODY$
        BEGIN
            return ' || _empty_container || ';
        END;
        $BODY$ LANGUAGE plpgsql IMMUTABLE';

        EXECUTE 'CREATE OR REPLACE FUNCTION public.check_empty_container(_id bigint) RETURNS void AS
        $BODY$
        BEGIN
        IF _id = empty_container() THEN
            RAISE EXCEPTION ''Запрещено удалять данный вид номенклатуры'';
        END IF;
        END;
        $BODY$ LANGUAGE plpgsql IMMUTABLE';
    END;
$$ LANGUAGE plpgsql;

\i scenario_stand.sql
COMMIT;