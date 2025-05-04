-- Revised SQL script to create configuration tables, utilizing existing salary_field_mappings

-- Table to define employee types (establishment types) using internal keys
-- (Same as before)
CREATE TABLE IF NOT EXISTS employee_types (
    employee_type_key VARCHAR(50) PRIMARY KEY,      -- Internal key (e.g., 'gwy', 'sy')
    employee_type_name VARCHAR(255) UNIQUE NOT NULL, -- Chinese name for the type (e.g., '公务员', '事业')
    description TEXT                                 -- Optional description of the employee type
);

COMMENT ON TABLE employee_types IS 'Defines different employee/establishment types using internal keys.';
COMMENT ON COLUMN employee_types.employee_type_key IS 'Short internal key used for configuration lookup (e.g., gwy, sy).';
COMMENT ON COLUMN employee_types.employee_type_name IS 'User-facing Chinese name for the employee type.';


-- Add UNIQUE constraint to target_name in existing salary_field_mappings table
-- This is crucial for using it as a reference for the foreign key
-- Use ALTER TABLE ... ADD CONSTRAINT ... IF NOT EXISTS if your PostgreSQL version supports it
-- Otherwise, you might need to check if the constraint exists before attempting to add it.
-- Simple version (might fail if constraint already exists):
ALTER TABLE salary_field_mappings 
ADD CONSTRAINT uq_salary_field_mappings_target_name UNIQUE (target_name);
-- Note: If the table already contains duplicate target_names, this command will fail.
-- You would need to clean the data in salary_field_mappings first.

COMMENT ON CONSTRAINT uq_salary_field_mappings_target_name ON salary_field_mappings IS 'Ensures that each database column name (target_name) is mapped only once.';


-- Table linking employee types to salary fields and defining rules (required/optional)
-- Revised to reference salary_field_mappings(target_name)
CREATE TABLE IF NOT EXISTS employee_type_field_rules (
    rule_id SERIAL PRIMARY KEY,                     -- Unique identifier for the rule
    employee_type_key VARCHAR(50) NOT NULL,         -- Foreign key to employee_types
    field_db_name VARCHAR(255) NOT NULL,            -- References the target_name (DB name) in salary_field_mappings
    is_required BOOLEAN NOT NULL DEFAULT FALSE,    -- True if the field is required for this employee type, False if optional

    -- Foreign key constraints
    CONSTRAINT fk_employee_type
        FOREIGN KEY(employee_type_key) 
        REFERENCES employee_types(employee_type_key)
        ON DELETE CASCADE,

    CONSTRAINT fk_salary_field_mapping -- Renamed constraint for clarity
        FOREIGN KEY(field_db_name) 
        REFERENCES salary_field_mappings(target_name) -- Reference target_name now
        ON DELETE CASCADE, 

    -- Ensure a field rule is unique for a given employee type
    CONSTRAINT uq_type_field UNIQUE (employee_type_key, field_db_name)
);

COMMENT ON TABLE employee_type_field_rules IS 'Defines which salary fields apply to which employee types and whether they are required. References salary_field_mappings for field definitions.';
COMMENT ON COLUMN employee_type_field_rules.field_db_name IS 'Database column name, references target_name in salary_field_mappings.';
COMMENT ON COLUMN employee_type_field_rules.is_required IS 'Indicates if the salary field is mandatory for the specified employee type.';
COMMENT ON CONSTRAINT uq_type_field ON employee_type_field_rules IS 'Ensures that each field is listed only once per employee type.'; 