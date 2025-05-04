-- SQL script to create table for mapping sheet names to employee type keys

CREATE TABLE IF NOT EXISTS sheet_name_mappings (
    sheet_name VARCHAR(255) PRIMARY KEY,             -- Sheet name from the Excel file (or expected variations)
    employee_type_key VARCHAR(50) NOT NULL,          -- Corresponding internal employee type key

    -- Foreign key constraint to ensure the key exists in establishment_types
    CONSTRAINT fk_mapping_employee_type_key
        FOREIGN KEY(employee_type_key) 
        REFERENCES establishment_types(employee_type_key)
        ON DELETE CASCADE -- If an employee type is deleted, its sheet mappings are also deleted
);

COMMENT ON TABLE sheet_name_mappings IS 'Maps specific Excel sheet names to the internal employee_type_key used for configuration.';
COMMENT ON COLUMN sheet_name_mappings.sheet_name IS 'The name of the sheet as it appears in the uploaded Excel file.';
COMMENT ON COLUMN sheet_name_mappings.employee_type_key IS 'The internal key representing the employee type (references establishment_types).';

-- Optional: Add index on employee_type_key if frequent lookups by type are needed
-- CREATE INDEX IF NOT EXISTS idx_sheet_map_employee_type_key ON sheet_name_mappings(employee_type_key); 