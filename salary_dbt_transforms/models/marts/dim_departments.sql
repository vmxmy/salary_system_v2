{{ config(materialized='table') }}

-- Final dimension table for departments
SELECT
    department_id,
    department_name,
    unit_id
    -- Select all columns from the staging model
FROM {{ ref('stg_departments') }} 