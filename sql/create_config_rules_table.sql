-- Final SQL script to complete configuration table setup

-- Removed ALTER TABLE statement for salary_field_mappings as the constraint already exists.

-- Table linking employee types to salary fields and defining rules (required/optional)
-- References establishment_types(employee_type_key) for type definition
-- References salary_field_mappings(target_name) for field definition
CREATE TABLE IF NOT EXISTS employee_type_field_rules (
    rule_id SERIAL PRIMARY KEY,                     -- Unique identifier for the rule
    employee_type_key VARCHAR(50) NOT NULL,         -- Foreign key to establishment_types
    field_db_name VARCHAR(255) NOT NULL,            -- References the target_name (DB name) in salary_field_mappings
    is_required BOOLEAN NOT NULL DEFAULT FALSE,    -- True if the field is required for this employee type, False if optional

    -- Foreign key constraints
    CONSTRAINT fk_establishment_type_key -- Renamed constraint for clarity
        FOREIGN KEY(employee_type_key) 
        REFERENCES establishment_types(employee_type_key) -- Reference existing table
        ON DELETE CASCADE,

    CONSTRAINT fk_salary_field_mapping -- Renamed constraint for clarity
        FOREIGN KEY(field_db_name) 
        REFERENCES salary_field_mappings(target_name) -- Reference existing table
        ON DELETE CASCADE, 

    -- Ensure a field rule is unique for a given employee type
    CONSTRAINT uq_type_field UNIQUE (employee_type_key, field_db_name)
);

COMMENT ON TABLE employee_type_field_rules IS 'Defines which salary fields apply to which employee types and whether they are required. References establishment_types and salary_field_mappings.';
COMMENT ON COLUMN employee_type_field_rules.employee_type_key IS 'Internal key for the employee type, references establishment_types.';
COMMENT ON COLUMN employee_type_field_rules.field_db_name IS 'Database column name, references target_name in salary_field_mappings.';
COMMENT ON COLUMN employee_type_field_rules.is_required IS 'Indicates if the salary field is mandatory for the specified employee type.';
COMMENT ON CONSTRAINT uq_type_field ON employee_type_field_rules IS 'Ensures that each field is listed only once per employee type.'; 