WITH source AS (

    SELECT * FROM {{ source('public', 'departments') }}

),

renamed AS (

    SELECT
        -- Assuming source columns are id, name, unit_id
        "id" AS department_id,
        "name" AS department_name,
        "unit_id" AS unit_id
        -- Add other relevant department fields if needed

    FROM source

)

SELECT
    CAST(department_id AS BIGINT) AS department_id, -- Assuming id is BIGINT
    CAST(department_name AS TEXT) AS department_name,
    CAST(unit_id AS BIGINT) AS unit_id -- Assuming unit_id is BIGINT

FROM renamed 