{{ config(materialized='table') }}

-- Final dimension table for establishment types
SELECT
    establishment_type_id,
    establishment_type_name
    -- Select all columns from the staging model
FROM {{ ref('stg_establishment_types') }} 