--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Debian 17.4-1.pgdg120+2)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: airbyte_internal; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA airbyte_internal;


ALTER SCHEMA airbyte_internal OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _airbyte_destination_state; Type: TABLE; Schema: airbyte_internal; Owner: postgres
--

CREATE TABLE airbyte_internal._airbyte_destination_state (
    name character varying,
    namespace character varying,
    destination_state character varying,
    updated_at timestamp with time zone
);


ALTER TABLE airbyte_internal._airbyte_destination_state OWNER TO postgres;

--
-- Name: public_raw__stream_raw_salary_data_staging; Type: TABLE; Schema: airbyte_internal; Owner: postgres
--

CREATE TABLE airbyte_internal.public_raw__stream_raw_salary_data_staging (
    _airbyte_raw_id character varying NOT NULL,
    _airbyte_data jsonb,
    _airbyte_extracted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    _airbyte_loaded_at timestamp with time zone,
    _airbyte_meta jsonb,
    _airbyte_generation_id bigint
);


ALTER TABLE airbyte_internal.public_raw__stream_raw_salary_data_staging OWNER TO postgres;

--
-- Name: public_raw__stream_salary_record_202404; Type: TABLE; Schema: airbyte_internal; Owner: postgres
--

CREATE TABLE airbyte_internal.public_raw__stream_salary_record_202404 (
    _airbyte_raw_id character varying NOT NULL,
    _airbyte_data jsonb,
    _airbyte_extracted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    _airbyte_loaded_at timestamp with time zone,
    _airbyte_meta jsonb,
    _airbyte_generation_id bigint
);


ALTER TABLE airbyte_internal.public_raw__stream_salary_record_202404 OWNER TO postgres;

--
-- Name: raw_salary_data_staging_raw__stream_salary_record_202404; Type: TABLE; Schema: airbyte_internal; Owner: postgres
--

CREATE TABLE airbyte_internal.raw_salary_data_staging_raw__stream_salary_record_202404 (
    _airbyte_raw_id character varying NOT NULL,
    _airbyte_data jsonb,
    _airbyte_extracted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    _airbyte_loaded_at timestamp with time zone,
    _airbyte_meta jsonb,
    _airbyte_generation_id bigint
);


ALTER TABLE airbyte_internal.raw_salary_data_staging_raw__stream_salary_record_202404 OWNER TO postgres;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    unit_id integer NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_copy_0425113106; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments_copy_0425113106 (
    id integer,
    name text,
    unit_id integer,
    description text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.departments_copy_0425113106 OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: dim_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_departments (
    department_id bigint,
    department_name text,
    unit_id bigint
);


ALTER TABLE public.dim_departments OWNER TO postgres;

--
-- Name: dim_establishment_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_establishment_types (
    establishment_type_id bigint,
    establishment_type_name text
);


ALTER TABLE public.dim_establishment_types OWNER TO postgres;

--
-- Name: dim_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_units (
    unit_id bigint,
    unit_name text
);


ALTER TABLE public.dim_units OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_unique_id text,
    name text NOT NULL,
    id_card_number text,
    bank_account_number text,
    bank_name text,
    hire_date date,
    employment_status text,
    unit_id integer,
    department_id integer,
    remarks text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    establishment_type_id integer
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: establishment_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.establishment_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.establishment_types OWNER TO postgres;

--
-- Name: establishment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.establishment_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.establishment_types_id_seq OWNER TO postgres;

--
-- Name: establishment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.establishment_types_id_seq OWNED BY public.establishment_types.id;


--
-- Name: field_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.field_mappings (
    field_code text NOT NULL,
    chinese_name text NOT NULL,
    category text,
    description text,
    data_type text,
    display_order integer
);


ALTER TABLE public.field_mappings OWNER TO postgres;

--
-- Name: my_first_dbt_model; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.my_first_dbt_model (
    id integer
);


ALTER TABLE public.my_first_dbt_model OWNER TO postgres;

--
-- Name: raw_salary_data_staging; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raw_salary_data_staging (
    employee_name character varying,
    other_remarks numeric(38,9),
    id_card_number numeric(38,9),
    salary_subsidy numeric(38,9),
    salary_allowance numeric(38,9),
    employee_unique_id numeric(38,9),
    salary_post_salary numeric(38,9),
    salary_salary_step numeric(38,9),
    salary_basic_salary numeric(38,9),
    _airbyte_source_file character varying,
    _airbyte_source_sheet character varying,
    deduct_tax_adjustment numeric(38,9),
    job_attr_salary_grade character varying,
    job_attr_salary_level character varying,
    pay_period_identifier character varying,
    salary_salary_backpay numeric(38,9),
    job_attr_post_category character varying,
    salary_other_allowance numeric(38,9),
    deduct_other_deductions numeric(38,9),
    establishment_type_name character varying,
    job_attr_personnel_rank character varying,
    salary_living_allowance numeric(38,9),
    salary_probation_salary numeric(38,9),
    salary_one_time_deduction numeric(38,9),
    salary_performance_salary numeric(38,9),
    job_attr_personnel_identity character varying,
    salary_total_backpay_amount numeric(38,9),
    deduct_individual_income_tax numeric(38,9),
    deduct_housing_fund_adjustment numeric(38,9),
    salary_basic_performance_bonus numeric(38,9),
    salary_petition_post_allowance numeric(38,9),
    salary_post_position_allowance numeric(38,9),
    salary_transportation_allowance numeric(38,9),
    deduct_self_annuity_contribution numeric(38,9),
    deduct_self_medical_contribution numeric(38,9),
    deduct_self_pension_contribution numeric(38,9),
    salary_monthly_basic_performance numeric(38,9),
    salary_only_child_parents_reward numeric(38,9),
    salary_rank_or_post_grade_salary numeric(38,9),
    salary_salary_step_backpay_total numeric(38,9),
    job_attr_ref_official_salary_step character varying,
    salary_monthly_reward_performance numeric(38,9),
    salary_total_deduction_adjustment numeric(38,9),
    deduct_social_insurance_adjustment numeric(38,9),
    salary_quarterly_performance_bonus numeric(38,9),
    job_attr_annual_fixed_salary_amount numeric(38,9),
    salary_position_or_technical_salary numeric(38,9),
    salary_reform_1993_reserved_subsidy numeric(38,9),
    salary_reward_performance_deduction numeric(38,9),
    contrib_employer_annuity_contribution numeric(38,9),
    contrib_employer_medical_contribution numeric(38,9),
    contrib_employer_pension_contribution numeric(38,9),
    deduct_self_housing_fund_contribution numeric(38,9),
    deduct_self_unemployment_contribution numeric(38,9),
    salary_petition_worker_post_allowance numeric(38,9),
    job_attr_ref_official_post_salary_level character varying,
    salary_basic_performance_bonus_deduction numeric(38,9),
    salary_civil_servant_normative_allowance numeric(38,9),
    contrib_employer_housing_fund_contribution numeric(38,9),
    contrib_employer_unemployment_contribution numeric(38,9),
    contrib_employer_critical_illness_contribution numeric(38,9),
    _airbyte_raw_id character varying(36) NOT NULL,
    _airbyte_extracted_at timestamp with time zone NOT NULL,
    _airbyte_generation_id bigint,
    _airbyte_meta jsonb NOT NULL
);


ALTER TABLE public.raw_salary_data_staging OWNER TO postgres;

--
-- Name: raw_salary_data_staging_ab_soft_reset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raw_salary_data_staging_ab_soft_reset (
    employee_name character varying,
    other_remarks numeric(38,9),
    id_card_number numeric(38,9),
    salary_subsidy numeric(38,9),
    salary_allowance numeric(38,9),
    employee_unique_id numeric(38,9),
    salary_post_salary numeric(38,9),
    salary_salary_step numeric(38,9),
    salary_basic_salary numeric(38,9),
    _airbyte_source_file character varying,
    _airbyte_source_sheet character varying,
    deduct_tax_adjustment numeric(38,9),
    job_attr_salary_grade character varying,
    job_attr_salary_level character varying,
    pay_period_identifier character varying,
    salary_salary_backpay numeric(38,9),
    job_attr_post_category character varying,
    salary_other_allowance numeric(38,9),
    deduct_other_deductions numeric(38,9),
    establishment_type_name character varying,
    job_attr_personnel_rank character varying,
    salary_living_allowance numeric(38,9),
    salary_probation_salary numeric(38,9),
    salary_one_time_deduction numeric(38,9),
    salary_performance_salary numeric(38,9),
    job_attr_personnel_identity character varying,
    salary_total_backpay_amount numeric(38,9),
    deduct_individual_income_tax numeric(38,9),
    deduct_housing_fund_adjustment numeric(38,9),
    salary_basic_performance_bonus numeric(38,9),
    salary_petition_post_allowance numeric(38,9),
    salary_post_position_allowance numeric(38,9),
    salary_transportation_allowance numeric(38,9),
    deduct_self_annuity_contribution numeric(38,9),
    deduct_self_medical_contribution numeric(38,9),
    deduct_self_pension_contribution numeric(38,9),
    salary_monthly_basic_performance numeric(38,9),
    salary_only_child_parents_reward numeric(38,9),
    salary_rank_or_post_grade_salary numeric(38,9),
    salary_salary_step_backpay_total numeric(38,9),
    job_attr_ref_official_salary_step character varying,
    salary_monthly_reward_performance numeric(38,9),
    salary_total_deduction_adjustment numeric(38,9),
    deduct_social_insurance_adjustment numeric(38,9),
    salary_quarterly_performance_bonus numeric(38,9),
    job_attr_annual_fixed_salary_amount numeric(38,9),
    salary_position_or_technical_salary numeric(38,9),
    salary_reform_1993_reserved_subsidy numeric(38,9),
    salary_reward_performance_deduction numeric(38,9),
    contrib_employer_annuity_contribution numeric(38,9),
    contrib_employer_medical_contribution numeric(38,9),
    contrib_employer_pension_contribution numeric(38,9),
    deduct_self_housing_fund_contribution numeric(38,9),
    deduct_self_unemployment_contribution numeric(38,9),
    salary_petition_worker_post_allowance numeric(38,9),
    job_attr_ref_official_post_salary_level character varying,
    salary_basic_performance_bonus_deduction numeric(38,9),
    salary_civil_servant_normative_allowance numeric(38,9),
    contrib_employer_housing_fund_contribution numeric(38,9),
    contrib_employer_unemployment_contribution numeric(38,9),
    contrib_employer_critical_illness_contribution numeric(38,9),
    _airbyte_raw_id character varying(36) NOT NULL,
    _airbyte_extracted_at timestamp with time zone NOT NULL,
    _airbyte_generation_id bigint,
    _airbyte_meta jsonb NOT NULL
);


ALTER TABLE public.raw_salary_data_staging_ab_soft_reset OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: salary_field_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_field_mappings (
    source_name character varying NOT NULL,
    target_name character varying NOT NULL,
    is_intermediate boolean,
    is_final boolean,
    description text,
    data_type character varying(50)
);


ALTER TABLE public.salary_field_mappings OWNER TO postgres;

--
-- Name: salary_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_records (
    employee_id bigint,
    pay_period_identifier text,
    establishment_type_id bigint,
    job_attributes jsonb,
    salary_components jsonb,
    personal_deductions jsonb,
    company_contributions jsonb,
    other_remarks text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.salary_records OWNER TO postgres;

--
-- Name: stg_departments; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.stg_departments AS
 WITH source AS (
         SELECT departments.id,
            departments.name,
            departments.unit_id,
            departments.description,
            departments.created_at,
            departments.updated_at
           FROM public.departments
        ), renamed AS (
         SELECT source.id AS department_id,
            source.name AS department_name,
            source.unit_id
           FROM source
        )
 SELECT (department_id)::bigint AS department_id,
    department_name,
    (unit_id)::bigint AS unit_id
   FROM renamed;


ALTER VIEW public.stg_departments OWNER TO postgres;

--
-- Name: stg_employees; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.stg_employees AS
 WITH source AS (
         SELECT employees.id,
            employees.employee_unique_id,
            employees.name,
            employees.id_card_number,
            employees.bank_account_number,
            employees.bank_name,
            employees.hire_date,
            employees.employment_status,
            employees.unit_id,
            employees.department_id,
            employees.remarks,
            employees.created_at,
            employees.updated_at
           FROM public.employees
        ), renamed AS (
         SELECT source.id AS employee_id,
            source.id_card_number,
            source.name AS employee_name,
            source.department_id
           FROM source
        )
 SELECT (employee_id)::bigint AS employee_id,
    id_card_number,
    employee_name,
    (department_id)::bigint AS department_id
   FROM renamed;


ALTER VIEW public.stg_employees OWNER TO postgres;

--
-- Name: stg_establishment_types; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.stg_establishment_types AS
 WITH source AS (
         SELECT establishment_types.id,
            establishment_types.name,
            establishment_types.description,
            establishment_types.created_at,
            establishment_types.updated_at
           FROM public.establishment_types
        ), renamed AS (
         SELECT source.id AS establishment_type_id,
            source.name AS establishment_type_name
           FROM source
        )
 SELECT (establishment_type_id)::bigint AS establishment_type_id,
    establishment_type_name
   FROM renamed;


ALTER VIEW public.stg_establishment_types OWNER TO postgres;

--
-- Name: stg_raw_salary_data; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.stg_raw_salary_data AS
 WITH source AS (
         SELECT raw_salary_data_staging.employee_name,
            raw_salary_data_staging.other_remarks,
            raw_salary_data_staging.id_card_number,
            raw_salary_data_staging.salary_subsidy,
            raw_salary_data_staging.salary_allowance,
            raw_salary_data_staging.employee_unique_id,
            raw_salary_data_staging.salary_post_salary,
            raw_salary_data_staging.salary_salary_step,
            raw_salary_data_staging.salary_basic_salary,
            raw_salary_data_staging._airbyte_source_file,
            raw_salary_data_staging._airbyte_source_sheet,
            raw_salary_data_staging.deduct_tax_adjustment,
            raw_salary_data_staging.job_attr_salary_grade,
            raw_salary_data_staging.job_attr_salary_level,
            raw_salary_data_staging.pay_period_identifier,
            raw_salary_data_staging.salary_salary_backpay,
            raw_salary_data_staging.job_attr_post_category,
            raw_salary_data_staging.salary_other_allowance,
            raw_salary_data_staging.deduct_other_deductions,
            raw_salary_data_staging.establishment_type_name,
            raw_salary_data_staging.job_attr_personnel_rank,
            raw_salary_data_staging.salary_living_allowance,
            raw_salary_data_staging.salary_probation_salary,
            raw_salary_data_staging.salary_one_time_deduction,
            raw_salary_data_staging.salary_performance_salary,
            raw_salary_data_staging.job_attr_personnel_identity,
            raw_salary_data_staging.salary_total_backpay_amount,
            raw_salary_data_staging.deduct_individual_income_tax,
            raw_salary_data_staging.deduct_housing_fund_adjustment,
            raw_salary_data_staging.salary_basic_performance_bonus,
            raw_salary_data_staging.salary_petition_post_allowance,
            raw_salary_data_staging.salary_post_position_allowance,
            raw_salary_data_staging.salary_transportation_allowance,
            raw_salary_data_staging.deduct_self_annuity_contribution,
            raw_salary_data_staging.deduct_self_medical_contribution,
            raw_salary_data_staging.deduct_self_pension_contribution,
            raw_salary_data_staging.salary_monthly_basic_performance,
            raw_salary_data_staging.salary_only_child_parents_reward,
            raw_salary_data_staging.salary_rank_or_post_grade_salary,
            raw_salary_data_staging.salary_salary_step_backpay_total,
            raw_salary_data_staging.job_attr_ref_official_salary_step,
            raw_salary_data_staging.salary_monthly_reward_performance,
            raw_salary_data_staging.salary_total_deduction_adjustment,
            raw_salary_data_staging.deduct_social_insurance_adjustment,
            raw_salary_data_staging.salary_quarterly_performance_bonus,
            raw_salary_data_staging.job_attr_annual_fixed_salary_amount,
            raw_salary_data_staging.salary_position_or_technical_salary,
            raw_salary_data_staging.salary_reform_1993_reserved_subsidy,
            raw_salary_data_staging.salary_reward_performance_deduction,
            raw_salary_data_staging.contrib_employer_annuity_contribution,
            raw_salary_data_staging.contrib_employer_medical_contribution,
            raw_salary_data_staging.contrib_employer_pension_contribution,
            raw_salary_data_staging.deduct_self_housing_fund_contribution,
            raw_salary_data_staging.deduct_self_unemployment_contribution,
            raw_salary_data_staging.salary_petition_worker_post_allowance,
            raw_salary_data_staging.job_attr_ref_official_post_salary_level,
            raw_salary_data_staging.salary_basic_performance_bonus_deduction,
            raw_salary_data_staging.salary_civil_servant_normative_allowance,
            raw_salary_data_staging.contrib_employer_housing_fund_contribution,
            raw_salary_data_staging.contrib_employer_unemployment_contribution,
            raw_salary_data_staging.contrib_employer_critical_illness_contribution,
            raw_salary_data_staging._airbyte_raw_id,
            raw_salary_data_staging._airbyte_extracted_at,
            raw_salary_data_staging._airbyte_generation_id,
            raw_salary_data_staging._airbyte_meta
           FROM public.raw_salary_data_staging
        ), renamed_recasted AS (
         SELECT ((source.id_card_number)::bigint)::text AS id_card_number,
            (source.employee_name)::text AS employee_name,
            ((source.employee_unique_id)::bigint)::text AS employee_unique_id,
            (source.establishment_type_name)::text AS establishment_type_name,
            (source.pay_period_identifier)::text AS pay_period_identifier,
            (source.job_attr_personnel_identity)::text AS job_attr_personnel_identity,
            (source.job_attr_personnel_rank)::text AS job_attr_personnel_rank,
            (source.job_attr_post_category)::text AS job_attr_post_category,
            (source.job_attr_ref_official_post_salary_level)::text AS job_attr_ref_official_post_salary_level,
            (source.job_attr_ref_official_salary_step)::text AS job_attr_ref_official_salary_step,
            (source.job_attr_salary_level)::text AS job_attr_salary_level,
            (source.job_attr_salary_grade)::text AS job_attr_salary_grade,
            (round(source.job_attr_annual_fixed_salary_amount, 2))::numeric(12,2) AS job_attr_annual_fixed_salary_amount,
            (round(source.salary_one_time_deduction, 2))::numeric(12,2) AS salary_one_time_deduction,
            (round(source.salary_basic_performance_bonus_deduction, 2))::numeric(12,2) AS salary_basic_performance_bonus_deduction,
            (round(source.salary_position_or_technical_salary, 2))::numeric(12,2) AS salary_position_or_technical_salary,
            (round(source.salary_rank_or_post_grade_salary, 2))::numeric(12,2) AS salary_rank_or_post_grade_salary,
            (round(source.salary_reform_1993_reserved_subsidy, 2))::numeric(12,2) AS salary_reform_1993_reserved_subsidy,
            (round(source.salary_only_child_parents_reward, 2))::numeric(12,2) AS salary_only_child_parents_reward,
            (round(source.salary_post_position_allowance, 2))::numeric(12,2) AS salary_post_position_allowance,
            (round(source.salary_civil_servant_normative_allowance, 2))::numeric(12,2) AS salary_civil_servant_normative_allowance,
            (round(source.salary_transportation_allowance, 2))::numeric(12,2) AS salary_transportation_allowance,
            (round(source.salary_basic_performance_bonus, 2))::numeric(12,2) AS salary_basic_performance_bonus,
            (round(source.salary_probation_salary, 2))::numeric(12,2) AS salary_probation_salary,
            (round(source.salary_petition_worker_post_allowance, 2))::numeric(12,2) AS salary_petition_worker_post_allowance,
            (round(source.salary_reward_performance_deduction, 2))::numeric(12,2) AS salary_reward_performance_deduction,
            (round(source.salary_post_salary, 2))::numeric(12,2) AS salary_post_salary,
            (round(source.salary_salary_step, 2))::numeric(12,2) AS salary_salary_step,
            (round(source.salary_monthly_basic_performance, 2))::numeric(12,2) AS salary_monthly_basic_performance,
            (round(source.salary_monthly_reward_performance, 2))::numeric(12,2) AS salary_monthly_reward_performance,
            (round(source.salary_basic_salary, 2))::numeric(12,2) AS salary_basic_salary,
            (round(source.salary_performance_salary, 2))::numeric(12,2) AS salary_performance_salary,
            (round(source.salary_other_allowance, 2))::numeric(12,2) AS salary_other_allowance,
            (round(source.salary_salary_backpay, 2))::numeric(12,2) AS salary_salary_backpay,
            (round(source.salary_allowance, 2))::numeric(12,2) AS salary_allowance,
            (round(source.salary_quarterly_performance_bonus, 2))::numeric(12,2) AS salary_quarterly_performance_bonus,
            (round(source.salary_subsidy, 2))::numeric(12,2) AS salary_subsidy,
            (round(source.salary_petition_post_allowance, 2))::numeric(12,2) AS salary_petition_post_allowance,
            (round(source.salary_total_deduction_adjustment, 2))::numeric(12,2) AS salary_total_deduction_adjustment,
            (round(source.salary_living_allowance, 2))::numeric(12,2) AS salary_living_allowance,
            (round(source.salary_salary_step_backpay_total, 2))::numeric(12,2) AS salary_salary_step_backpay_total,
            (round(source.salary_total_backpay_amount, 2))::numeric(12,2) AS salary_total_backpay_amount,
            (round(source.deduct_self_pension_contribution, 2))::numeric(12,2) AS deduct_self_pension_contribution,
            (round(source.deduct_self_medical_contribution, 2))::numeric(12,2) AS deduct_self_medical_contribution,
            (round(source.deduct_self_annuity_contribution, 2))::numeric(12,2) AS deduct_self_annuity_contribution,
            (round(source.deduct_self_housing_fund_contribution, 2))::numeric(12,2) AS deduct_self_housing_fund_contribution,
            (round(source.deduct_self_unemployment_contribution, 2))::numeric(12,2) AS deduct_self_unemployment_contribution,
            (round(source.deduct_individual_income_tax, 2))::numeric(12,2) AS deduct_individual_income_tax,
            (round(source.deduct_other_deductions, 2))::numeric(12,2) AS deduct_other_deductions,
            (round(source.deduct_social_insurance_adjustment, 2))::numeric(12,2) AS deduct_social_insurance_adjustment,
            (round(source.deduct_housing_fund_adjustment, 2))::numeric(12,2) AS deduct_housing_fund_adjustment,
            (round(source.deduct_tax_adjustment, 2))::numeric(12,2) AS deduct_tax_adjustment,
            (round(source.contrib_employer_pension_contribution, 2))::numeric(12,2) AS contrib_employer_pension_contribution,
            (round(source.contrib_employer_medical_contribution, 2))::numeric(12,2) AS contrib_employer_medical_contribution,
            (round(source.contrib_employer_annuity_contribution, 2))::numeric(12,2) AS contrib_employer_annuity_contribution,
            (round(source.contrib_employer_housing_fund_contribution, 2))::numeric(12,2) AS contrib_employer_housing_fund_contribution,
            (round(source.contrib_employer_unemployment_contribution, 2))::numeric(12,2) AS contrib_employer_unemployment_contribution,
            (round(source.contrib_employer_critical_illness_contribution, 2))::numeric(12,2) AS contrib_employer_critical_illness_contribution,
            (source.other_remarks)::text AS other_remarks,
            source._airbyte_raw_id,
            source._airbyte_extracted_at,
            source._airbyte_meta
           FROM source
        )
 SELECT id_card_number,
    employee_name,
    employee_unique_id,
    establishment_type_name,
    pay_period_identifier,
    job_attr_personnel_identity,
    job_attr_personnel_rank,
    job_attr_post_category,
    job_attr_ref_official_post_salary_level,
    job_attr_ref_official_salary_step,
    job_attr_salary_level,
    job_attr_salary_grade,
    job_attr_annual_fixed_salary_amount,
    salary_one_time_deduction,
    salary_basic_performance_bonus_deduction,
    salary_position_or_technical_salary,
    salary_rank_or_post_grade_salary,
    salary_reform_1993_reserved_subsidy,
    salary_only_child_parents_reward,
    salary_post_position_allowance,
    salary_civil_servant_normative_allowance,
    salary_transportation_allowance,
    salary_basic_performance_bonus,
    salary_probation_salary,
    salary_petition_worker_post_allowance,
    salary_reward_performance_deduction,
    salary_post_salary,
    salary_salary_step,
    salary_monthly_basic_performance,
    salary_monthly_reward_performance,
    salary_basic_salary,
    salary_performance_salary,
    salary_other_allowance,
    salary_salary_backpay,
    salary_allowance,
    salary_quarterly_performance_bonus,
    salary_subsidy,
    salary_petition_post_allowance,
    salary_total_deduction_adjustment,
    salary_living_allowance,
    salary_salary_step_backpay_total,
    salary_total_backpay_amount,
    deduct_self_pension_contribution,
    deduct_self_medical_contribution,
    deduct_self_annuity_contribution,
    deduct_self_housing_fund_contribution,
    deduct_self_unemployment_contribution,
    deduct_individual_income_tax,
    deduct_other_deductions,
    deduct_social_insurance_adjustment,
    deduct_housing_fund_adjustment,
    deduct_tax_adjustment,
    contrib_employer_pension_contribution,
    contrib_employer_medical_contribution,
    contrib_employer_annuity_contribution,
    contrib_employer_housing_fund_contribution,
    contrib_employer_unemployment_contribution,
    contrib_employer_critical_illness_contribution,
    other_remarks,
    _airbyte_raw_id,
    _airbyte_extracted_at,
    _airbyte_meta
   FROM renamed_recasted;


ALTER VIEW public.stg_raw_salary_data OWNER TO postgres;

--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: stg_units; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.stg_units AS
 WITH source AS (
         SELECT units.id,
            units.name,
            units.description,
            units.created_at,
            units.updated_at
           FROM public.units
        ), renamed AS (
         SELECT source.id AS unit_id,
            source.name AS unit_name
           FROM source
        )
 SELECT (unit_id)::bigint AS unit_id,
    unit_name
   FROM renamed;


ALTER VIEW public.stg_units OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_id_seq OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    role_id integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(255) NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: view_base_data; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_base_data AS
 SELECT sr.employee_id,
    sr.pay_period_identifier,
    sr.establishment_type_id,
    emp.employee_name,
    emp.id_card_number,
    dept.department_name,
    u.unit_name,
    et.establishment_type_name,
    (sr.job_attributes ->> 'personnel_identity'::text) AS job_attr_personnel_identity,
    (sr.job_attributes ->> 'personnel_rank'::text) AS job_attr_personnel_rank,
    (sr.job_attributes ->> 'post_category'::text) AS job_attr_post_category,
    (sr.job_attributes ->> 'ref_official_post_salary_level'::text) AS job_attr_ref_official_post_salary_level,
    (sr.job_attributes ->> 'ref_official_salary_step'::text) AS job_attr_ref_official_salary_step,
    (sr.job_attributes ->> 'salary_level'::text) AS job_attr_salary_level,
    (sr.job_attributes ->> 'salary_grade'::text) AS job_attr_salary_grade,
    ((sr.job_attributes ->> 'annual_fixed_salary_amount'::text))::numeric(18,2) AS job_attr_annual_fixed_salary_amount,
    ((sr.salary_components ->> 'one_time_deduction'::text))::numeric(18,2) AS salary_one_time_deduction,
    ((sr.salary_components ->> 'basic_performance_bonus_deduction'::text))::numeric(18,2) AS salary_basic_performance_bonus_deduction,
    ((sr.salary_components ->> 'basic_performance_deduction'::text))::numeric(18,2) AS salary_basic_performance_deduction,
    ((sr.salary_components ->> 'incentive_performance_salary'::text))::numeric(18,2) AS salary_incentive_performance_salary,
    ((sr.salary_components ->> 'position_or_technical_salary'::text))::numeric(18,2) AS salary_position_or_technical_salary,
    ((sr.salary_components ->> 'rank_or_post_grade_salary'::text))::numeric(18,2) AS salary_rank_or_post_grade_salary,
    ((sr.salary_components ->> 'reform_1993_reserved_subsidy'::text))::numeric(18,2) AS salary_reform_1993_reserved_subsidy,
    ((sr.salary_components ->> 'only_child_parents_reward'::text))::numeric(18,2) AS salary_only_child_parents_reward,
    ((sr.salary_components ->> 'post_position_allowance'::text))::numeric(18,2) AS salary_post_position_allowance,
    ((sr.salary_components ->> 'civil_servant_normative_allowance'::text))::numeric(18,2) AS salary_civil_servant_normative_allowance,
    ((sr.salary_components ->> 'transportation_allowance'::text))::numeric(18,2) AS salary_transportation_allowance,
    ((sr.salary_components ->> 'basic_performance_bonus'::text))::numeric(18,2) AS salary_basic_performance_bonus,
    ((sr.salary_components ->> 'probation_salary'::text))::numeric(18,2) AS salary_probation_salary,
    ((sr.salary_components ->> 'petition_worker_post_allowance'::text))::numeric(18,2) AS salary_petition_worker_post_allowance,
    ((sr.salary_components ->> 'reward_performance_deduction'::text))::numeric(18,2) AS salary_reward_performance_deduction,
    ((sr.salary_components ->> 'post_salary'::text))::numeric(18,2) AS salary_post_salary,
    ((sr.salary_components ->> 'salary_step'::text))::numeric(18,2) AS salary_salary_step,
    ((sr.salary_components ->> 'monthly_basic_performance'::text))::numeric(18,2) AS salary_monthly_basic_performance,
    ((sr.salary_components ->> 'monthly_reward_performance'::text))::numeric(18,2) AS salary_monthly_reward_performance,
    ((sr.salary_components ->> 'basic_salary'::text))::numeric(18,2) AS salary_basic_salary,
    ((sr.salary_components ->> 'basic_performance_salary'::text))::numeric(18,2) AS salary_basic_performance_salary,
    ((sr.salary_components ->> 'performance_salary'::text))::numeric(18,2) AS salary_performance_salary,
    ((sr.salary_components ->> 'other_allowance'::text))::numeric(18,2) AS salary_other_allowance,
    ((sr.salary_components ->> 'salary_backpay'::text))::numeric(18,2) AS salary_salary_backpay,
    ((sr.salary_components ->> 'allowance'::text))::numeric(18,2) AS salary_allowance,
    ((sr.salary_components ->> 'quarterly_performance_bonus'::text))::numeric(18,2) AS salary_quarterly_performance_bonus,
    ((sr.salary_components ->> 'subsidy'::text))::numeric(18,2) AS salary_subsidy,
    ((sr.salary_components ->> 'petition_post_allowance'::text))::numeric(18,2) AS salary_petition_post_allowance,
    ((sr.salary_components ->> 'total_deduction_adjustment'::text))::numeric(18,2) AS salary_total_deduction_adjustment,
    ((sr.salary_components ->> 'living_allowance'::text))::numeric(18,2) AS salary_living_allowance,
    ((sr.salary_components ->> 'salary_step_backpay_total'::text))::numeric(18,2) AS salary_salary_step_backpay_total,
    ((sr.salary_components ->> 'total_backpay_amount'::text))::numeric(18,2) AS salary_total_backpay_amount,
    ((sr.personal_deductions ->> 'self_pension_contribution'::text))::numeric(18,2) AS deduct_self_pension_contribution,
    ((sr.personal_deductions ->> 'self_medical_contribution'::text))::numeric(18,2) AS deduct_self_medical_contribution,
    ((sr.personal_deductions ->> 'self_annuity_contribution'::text))::numeric(18,2) AS deduct_self_annuity_contribution,
    ((sr.personal_deductions ->> 'self_housing_fund_contribution'::text))::numeric(18,2) AS deduct_self_housing_fund_contribution,
    ((sr.personal_deductions ->> 'self_unemployment_contribution'::text))::numeric(18,2) AS deduct_self_unemployment_contribution,
    ((sr.personal_deductions ->> 'individual_income_tax'::text))::numeric(18,2) AS deduct_individual_income_tax,
    ((sr.personal_deductions ->> 'other_deductions'::text))::numeric(18,2) AS deduct_other_deductions,
    ((sr.personal_deductions ->> 'social_insurance_adjustment'::text))::numeric(18,2) AS deduct_social_insurance_adjustment,
    ((sr.personal_deductions ->> 'housing_fund_adjustment'::text))::numeric(18,2) AS deduct_housing_fund_adjustment,
    ((sr.personal_deductions ->> 'tax_adjustment'::text))::numeric(18,2) AS deduct_tax_adjustment,
    ((sr.company_contributions ->> 'employer_pension_contribution'::text))::numeric(18,2) AS contrib_employer_pension_contribution,
    ((sr.company_contributions ->> 'employer_medical_contribution'::text))::numeric(18,2) AS contrib_employer_medical_contribution,
    ((sr.company_contributions ->> 'employer_annuity_contribution'::text))::numeric(18,2) AS contrib_employer_annuity_contribution,
    ((sr.company_contributions ->> 'employer_housing_fund_contribution'::text))::numeric(18,2) AS contrib_employer_housing_fund_contribution,
    ((sr.company_contributions ->> 'employer_unemployment_contribution'::text))::numeric(18,2) AS contrib_employer_unemployment_contribution,
    ((sr.company_contributions ->> 'employer_critical_illness_contribution'::text))::numeric(18,2) AS contrib_employer_critical_illness_contribution,
    sr.other_remarks,
    sr.created_at,
    sr.updated_at
   FROM ((((public.salary_records sr
     LEFT JOIN public.stg_employees emp ON ((sr.employee_id = emp.employee_id)))
     LEFT JOIN public.dim_departments dept ON ((emp.department_id = dept.department_id)))
     LEFT JOIN public.dim_units u ON ((dept.unit_id = u.unit_id)))
     LEFT JOIN public.dim_establishment_types et ON ((sr.establishment_type_id = et.establishment_type_id)));


ALTER VIEW public.view_base_data OWNER TO postgres;

--
-- Name: view_level1_calculations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.view_level1_calculations (
    employee_id bigint,
    pay_period_identifier text,
    establishment_type_id bigint,
    employee_name text,
    id_card_number text,
    department_name text,
    unit_name text,
    establishment_type_name text,
    job_attr_personnel_identity text,
    job_attr_personnel_rank text,
    job_attr_post_category text,
    job_attr_ref_official_post_salary_level text,
    job_attr_ref_official_salary_step text,
    job_attr_salary_level text,
    job_attr_salary_grade text,
    job_attr_annual_fixed_salary_amount numeric(18,2),
    salary_one_time_deduction numeric(18,2),
    salary_basic_performance_bonus_deduction numeric(18,2),
    salary_basic_performance_deduction numeric(18,2),
    salary_incentive_performance_salary numeric(18,2),
    salary_position_or_technical_salary numeric(18,2),
    salary_rank_or_post_grade_salary numeric(18,2),
    salary_reform_1993_reserved_subsidy numeric(18,2),
    salary_only_child_parents_reward numeric(18,2),
    salary_post_position_allowance numeric(18,2),
    salary_civil_servant_normative_allowance numeric(18,2),
    salary_transportation_allowance numeric(18,2),
    salary_basic_performance_bonus numeric(18,2),
    salary_probation_salary numeric(18,2),
    salary_petition_worker_post_allowance numeric(18,2),
    salary_reward_performance_deduction numeric(18,2),
    salary_post_salary numeric(18,2),
    salary_salary_step numeric(18,2),
    salary_monthly_basic_performance numeric(18,2),
    salary_monthly_reward_performance numeric(18,2),
    salary_basic_salary numeric(18,2),
    salary_basic_performance_salary numeric(18,2),
    salary_performance_salary numeric(18,2),
    salary_other_allowance numeric(18,2),
    salary_salary_backpay numeric(18,2),
    salary_allowance numeric(18,2),
    salary_quarterly_performance_bonus numeric(18,2),
    salary_subsidy numeric(18,2),
    salary_petition_post_allowance numeric(18,2),
    salary_total_deduction_adjustment numeric(18,2),
    salary_living_allowance numeric(18,2),
    salary_salary_step_backpay_total numeric(18,2),
    salary_total_backpay_amount numeric(18,2),
    deduct_self_pension_contribution numeric(18,2),
    deduct_self_medical_contribution numeric(18,2),
    deduct_self_annuity_contribution numeric(18,2),
    deduct_self_housing_fund_contribution numeric(18,2),
    deduct_self_unemployment_contribution numeric(18,2),
    deduct_individual_income_tax numeric(18,2),
    deduct_other_deductions numeric(18,2),
    deduct_social_insurance_adjustment numeric(18,2),
    deduct_housing_fund_adjustment numeric(18,2),
    deduct_tax_adjustment numeric(18,2),
    contrib_employer_pension_contribution numeric(18,2),
    contrib_employer_medical_contribution numeric(18,2),
    contrib_employer_annuity_contribution numeric(18,2),
    contrib_employer_housing_fund_contribution numeric(18,2),
    contrib_employer_unemployment_contribution numeric(18,2),
    contrib_employer_critical_illness_contribution numeric(18,2),
    other_remarks text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    calc_xiaoji numeric,
    calc_personal_deductions numeric,
    calc_total_payable numeric,
    calc_net_pay numeric
);


ALTER TABLE public.view_level1_calculations OWNER TO postgres;

--
-- Name: vw_salary_gwy; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_salary_gwy AS
 SELECT employee_name AS "姓名",
    id_card_number AS "身份证号",
    calc_total_payable AS "应发工资合计",
    calc_net_pay AS "实发工资",
    deduct_other_deductions AS "其他扣款",
    calc_personal_deductions AS "扣发合计",
    salary_position_or_technical_salary AS "职务工资",
    salary_only_child_parents_reward AS "独生子女父母奖励金",
    salary_transportation_allowance AS "公务交通补贴",
    salary_incentive_performance_salary AS "奖励性绩效工资",
    salary_basic_performance_bonus AS "基础绩效奖",
    salary_basic_performance_salary AS "基础性绩效工资",
    salary_salary_backpay AS "补发工资",
    salary_post_position_allowance AS "岗位职务补贴",
    salary_post_salary AS "岗位工资",
    salary_petition_worker_post_allowance AS "信访工作人员岗位津贴",
    salary_rank_or_post_grade_salary AS "级别工资",
    salary_reform_1993_reserved_subsidy AS "九三年工改保留津补贴",
    salary_civil_servant_normative_allowance AS "公务员规范性津贴补贴",
    salary_probation_salary AS "见习试用期工资",
    salary_salary_step AS "薪级工资",
    deduct_self_pension_contribution AS "个人缴养老保险费",
    deduct_self_medical_contribution AS "个人缴医疗保险费",
    deduct_self_annuity_contribution AS "个人缴职业年金",
    deduct_self_housing_fund_contribution AS "个人缴住房公积金",
    deduct_individual_income_tax AS "个人所得税",
    employee_id AS "员工ID",
    pay_period_identifier AS "工资期间",
    establishment_type_id AS "编制ID",
    department_name AS "部门",
    unit_name AS "单位",
    establishment_type_name AS "编制类型",
    job_attr_personnel_identity AS "人员身份",
    job_attr_personnel_rank AS "人员职级",
    job_attr_post_category AS "岗位类别",
    job_attr_ref_official_post_salary_level AS "参照正编岗位工资级别",
    job_attr_ref_official_salary_step AS "参照正编薪级工资级次",
    job_attr_salary_level AS "工资级别",
    job_attr_salary_grade AS "工资档次",
    job_attr_annual_fixed_salary_amount AS "固定薪酬全年应发数",
    salary_one_time_deduction AS "一次性补扣发",
    salary_basic_performance_bonus_deduction AS "基础绩效奖补扣发",
    salary_basic_performance_deduction AS "基础绩效补扣发",
    salary_reward_performance_deduction AS "奖励绩效补扣发",
    salary_monthly_basic_performance AS "月基础绩效",
    salary_monthly_reward_performance AS "月奖励绩效",
    salary_basic_salary AS "基本工资",
    salary_performance_salary AS "绩效工资",
    salary_other_allowance AS "其他补助",
    salary_allowance AS "津贴",
    salary_quarterly_performance_bonus AS "季度绩效考核薪酬",
    salary_subsidy AS "补助",
    salary_petition_post_allowance AS "信访岗位津贴",
    salary_total_deduction_adjustment AS "补扣发合计",
    salary_living_allowance AS "生活津贴",
    salary_salary_step_backpay_total AS "补发薪级合计",
    salary_total_backpay_amount AS "补发合计",
    deduct_self_unemployment_contribution AS "个人缴失业保险费",
    deduct_social_insurance_adjustment AS "补扣退社保缴费",
    deduct_housing_fund_adjustment AS "补扣退公积金",
    deduct_tax_adjustment AS "补扣个税",
    contrib_employer_pension_contribution AS "单位缴养老保险费",
    contrib_employer_medical_contribution AS "单位缴医疗保险费",
    contrib_employer_annuity_contribution AS "单位缴职业年金",
    contrib_employer_housing_fund_contribution AS "单位缴住房公积金",
    contrib_employer_unemployment_contribution AS "单位缴失业保险费",
    contrib_employer_critical_illness_contribution AS "大病医疗单位缴纳",
    other_remarks AS "备注",
    created_at AS "创建时间",
    updated_at AS "更新时间",
    calc_xiaoji AS "小计"
   FROM public.view_level1_calculations
  WHERE (establishment_type_name = '公务员'::text);


ALTER VIEW public.vw_salary_gwy OWNER TO postgres;

--
-- Name: vw_salary_sy; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_salary_sy AS
 SELECT employee_name AS "姓名",
    id_card_number AS "身份证号",
    calc_total_payable AS "应发工资合计",
    calc_net_pay AS "实发工资",
    deduct_other_deductions AS "其他扣款",
    calc_personal_deductions AS "扣发合计",
    salary_position_or_technical_salary AS "职务技术等级工资",
    salary_only_child_parents_reward AS "独生子女父母奖励金",
    salary_transportation_allowance AS "公务交通补贴",
    salary_incentive_performance_salary AS "奖励性绩效工资",
    salary_basic_performance_bonus AS "基础绩效奖",
    salary_basic_performance_salary AS "基础性绩效工资",
    salary_salary_backpay AS "补发工资",
    salary_post_position_allowance AS "岗位职务补贴",
    salary_post_salary AS "事业单位工作人员岗位工资",
    salary_petition_worker_post_allowance AS "信访工作人员岗位津贴",
    salary_rank_or_post_grade_salary AS "级别岗位级别工资",
    salary_reform_1993_reserved_subsidy AS "九三年工改保留津补贴",
    salary_probation_salary AS "见习试用期工资",
    salary_salary_step AS "薪级工资",
    deduct_self_pension_contribution AS "个人缴养老保险费",
    deduct_self_medical_contribution AS "个人缴医疗保险费",
    deduct_self_annuity_contribution AS "个人缴职业年金",
    deduct_self_housing_fund_contribution AS "个人缴住房公积金",
    deduct_individual_income_tax AS "个人所得税",
    employee_id AS "员工ID",
    pay_period_identifier AS "工资期间",
    establishment_type_id AS "编制ID",
    department_name AS "部门",
    unit_name AS "单位",
    establishment_type_name AS "编制类型",
    job_attr_personnel_identity AS "人员身份",
    job_attr_personnel_rank AS "人员职级",
    job_attr_post_category AS "岗位类别",
    job_attr_ref_official_post_salary_level AS "参照正编岗位工资级别",
    job_attr_ref_official_salary_step AS "参照正编薪级工资级次",
    job_attr_salary_level AS "工资级别",
    job_attr_salary_grade AS "工资档次",
    job_attr_annual_fixed_salary_amount AS "固定薪酬全年应发数",
    salary_one_time_deduction AS "一次性补扣发",
    salary_basic_performance_bonus_deduction AS "基础绩效奖补扣发",
    salary_basic_performance_deduction AS "基础绩效补扣发",
    salary_reward_performance_deduction AS "奖励绩效补扣发",
    salary_monthly_basic_performance AS "月基础绩效",
    salary_monthly_reward_performance AS "月奖励绩效",
    salary_basic_salary AS "基本工资",
    salary_performance_salary AS "绩效工资",
    salary_other_allowance AS "其他补助",
    salary_allowance AS "津贴",
    salary_quarterly_performance_bonus AS "季度绩效考核薪酬",
    salary_subsidy AS "补助",
    salary_petition_post_allowance AS "信访岗位津贴",
    salary_total_deduction_adjustment AS "补扣发合计",
    salary_living_allowance AS "生活津贴",
    salary_salary_step_backpay_total AS "补发薪级合计",
    salary_total_backpay_amount AS "补发合计",
    deduct_self_unemployment_contribution AS "个人缴失业保险费",
    deduct_social_insurance_adjustment AS "补扣退社保缴费",
    deduct_housing_fund_adjustment AS "补扣退公积金",
    deduct_tax_adjustment AS "补扣个税",
    contrib_employer_pension_contribution AS "单位缴养老保险费",
    contrib_employer_medical_contribution AS "单位缴医疗保险费",
    contrib_employer_annuity_contribution AS "单位缴职业年金",
    contrib_employer_housing_fund_contribution AS "单位缴住房公积金",
    contrib_employer_unemployment_contribution AS "单位缴失业保险费",
    contrib_employer_critical_illness_contribution AS "大病医疗单位缴纳",
    other_remarks AS "备注",
    created_at AS "创建时间",
    updated_at AS "更新时间",
    calc_xiaoji AS "小计"
   FROM public.view_level1_calculations
  WHERE (establishment_type_name = '事业'::text);


ALTER VIEW public.vw_salary_sy OWNER TO postgres;

--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: establishment_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.establishment_types ALTER COLUMN id SET DEFAULT nextval('public.establishment_types_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: public_raw__stream_raw_salary_data_staging public_raw__stream_raw_salary_data_staging_airbyte_tmp_pkey; Type: CONSTRAINT; Schema: airbyte_internal; Owner: postgres
--

ALTER TABLE ONLY airbyte_internal.public_raw__stream_raw_salary_data_staging
    ADD CONSTRAINT public_raw__stream_raw_salary_data_staging_airbyte_tmp_pkey PRIMARY KEY (_airbyte_raw_id);


--
-- Name: public_raw__stream_salary_record_202404 public_raw__stream_salary_record_202404_airbyte_tmp_pkey; Type: CONSTRAINT; Schema: airbyte_internal; Owner: postgres
--

ALTER TABLE ONLY airbyte_internal.public_raw__stream_salary_record_202404
    ADD CONSTRAINT public_raw__stream_salary_record_202404_airbyte_tmp_pkey PRIMARY KEY (_airbyte_raw_id);


--
-- Name: raw_salary_data_staging_raw__stream_salary_record_202404 raw_salary_data_staging_raw__stream_salary_record_202404_a_pkey; Type: CONSTRAINT; Schema: airbyte_internal; Owner: postgres
--

ALTER TABLE ONLY airbyte_internal.raw_salary_data_staging_raw__stream_salary_record_202404
    ADD CONSTRAINT raw_salary_data_staging_raw__stream_salary_record_202404_a_pkey PRIMARY KEY (_airbyte_raw_id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: establishment_types establishment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.establishment_types
    ADD CONSTRAINT establishment_types_pkey PRIMARY KEY (id);


--
-- Name: field_mappings field_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_mappings
    ADD CONSTRAINT field_mappings_pkey PRIMARY KEY (field_code);


--
-- Name: salary_field_mappings pk_salary_field_mappings; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_field_mappings
    ADD CONSTRAINT pk_salary_field_mappings PRIMARY KEY (source_name);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: departments uq_department_unit_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT uq_department_unit_name UNIQUE (unit_id, name);


--
-- Name: users uq_users_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: public_raw__stream_raw_salary_data_staging_airbyte_tmp_extracte; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_raw_salary_data_staging_airbyte_tmp_extracte ON airbyte_internal.public_raw__stream_raw_salary_data_staging USING btree (_airbyte_extracted_at);


--
-- Name: public_raw__stream_raw_salary_data_staging_airbyte_tmp_loaded_a; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_raw_salary_data_staging_airbyte_tmp_loaded_a ON airbyte_internal.public_raw__stream_raw_salary_data_staging USING btree (_airbyte_loaded_at, _airbyte_extracted_at);


--
-- Name: public_raw__stream_raw_salary_data_staging_airbyte_tmp_raw_id; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_raw_salary_data_staging_airbyte_tmp_raw_id ON airbyte_internal.public_raw__stream_raw_salary_data_staging USING btree (_airbyte_raw_id);


--
-- Name: public_raw__stream_raw_salary_data_staging_extracted_at; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_raw_salary_data_staging_extracted_at ON airbyte_internal.public_raw__stream_raw_salary_data_staging USING btree (_airbyte_extracted_at);


--
-- Name: public_raw__stream_raw_salary_data_staging_loaded_at; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_raw_salary_data_staging_loaded_at ON airbyte_internal.public_raw__stream_raw_salary_data_staging USING btree (_airbyte_loaded_at, _airbyte_extracted_at);


--
-- Name: public_raw__stream_raw_salary_data_staging_raw_id; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_raw_salary_data_staging_raw_id ON airbyte_internal.public_raw__stream_raw_salary_data_staging USING btree (_airbyte_raw_id);


--
-- Name: public_raw__stream_salary_record_202404_airbyte_tmp_extracted_a; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_salary_record_202404_airbyte_tmp_extracted_a ON airbyte_internal.public_raw__stream_salary_record_202404 USING btree (_airbyte_extracted_at);


--
-- Name: public_raw__stream_salary_record_202404_airbyte_tmp_loaded_at; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_salary_record_202404_airbyte_tmp_loaded_at ON airbyte_internal.public_raw__stream_salary_record_202404 USING btree (_airbyte_loaded_at, _airbyte_extracted_at);


--
-- Name: public_raw__stream_salary_record_202404_airbyte_tmp_raw_id; Type: INDEX; Schema: airbyte_internal; Owner: postgres
--

CREATE INDEX public_raw__stream_salary_record_202404_airbyte_tmp_raw_id ON airbyte_internal.public_raw__stream_salary_record_202404 USING btree (_airbyte_raw_id);


--
-- Name: ix_departments_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_departments_unit_id ON public.departments USING btree (unit_id);


--
-- Name: ix_employees_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employees_department_id ON public.employees USING btree (department_id);


--
-- Name: ix_employees_employee_unique_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_employees_employee_unique_id ON public.employees USING btree (employee_unique_id);


--
-- Name: ix_employees_employment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employees_employment_status ON public.employees USING btree (employment_status);


--
-- Name: ix_employees_id_card_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_employees_id_card_number ON public.employees USING btree (id_card_number);


--
-- Name: ix_employees_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employees_unit_id ON public.employees USING btree (unit_id);


--
-- Name: ix_establishment_types_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_establishment_types_name ON public.establishment_types USING btree (name);


--
-- Name: ix_field_mappings_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_field_mappings_category ON public.field_mappings USING btree (category);


--
-- Name: ix_units_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_units_name ON public.units USING btree (name);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_role_id ON public.users USING btree (role_id);


--
-- Name: raw_salary_data_staging_ab_soft_reset__airbyte_extracted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX raw_salary_data_staging_ab_soft_reset__airbyte_extracted_at_idx ON public.raw_salary_data_staging_ab_soft_reset USING btree (_airbyte_extracted_at);


--
-- Name: raw_salary_data_staging_ab_soft_reset__airbyte_raw_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX raw_salary_data_staging_ab_soft_reset__airbyte_raw_id_idx ON public.raw_salary_data_staging_ab_soft_reset USING btree (_airbyte_raw_id);


--
-- Name: raw_salary_data_staging_airbyte_tmp__airbyte_extracted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX raw_salary_data_staging_airbyte_tmp__airbyte_extracted_at_idx ON public.raw_salary_data_staging USING btree (_airbyte_extracted_at);


--
-- Name: raw_salary_data_staging_airbyte_tmp__airbyte_raw_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX raw_salary_data_staging_airbyte_tmp__airbyte_raw_id_idx ON public.raw_salary_data_staging USING btree (_airbyte_raw_id);


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: departments departments_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees fk_employees_establishment_type_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT fk_employees_establishment_type_id FOREIGN KEY (establishment_type_id) REFERENCES public.establishment_types(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

