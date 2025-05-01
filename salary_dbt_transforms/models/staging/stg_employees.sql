WITH source AS (

    SELECT * FROM {{ source('public', 'employees') }}

),

renamed AS (

    SELECT
        -- Correcting the source column name for employee identifier
        "id" AS employee_id, 
        "id_card_number" AS id_card_number,
        "name" AS employee_name,
        "department_id" AS department_id
        -- Add other relevant employee fields if needed

    FROM source

)

SELECT
    CAST(employee_id AS BIGINT) AS employee_id, -- Assuming 'id' is BIGINT
    CAST(id_card_number AS TEXT) AS id_card_number,
    CAST(employee_name AS TEXT) AS employee_name,
    CAST(department_id AS BIGINT) AS department_id -- Or appropriate type

FROM renamed 