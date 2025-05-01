WITH source AS (

    SELECT * FROM {{ source('public', 'establishment_types') }}

),

renamed AS (

    SELECT
        -- Assuming source columns are id, name, employee_type_key
        "id" AS establishment_type_id,
        "name" AS establishment_type_name,
        "employee_type_key" AS employee_type_key -- Added employee_type_key
        -- Add other relevant establishment_type fields if needed

    FROM source

)

SELECT
    CAST(establishment_type_id AS BIGINT) AS establishment_type_id, -- Assuming id is BIGINT
    CAST(establishment_type_name AS TEXT) AS establishment_type_name,
    CAST(employee_type_key AS TEXT) AS employee_type_key -- Added employee_type_key selection and cast

FROM renamed 