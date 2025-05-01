WITH source AS (

    SELECT * FROM {{ source('public', 'units') }}

),

renamed AS (

    SELECT
        -- Assuming source columns are id, name
        "id" AS unit_id,
        "name" AS unit_name
        -- Add other relevant unit fields if needed

    FROM source

)

SELECT
    CAST(unit_id AS BIGINT) AS unit_id, -- Assuming id is BIGINT
    CAST(unit_name AS TEXT) AS unit_name

FROM renamed 