-- SQL Script to create independent staging tables for salary data import
-- These tables are NOT managed by Alembic.

-- Common function to drop table if it exists (optional, for idempotency)
-- CREATE OR REPLACE FUNCTION drop_table_if_exists(schema_name TEXT, table_name TEXT)
-- RETURNS void AS $$
-- BEGIN
--     EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(schema_name) || '.' || quote_ident(table_name) || ' CASCADE;';
-- END;
-- $$ LANGUAGE plpgsql;

-- SELECT drop_table_if_exists('public', 'stg_payable_gwy');
-- SELECT drop_table_if_exists('public', 'stg_payable_cgz');
-- ... add for all tables ...

-- --- Staging Table for 公务员应发 ---
CREATE TABLE stg_payable_gwy (
    _staging_id SERIAL PRIMARY KEY,
    pay_period_identifier VARCHAR(7) NOT NULL,
    id_card_number VARCHAR(18) NOT NULL,
    employee_name TEXT,
    bank_account_number TEXT,
    bank_branch_name TEXT,
    employment_start_date DATE,
    employment_status TEXT,
    remarks TEXT,
    organization_name TEXT,
    department_name TEXT,
    _import_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    _source_filename TEXT,

    -- 公务员 Specific Columns
    personnel_identity TEXT,
    personnel_rank TEXT,
    one_time_deduction NUMERIC(12, 2),
    position_or_technical_salary NUMERIC(12, 2),
    rank_or_post_grade_salary NUMERIC(12, 2),
    reform_1993_reserved_subsidy NUMERIC(12, 2),
    only_child_parents_reward NUMERIC(12, 2),
    post_position_allowance NUMERIC(12, 2),
    civil_servant_normative_allowance NUMERIC(12, 2),
    transportation_allowance NUMERIC(12, 2),
    basic_performance_bonus NUMERIC(12, 2),
    self_pension_contribution NUMERIC(12, 2),
    self_medical_contribution NUMERIC(12, 2),
    self_annuity_contribution NUMERIC(12, 2),
    self_housing_fund_contribution NUMERIC(12, 2),
    individual_income_tax NUMERIC(12, 2),
    other_deductions NUMERIC(12, 2),
    self_unemployment_contribution NUMERIC(12, 2),
    self_injury_contribution NUMERIC(12, 2),
    employer_pension_contribution NUMERIC(12, 2),
    employer_medical_contribution NUMERIC(12, 2),
    employer_annuity_contribution NUMERIC(12, 2),
    employer_housing_fund_contribution NUMERIC(12, 2),
    employer_unemployment_contribution NUMERIC(12, 2),
    employer_injury_contribution NUMERIC(12, 2)
);
CREATE INDEX idx_stg_payable_gwy_pay_period ON stg_payable_gwy (pay_period_identifier);
CREATE INDEX idx_stg_payable_gwy_id_card ON stg_payable_gwy (id_card_number);

-- --- Staging Table for 参公应发 ---
CREATE TABLE stg_payable_cgz (
    _staging_id SERIAL PRIMARY KEY,
    pay_period_identifier VARCHAR(7) NOT NULL,
    id_card_number VARCHAR(18) NOT NULL,
    employee_name TEXT,
    bank_account_number TEXT,
    bank_branch_name TEXT,
    employment_start_date DATE,
    employment_status TEXT,
    remarks TEXT,
    organization_name TEXT,
    department_name TEXT,
    _import_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    _source_filename TEXT,

    -- 参公 Specific Columns
    personnel_identity TEXT,
    personnel_rank TEXT,
    one_time_deduction NUMERIC(12, 2),
    basic_performance_bonus_deduction NUMERIC(12, 2),
    position_or_technical_salary NUMERIC(12, 2),
    rank_or_post_grade_salary NUMERIC(12, 2),
    probation_salary NUMERIC(12, 2),
    reform_1993_reserved_subsidy NUMERIC(12, 2),
    only_child_parents_reward NUMERIC(12, 2),
    petition_worker_post_allowance NUMERIC(12, 2),
    civil_servant_normative_allowance NUMERIC(12, 2),
    transportation_allowance NUMERIC(12, 2),
    basic_performance_bonus NUMERIC(12, 2),
    self_pension_contribution NUMERIC(12, 2),
    self_medical_contribution NUMERIC(12, 2),
    self_annuity_contribution NUMERIC(12, 2),
    self_housing_fund_contribution NUMERIC(12, 2),
    individual_income_tax NUMERIC(12, 2),
    other_deductions NUMERIC(12, 2),
    self_unemployment_contribution NUMERIC(12, 2),
    self_injury_contribution NUMERIC(12, 2),
    employer_pension_contribution NUMERIC(12, 2),
    employer_medical_contribution NUMERIC(12, 2),
    employer_annuity_contribution NUMERIC(12, 2),
    employer_housing_fund_contribution NUMERIC(12, 2),
    employer_unemployment_contribution NUMERIC(12, 2),
    employer_injury_contribution NUMERIC(12, 2)
);
CREATE INDEX idx_stg_payable_cgz_pay_period ON stg_payable_cgz (pay_period_identifier);
CREATE INDEX idx_stg_payable_cgz_id_card ON stg_payable_cgz (id_card_number);

-- --- Staging Table for 事业应发 ---
CREATE TABLE stg_payable_sy (
    _staging_id SERIAL PRIMARY KEY,
    pay_period_identifier VARCHAR(7) NOT NULL,
    id_card_number VARCHAR(18) NOT NULL,
    employee_name TEXT,
    bank_account_number TEXT,
    bank_branch_name TEXT,
    employment_start_date DATE,
    employment_status TEXT,
    remarks TEXT,
    organization_name TEXT,
    department_name TEXT,
    _import_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    _source_filename TEXT,

    -- 事业 Specific Columns
    personnel_identity TEXT,
    personnel_rank TEXT,
    one_time_deduction NUMERIC(12, 2),
    basic_performance_deduction NUMERIC(12, 2),
    reward_performance_deduction NUMERIC(12, 2),
    post_salary NUMERIC(12, 2),
    salary_step NUMERIC(12, 2),
    probation_salary NUMERIC(12, 2),
    reform_1993_reserved_subsidy NUMERIC(12, 2),
    only_child_parents_reward NUMERIC(12, 2),
    monthly_basic_performance NUMERIC(12, 2),
    basic_performance_bonus NUMERIC(12, 2),
    monthly_reward_performance NUMERIC(12, 2),
    -- Assuming 基础性绩效工资 maps to basic_performance_salary based on definition JSON (line 39)
    basic_performance_salary NUMERIC(12, 2),
    -- Assuming 奖励性绩效工资 maps to incentive_performance_salary based on definition JSON (line 54)
    incentive_performance_salary NUMERIC(12, 2),
    self_pension_contribution NUMERIC(12, 2),
    self_medical_contribution NUMERIC(12, 2),
    self_annuity_contribution NUMERIC(12, 2),
    self_housing_fund_contribution NUMERIC(12, 2),
    individual_income_tax NUMERIC(12, 2),
    other_deductions NUMERIC(12, 2),
    self_unemployment_contribution NUMERIC(12, 2),
    self_injury_contribution NUMERIC(12, 2),
    employer_pension_contribution NUMERIC(12, 2),
    employer_medical_contribution NUMERIC(12, 2),
    employer_annuity_contribution NUMERIC(12, 2),
    employer_housing_fund_contribution NUMERIC(12, 2),
    employer_unemployment_contribution NUMERIC(12, 2),
    employer_injury_contribution NUMERIC(12, 2)
);
CREATE INDEX idx_stg_payable_sy_pay_period ON stg_payable_sy (pay_period_identifier);
CREATE INDEX idx_stg_payable_sy_id_card ON stg_payable_sy (id_card_number);

-- --- Staging Table for 专项应发 ---
CREATE TABLE stg_payable_zx (
    _staging_id SERIAL PRIMARY KEY,
    pay_period_identifier VARCHAR(7) NOT NULL,
    id_card_number VARCHAR(18) NOT NULL,
    employee_name TEXT,
    bank_account_number TEXT,
    bank_branch_name TEXT,
    employment_start_date DATE,
    employment_status TEXT,
    remarks TEXT,
    organization_name TEXT,
    department_name TEXT,
    _import_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    _source_filename TEXT,

    -- 专项 Specific Columns
    post_category TEXT,
    ref_official_post_salary_level TEXT,
    ref_official_salary_step TEXT,
    basic_salary NUMERIC(12, 2),
    post_salary NUMERIC(12, 2),
    performance_salary NUMERIC(12, 2),
    other_allowance NUMERIC(12, 2),
    basic_performance_bonus NUMERIC(12, 2),
    total_backpay_amount NUMERIC(12, 2), -- 补发合计
    self_pension_contribution NUMERIC(12, 2),
    self_medical_contribution NUMERIC(12, 2),
    self_unemployment_contribution NUMERIC(12, 2),
    self_housing_fund_contribution NUMERIC(12, 2),
    social_insurance_adjustment NUMERIC(12, 2),
    housing_fund_adjustment NUMERIC(12, 2),
    tax_adjustment NUMERIC(12, 2),
    individual_income_tax NUMERIC(12, 2),
    self_injury_contribution NUMERIC(12, 2), -- Added based on pattern
    employer_pension_contribution NUMERIC(12, 2),
    employer_medical_contribution NUMERIC(12, 2),
    employer_annuity_contribution NUMERIC(12, 2), -- Added based on pattern (maybe null?)
    employer_housing_fund_contribution NUMERIC(12, 2),
    employer_unemployment_contribution NUMERIC(12, 2),
    employer_injury_contribution NUMERIC(12, 2)
);
CREATE INDEX idx_stg_payable_zx_pay_period ON stg_payable_zx (pay_period_identifier);
CREATE INDEX idx_stg_payable_zx_id_card ON stg_payable_zx (id_card_number);

-- --- Staging Table for 专技应发 ---
CREATE TABLE stg_payable_zj (
    _staging_id SERIAL PRIMARY KEY,
    pay_period_identifier VARCHAR(7) NOT NULL,
    id_card_number VARCHAR(18) NOT NULL,
    employee_name TEXT,
    bank_account_number TEXT,
    bank_branch_name TEXT,
    employment_start_date DATE,
    employment_status TEXT,
    remarks TEXT,
    organization_name TEXT,
    department_name TEXT,
    _import_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    _source_filename TEXT,

    -- 专技 Specific Columns
    post_category TEXT,
    salary_level TEXT,
    salary_grade TEXT,
    annual_fixed_salary_amount NUMERIC(12, 2),
    basic_salary NUMERIC(12, 2),
    post_salary NUMERIC(12, 2),
    allowance NUMERIC(12, 2), -- 津贴
    quarterly_performance_bonus NUMERIC(12, 2),
    total_backpay_amount NUMERIC(12, 2), -- 补发合计
    self_pension_contribution NUMERIC(12, 2),
    self_medical_contribution NUMERIC(12, 2),
    self_unemployment_contribution NUMERIC(12, 2),
    self_housing_fund_contribution NUMERIC(12, 2),
    social_insurance_adjustment NUMERIC(12, 2),
    housing_fund_adjustment NUMERIC(12, 2),
    tax_adjustment NUMERIC(12, 2),
    individual_income_tax NUMERIC(12, 2),
    self_injury_contribution NUMERIC(12, 2), -- Added based on pattern
    employer_pension_contribution NUMERIC(12, 2),
    employer_medical_contribution NUMERIC(12, 2),
    employer_annuity_contribution NUMERIC(12, 2), -- Added based on pattern (maybe null?)
    employer_housing_fund_contribution NUMERIC(12, 2),
    employer_unemployment_contribution NUMERIC(12, 2),
    employer_injury_contribution NUMERIC(12, 2)
);
CREATE INDEX idx_stg_payable_zj_pay_period ON stg_payable_zj (pay_period_identifier);
CREATE INDEX idx_stg_payable_zj_id_card ON stg_payable_zj (id_card_number);

-- --- Staging Table for 区聘应发 ---
CREATE TABLE stg_payable_qp (
    _staging_id SERIAL PRIMARY KEY,
    pay_period_identifier VARCHAR(7) NOT NULL,
    id_card_number VARCHAR(18) NOT NULL,
    employee_name TEXT,
    bank_account_number TEXT,
    bank_branch_name TEXT,
    employment_start_date DATE,
    employment_status TEXT,
    remarks TEXT,
    organization_name TEXT,
    department_name TEXT,
    _import_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    _source_filename TEXT,

    -- 区聘 Specific Columns
    post_category TEXT,
    salary_level TEXT,
    salary_grade TEXT,
    basic_salary NUMERIC(12, 2),
    post_salary NUMERIC(12, 2),
    performance_salary NUMERIC(12, 2),
    subsidy NUMERIC(12, 2), -- 补助
    petition_post_allowance NUMERIC(12, 2), -- 信访岗位津贴
    basic_performance_bonus NUMERIC(12, 2),
    total_backpay_amount NUMERIC(12, 2), -- 补发合计
    self_pension_contribution NUMERIC(12, 2),
    self_medical_contribution NUMERIC(12, 2),
    self_unemployment_contribution NUMERIC(12, 2),
    self_housing_fund_contribution NUMERIC(12, 2),
    social_insurance_adjustment NUMERIC(12, 2),
    housing_fund_adjustment NUMERIC(12, 2),
    tax_adjustment NUMERIC(12, 2),
    individual_income_tax NUMERIC(12, 2),
    self_injury_contribution NUMERIC(12, 2), -- Added based on pattern
    employer_pension_contribution NUMERIC(12, 2),
    employer_medical_contribution NUMERIC(12, 2),
    employer_annuity_contribution NUMERIC(12, 2), -- Added based on pattern (maybe null?)
    employer_housing_fund_contribution NUMERIC(12, 2),
    employer_unemployment_contribution NUMERIC(12, 2),
    employer_injury_contribution NUMERIC(12, 2)
);
CREATE INDEX idx_stg_payable_qp_pay_period ON stg_payable_qp (pay_period_identifier);
CREATE INDEX idx_stg_payable_qp_id_card ON stg_payable_qp (id_card_number);

-- --- Staging Table for 原投服应发 ---
CREATE TABLE stg_payable_ytf (
    _staging_id SERIAL PRIMARY KEY,
    pay_period_identifier VARCHAR(7) NOT NULL,
    id_card_number VARCHAR(18) NOT NULL,
    employee_name TEXT,
    bank_account_number TEXT,
    bank_branch_name TEXT,
    employment_start_date DATE,
    employment_status TEXT,
    remarks TEXT,
    organization_name TEXT,
    department_name TEXT,
    _import_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    _source_filename TEXT,

    -- 原投服 Specific Columns
    post_category TEXT,
    salary_level TEXT,
    salary_grade TEXT,
    post_salary NUMERIC(12, 2),
    salary_step NUMERIC(12, 2),
    performance_salary NUMERIC(12, 2),
    living_allowance NUMERIC(12, 2), -- 生活津贴
    basic_performance_bonus NUMERIC(12, 2),
    quarterly_performance_bonus NUMERIC(12, 2), -- 季度考核绩效奖
    total_backpay_amount NUMERIC(12, 2), -- 补发合计
    self_pension_contribution NUMERIC(12, 2),
    self_medical_contribution NUMERIC(12, 2),
    self_unemployment_contribution NUMERIC(12, 2),
    self_housing_fund_contribution NUMERIC(12, 2),
    social_insurance_adjustment NUMERIC(12, 2),
    housing_fund_adjustment NUMERIC(12, 2),
    tax_adjustment NUMERIC(12, 2),
    individual_income_tax NUMERIC(12, 2),
    self_injury_contribution NUMERIC(12, 2), -- Added based on pattern
    employer_pension_contribution NUMERIC(12, 2),
    employer_medical_contribution NUMERIC(12, 2),
    employer_annuity_contribution NUMERIC(12, 2), -- Added based on pattern (maybe null?)
    employer_housing_fund_contribution NUMERIC(12, 2),
    employer_unemployment_contribution NUMERIC(12, 2),
    employer_injury_contribution NUMERIC(12, 2)
);
CREATE INDEX idx_stg_payable_ytf_pay_period ON stg_payable_ytf (pay_period_identifier);
CREATE INDEX idx_stg_payable_ytf_id_card ON stg_payable_ytf (id_card_number);

-- Note: Data types (especially NUMERIC precision/scale) and NULL constraints might need further refinement based on actual data.
-- Note: Some '单位扣缴' fields were missing in certain categories in the JSON, I've added them based on the pattern (e.g., employer_annuity_contribution, employer_injury_contribution) assuming they might exist or should be accounted for, potentially allowing NULLs if appropriate. Please verify.
-- Note: The mapping for "基础性绩效工资" and "奖励性绩效工资" in "事业" category was inferred from the definition file. Please verify. 