{{ config(materialized='table') }}

-- Final dimension table for units
SELECT
    unit_id,
    unit_name
    -- Select all columns from the staging model
FROM {{ ref('stg_units') }} 