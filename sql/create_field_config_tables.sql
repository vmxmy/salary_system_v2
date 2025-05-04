-- SQL script to create tables for managing salary field configurations dynamically

-- Table to define all possible salary fields
CREATE TABLE IF NOT EXISTS salary_fields (
    field_db_name VARCHAR(255) PRIMARY KEY,           -- Database column name (e.g., 'position_or_technical_salary')
    field_chinese_name VARCHAR(255) UNIQUE NOT NULL,   -- Chinese name used in Excel header (e.g., '职务/技术等级工资')
    description TEXT,                                -- Optional description of the field
    data_type_hint VARCHAR(100)                      -- Optional hint for expected data type (e.g., 'NUMERIC(15,2)')
);

COMMENT ON TABLE salary_fields IS 'Defines all possible salary fields, their database names, and their Chinese names.';
COMMENT ON COLUMN salary_fields.field_db_name IS 'Database column name used in tables like raw_salary_data_staging.';
COMMENT ON COLUMN salary_fields.field_chinese_name IS 'Chinese name used as header in uploaded Excel files.';
COMMENT ON COLUMN salary_fields.data_type_hint IS 'Hint for the expected data type (e.g., NUMERIC, VARCHAR). Not enforced by DB.';


-- Table to define employee types (establishment types) using internal keys
CREATE TABLE IF NOT EXISTS employee_types (
    employee_type_key VARCHAR(50) PRIMARY KEY,      -- Internal key (e.g., 'gwy', 'sy')
    employee_type_name VARCHAR(255) UNIQUE NOT NULL, -- Chinese name for the type (e.g., '公务员', '事业')
    description TEXT                                 -- Optional description of the employee type
    -- Consider adding a foreign key to link to the original 'establishment_types' table if needed
    -- establishment_type_id INTEGER REFERENCES establishment_types(id)
);

COMMENT ON TABLE employee_types IS 'Defines different employee/establishment types using internal keys.';
COMMENT ON COLUMN employee_types.employee_type_key IS 'Short internal key used for configuration lookup (e.g., gwy, sy).';
COMMENT ON COLUMN employee_types.employee_type_name IS 'User-facing Chinese name for the employee type.';


-- Table linking employee types to salary fields and defining rules (required/optional)
CREATE TABLE IF NOT EXISTS employee_type_field_rules (
    rule_id SERIAL PRIMARY KEY,                     -- Unique identifier for the rule
    employee_type_key VARCHAR(50) NOT NULL,         -- Foreign key to employee_types
    field_db_name VARCHAR(255) NOT NULL,            -- Foreign key to salary_fields
    is_required BOOLEAN NOT NULL DEFAULT FALSE,    -- True if the field is required for this employee type, False if optional

    -- Foreign key constraints
    CONSTRAINT fk_employee_type
        FOREIGN KEY(employee_type_key) 
        REFERENCES employee_types(employee_type_key)
        ON DELETE CASCADE, -- If an employee type is deleted, its rules are deleted

    CONSTRAINT fk_salary_field
        FOREIGN KEY(field_db_name) 
        REFERENCES salary_fields(field_db_name)
        ON DELETE CASCADE, -- If a salary field definition is deleted, its rules are deleted

    -- Ensure a field rule is unique for a given employee type
    CONSTRAINT uq_type_field UNIQUE (employee_type_key, field_db_name)
);

COMMENT ON TABLE employee_type_field_rules IS 'Defines which salary fields apply to which employee types and whether they are required.';
COMMENT ON COLUMN employee_type_field_rules.is_required IS 'Indicates if the salary field is mandatory for the specified employee type.';
COMMENT ON CONSTRAINT uq_type_field ON employee_type_field_rules IS 'Ensures that each field is listed only once per employee type.';

-- Optional: Add indexes for performance on foreign key columns if needed, e.g.:
-- CREATE INDEX IF NOT EXISTS idx_rules_employee_type_key ON employee_type_field_rules(employee_type_key);
-- CREATE INDEX IF NOT EXISTS idx_rules_field_db_name ON employee_type_field_rules(field_db_name); 