# System Patterns

*Document the system architecture, key technical decisions, design patterns in use, and component relationships.*

**Architecture Overview:**
1.  **Data Source:** Excel files.
2.  **Preprocessing:** Python scripts (`preprocess_salary_data_parameterized.py`, `rename_csv_headers.py`) convert Excel to standardized, English-header CSV.
3.  **Load to Staging:** Backend API (`/api/convert/excel-to-csv`) or manual script execution loads the English-header CSV into the `raw_salary_data_staging` table in PostgreSQL.
4.  **Transformation (dbt):** dbt project (`salary_dbt_transforms`) reads from sources, builds staging models, mart tables (`salary_records`, dimensions), and core calculation views (`view_base_data`, `view_level1_calculations`).
5.  **Database (PostgreSQL):** Hosts raw staging data, dbt-generated tables and views.
6.  **BI Layer:** Jimu Reports connects to dbt-generated views for reporting.
7.  **Web Frontend:** A custom web application queries the final views via a backend API and embeds Jimu Reports via iframe. Implements RBAC.

**Key Decisions:**
*   Use of JSONB in `salary_records` for flexibility.
*   Separation of static employee info from periodic salary data.
*   Use of lookup tables for normalization.
*   Use of `field_mappings` table for frontend display consistency.
*   **Unified View Management in dbt:** Core calculation views (`view_base_data`, `view_level1_calculations`, etc.) are managed as dbt models (materialized as views) to leverage dbt features (testing, docs, lineage) and resolve conflicts with schema management tools like Alembic.
*   **Alembic for Schema Only:** Alembic's role is strictly limited to managing the evolution of base table schemas (CREATE TABLE, ALTER COLUMN, etc.), not view definitions.

## 数据处理流程 (Data Processing Pipeline)

This section details the step-by-step process of transforming raw salary data from Excel files into structured data ready for analysis and reporting.

**Step 1: Source Data Preparation (Manual/Excel)**
*   **Input:** Excel files containing salary data for a specific pay period. Each file typically represents data from one unit or department.
*   **Assumptions:** 
    *   Files contain necessary columns like ID card number, employee name, and various salary/deduction components.
    *   Column names are expected to be in Chinese and may vary slightly.
*   **Tools:** Manual preparation following specific templates or guidelines.

**Step 2: Data Preprocessing (Python Script)**
*   **Script:** `salary_system/scripts/preprocess_salary_data_parameterized.py`
*   **Purpose:** Reads a single Excel file containing various salary-related sheets, normalizes column names to internal standardized Chinese keys, handles different sheet structures (salary details vs. deductions/contributions), merges them based on employee name, and adds metadata.
*   **Input Arguments:**
    *   `--excel-file`: Path to the single source Excel file.
    *   `--output-folder`: Folder where the output CSV file will be saved.
    *   `--pay-period`: Pay period identifier (e.g., "YYYY-MM").
*   **Processing Logic Summary:** Reads sheets, maps columns, validates keys, combines data, ensures expected columns.
*   **Output:** A single CSV file (e.g., `salary_record_YYYYMM.csv`) saved in the `--output-folder`, containing combined data with **standardized Chinese internal keys** as headers.

**Step 2.5: Header Renaming (Python Script)**
*   **Script:** `salary_system/scripts/rename_csv_headers.py`
*   **Purpose:** Converts the standardized Chinese internal key headers from the preprocessed CSV into English column names suitable for database loading, based on a JSON mapping file.
*   **Input Arguments:**
    *   `--input-csv`: Path to the CSV file generated in Step 2.
    *   `--output-csv`: Path to save the output CSV file with English headers (e.g., into a 'renamed' subfolder).
    *   `--mapping-json`: Path to the JSON mapping file (defaults to `../config/salary_field_definitions_data.json` relative to the script, but can be explicitly set).
*   **Processing Logic Summary:** Reads input CSV, applies header mapping using the JSON file, handles known prefixes (e.g., `salary_`), logs unmapped columns.
*   **Output:** A new CSV file (e.g., `salary_record_YYYYMM_en.csv`) with **English column headers**, encoded in `utf-8-sig` for better Excel compatibility.

**Step 3: Load to Staging Table (Manual/API)**
*   **Mechanism:** Manual upload via the web application's API (`/api/convert/excel-to-csv`) or potentially direct script execution.
*   **Input:** The **English-header CSV file** generated in Step 2.5.
*   **Processing Logic:** The backend API handles the file upload, reads the CSV, and inserts/updates data into the `public.raw_salary_data_staging` table in the PostgreSQL database.
*   **Output:** The `public.raw_salary_data_staging` table is populated/updated.

**Step 4: Staging and Transformation (dbt)**
*   **Project:** `salary_system/salary_dbt_transforms`
*   **Input:** Source tables (`raw_salary_data_staging`, `employees`, `units`, `departments`, `establishment_types`).
*   **Processing Logic:**
    1.  Builds staging models (`stg_*`) with cleaning, typing, renaming.
    2.  Builds mart tables (`salary_records`, `dim_*`) combining staging data.
    3.  Builds calculation views (`view_base_data`, `view_level1_calculations`) on top of mart tables.
*   **Output:** Database tables and views defined in the dbt project, within the target schema.

**Step 5: Reporting Layer (dbt Views / Jimu)**
*   **Models:** dbt views (`view_level1_calculations`, potentially `view_final_report`)
*   **Input:** Mart tables and other dbt views.
*   **Processing Logic:** Final calculations, joins, and data shaping specifically for reporting and BI needs.
*   **Output:** Database views ready for consumption by Jimu Reports or the web application API.

## Docker Compose Architecture Pattern

The system is designed to be deployed using Docker Compose, facilitating simplified setup and dependency management. This pattern includes:

*   **Service Definitions:** Separate services are defined in `docker-compose.yml` for each core component:
    *   `db`: PostgreSQL database container.
    *   `backend-init`: A one-off service using the backend image to run an initialization script (`init_app.py`) before the main backend starts. It handles database migrations (via Alembic) and initial data seeding (like creating the admin user).
    *   `backend`: The main FastAPI application container.
    *   `frontend`: An Nginx container serving the static build of the React application.
    *   `jimu`: (If applicable) The Jimu Reports container.
    *   `db-backup`: A dedicated container using the PostgreSQL image to periodically run `pg_dump` and store backups.
*   **Networking:** All services communicate over a shared Docker bridge network (`salary-network`), allowing them to resolve each other by service name (e.g., `backend` can connect to `db` at `db:5432`).
*   **Volumes:**
    *   Named volumes (`postgres_data`, `db_backups`) are used for persistent storage of database data and backups, ensuring data survives container restarts.
    *   Bind mounts (e.g., for `nginx.conf`) are used to inject configuration files into containers.
*   **Configuration:** Environment variables defined in a `.env` file (located alongside `docker-compose.yml`) are used to manage sensitive data (passwords, API keys) and configurable parameters (ports, admin credentials). Default values are provided within the `docker-compose.yml` for cases where the `.env` file or specific variables are missing.
*   **Build Context:** Dockerfiles for backend and frontend are located in `docker/backend/` and `docker/frontend/` respectively. The `docker-compose.yml` build context is set to the project root (`..`) to allow Dockerfiles access to necessary source code during the build process (e.g., `COPY webapp/ /app/`).
*   **Initialization Pattern:** The `backend-init` service ensures the database is ready and initialized before the main `backend` service starts, using `depends_on` with `condition: service_completed_successfully`.
*   **Backup Pattern:** The `db-backup` service runs independently, executing a backup script at a defined interval (e.g., using `cron` or a simple `sleep` loop within its command) and storing the backup files in a dedicated volume. 