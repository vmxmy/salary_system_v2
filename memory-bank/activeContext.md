# Active Context

*Detail the current work focus, recent changes, next steps, and active decisions.*

**Current Focus:** Completed recent feature additions (new employee fields, sheet mapping UI), backend refactoring, and Git push. Awaiting next instructions.

**Recent Changes/Activity:**

* Project directory `salary_system` created.
* Core dependencies (alembic, sqlalchemy, psycopg2, pandas, openpyxl) installed in `lightweight-salary-system` conda environment.
* Alembic environment initialized within `salary_system`.
* `alembic.ini` configured with PostgreSQL database connection details from `.env` file.
* Finalized the core database table structure (including `units`, `departments`, `establishment_types`, `employees`, `salary_records` with JSONB, `field_mappings`). Defined SQLAlchemy models in `models.py`.
* Decided on using nested PostgreSQL views for core calculations, supplemented by Metabase for BI and reporting.
* Developed a Python script (`scripts/preprocess_salary_data_parameterized.py`) to preprocess a single Excel salary file into a standardized CSV format (`salary_record_YYYYMM.csv`).
* Script handles mapping various Excel columns (including dynamic handling for "姓名"/"人员姓名") to standardized internal keys (e.g., `salary_*`, `job_attr_*`, `deduct_*`, `contrib_*`).
* Uses '姓名'/'人员姓名' as the join key for merging deduction/contribution sheets. Includes strict duplicate name check within deduction sheets, aborting script if duplicates are found.
* Requires `--excel-file`, `--output-folder`, and `--pay-period` arguments.
* Successfully created the `raw_salary_data_staging` table in PostgreSQL via Alembic migration after resolving issues with model discovery (`env.py` import) and table dependencies.
* Developed a Python script (`scripts/rename_csv_headers.py`) to convert the Chinese headers of the preprocessed CSV into English codes based on `config/salary_field_definitions_data.json`.
  * Handles known prefixes (`job_attr_`, `salary_`, etc.).
  * Retains original names for unmapped columns and logs warnings.
  * Outputs CSV with `utf-8-sig` encoding for better Excel compatibility.
* **dbt Development:**
  * Initialized dbt project within `salary_system/salary_dbt_transforms`.
  * Defined sources (`raw_salary_data_staging`, `employees`, `units`, `departments`, `establishment_types`) in `models/staging/schema.yml`.
  * Created and validated staging models: `stg_raw_salary_data`, `stg_employees`, `stg_units`, `stg_departments`, `stg_establishment_types`.
  * Created and validated mart models:
    * Fact table: `salary_records` (materialized as table, includes JSONB columns).
    * Dimension tables: `dim_units`, `dim_departments`, `dim_establishment_types` (materialized as tables).
  * Resolved dbt errors related to source definitions, column naming, and macro usage (replaced `dbt_utils.current_timestamp` with `dbt.current_timestamp`).
  * Removed `dbt-utils` dependency as core macros are now sufficient.
* **Refactored View Management:**
  * Migrated the definitions of `view_base_data` and `view_level1_calculations` from Alembic migrations to dbt models (`models/marts/views/`).
  * Created a new Alembic migration (`a23d70659b45`) to `DROP` these views, transferring management responsibility to dbt.
  * Resolved the conflict where `dbt run` would cause Alembic-managed views to be deleted due to `DROP ... CASCADE` operations on dbt backup objects.
* Troubleshot and likely resolved issues with NULL `establishment_type_id` in `salary_records` by ensuring consistent naming in source tables (`raw_salary_data_staging`, `establishment_types`) used for joining in `salary_records.sql`.
* Added new establishment types ("专项", "专技", "区聘", "原投服") to `public.establishment_types` table and updated `view_level1_calculations` logic accordingly within the dbt model. Removed previously incorrect types ("员额", "企业", "其他").
* **Web Application Setup:**
  * Initialized FastAPI backend in `salary_system/webapp`.
  * Initialized React frontend (Vite + Ant Design) in `salary_system/frontend/salary-viewer`.
  * Configured CORS middleware for backend-frontend communication.
* **Employee Management Module (Web App):**
  * Implemented backend API endpoints (FastAPI) for CRUD operations on `employees` table (`/api/employees`).
  * Implemented backend API endpoints for fetching related data lists (`/api/departments-list`, `/api/establishment-types-list`).
  * Implemented React frontend component (`EmployeeManager.tsx`) using Ant Design Table and Modal.
  * Integrated functionality for displaying, creating, editing (including establishment type selection), and deleting employees.
  * Added server-side filtering to `GET /api/employees` for name, employee unique ID, department ID, and establishment type ID.
  * Added corresponding filter UI elements (Inputs, Selects) to the frontend with interactive search logic (real-time for selects, Enter for inputs).
* **Troubleshooting & Refinement:**
  * Resolved Alembic migration issues related to view dependencies and inconsistent head revisions (using `alembic stamp`).
  * Fixed issues with missing `_airbyte_meta` column during CSV generation for DB import.
  * Addressed discrepancies between backend Pydantic models and frontend TypeScript interfaces regarding `establishment_type_id` to ensure data flow for editing.
* Committed recent changes related to Employee Management features.
* **Salary Record Viewing Module:**
  * Implemented backend API (`/api/salary_data`) with filtering capabilities.
  * Developed frontend component (`SalaryViewer.tsx` or similar) to display salary records using Ant Design Table, including pagination and filtering linked to the API.
* **Field Mapping Configuration Module:**
  * Ensured backend API endpoints (`/api/config/mappings`) for CRUD operations are functional.
  * Developed frontend component (`MappingManager.tsx` or similar) allowing users to view, create, edit, and delete field mappings.
* **UI/UX Improvements:**
  * Integrated the main application modules (Employee Management, Salary Viewing, Mapping Config) into the sidebar navigation within the main layout (`App.tsx` or similar).
* **Data Import Path:**
  * Completed backend API endpoint (`/api/convert/excel-to-csv`) for converting uploaded Excel files to CSV and importing them into the `raw_salary_data_staging` table. This includes header renaming and triggering `dbt build` in the background.
* **Translation & UI Fixes (Recent):**
  * Resolved i18next translation key mismatches in `UserProfilePage.tsx` and `DepartmentManager.tsx`, ensuring correct display of labels and placeholders.
  * Fixed minor layout issue (overlapping elements) in `DepartmentManager.tsx` by adding `wrap` property to Space component.
* **Authentication Refinement (Recent):**
  * Diagnosed missing email issue in `UserProfilePage`: traced back to missing 'email' claim in JWT token generated by backend.
  * Guided update to backend FastAPI route ('/token' in `main.py`) to include 'email' in the JWT payload.
* **Dockerization:**
  * Created Dockerfiles for backend (`docker/backend/Dockerfile`) and frontend (`docker/frontend/Dockerfile`).
  * Created `docker-compose.yml` in `salary_system/docker/` defining services: `db`, `backend-init`, `backend`, `frontend`, `jimu`, `db-backup`.
  * Configured Docker Compose with:
    * Shared network (`salary-network`).
    * Named volumes for persistence (`postgres_data`, `db_backups`).
    * Build contexts pointing to project root (`..`).
    * Environment variable handling via `.env` file with defaults.
  * Implemented `backend-init` service using the backend image to run an initialization script (`init_app.py`).
  * Created `salary_system/webapp/scripts/init_app.py` template for database checks, migrations (Alembic), and admin user creation. **Note:** This script requires verification and adjustment of internal imports based on actual project structure.
  * Added `db-backup` service for automated database backups using `pg_dump`.
* **Frontend Build Issues Resolved:**
  * Cleaned up unused variables/imports in multiple React components (`App.tsx`, `EmployeeForm.tsx`, etc.) to resolve TypeScript build errors (`TS6133`).
  * Updated frontend Dockerfile base image from `node:16` to `node:18` to resolve `crypto.getRandomValues` error during `vite build`.
* **Image Building & Pushing:**
  * Successfully built frontend image: `registry.cn-hangzhou.aliyuncs.com/salary_system/salary-frontend:latest`.
  * Successfully built backend image: `registry.cn-hangzhou.aliyuncs.com/salary_system/salary-backend:latest`.
  * Pushed both images to Aliyun Container Registry (ACR).
* **Implemented User Management CRUD Functionality:**
  * Created frontend component `UserManager.tsx`.
  * Added table display for users with sorting, filtering (role, status), pagination.
  * Implemented combined Add/Edit modal with Form validation (username, email, role, status, password+confirm for add).
  * Implemented Delete functionality with `Popconfirm`.
  * Added internationalization for the UserManager component.
  * Resolved frontend warnings (AntD static context, autocomplete).
  * Refactored backend User Management routes (`GET /users`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}`) in `user_management.py` to use corresponding SQLAlchemy ORM functions (`get_users_orm`, `create_user_orm`, `update_user_orm`, `delete_user_orm`) instead of old `psycopg2` functions, fixing `AttributeError: 'Session' object has no attribute 'cursor'` errors.
  * Fixed backend schema validation error for `GET /users` response by correcting the `UserListResponse` definition in `schemas.py`.
* Committed and pushed User Management feature changes to Git.
* **Backend Model Refactoring:**
  * Separated SQLAlchemy model definitions (`CalculationFormula`, `CalculationRule`, etc.) into `webapp/models.py`.
  * Kept ORM database operation functions in `webapp/models_db.py`.
  * Updated imports across relevant files (`crud.py`, `core/calculation_engine.py`, `core/salary_writer.py`, routers).
  * Removed `_orm` suffix from function names in `models_db.py` and updated all call sites.
* **API Route Standardization:**
  * Resolved 404 errors by ensuring consistent API route prefixes. Routers now define full paths (e.g., `/api/config`, `/api/v1/admin/calculation-engine`), and `main.py` includes them with appropriate top-level prefixes or `prefix=""`.
* **Sheet Mapping Configuration:**
  * Added backend models (`SheetNameMapping` in `models.py`, Pydantic models in `schemas.py`).
  * Added backend ORM functions for CRUD in `models_db.py`.
  * Added backend API endpoints (`/api/config/sheet-mappings`) in `routers/config_management.py` for CRUD.
  * Fixed API response structure (`GET /api/config/sheet-mappings`) to return `{ data: [...], total: ... }`.
  * Fixed `ResponseValidationError` by adding missing `target_staging_table` field to both SQLAlchemy and Pydantic models.
  * Created frontend component (`SheetMappingManager.tsx`) with table, form, and API integration.
  * Initially added as a separate page, then integrated as a Tab within `MappingConfigurator.tsx`.
* **Employee Field Expansion:**
  * Added new fields (gender, ethnicity, date_of_birth, education_level, work_start_date, service_interruption_years, actual_position, bank_name, bank_account_number) to `core.employees` table.
  * Managed database schema changes using Alembic (`stamp` and `upgrade`), resolving initial migration conflicts.
  * Updated `Employee` SQLAlchemy model in `models.py` to match the final DB schema.
  * Updated `Employee*` Pydantic models in `schemas.py` to include new fields.
  * Updated frontend `EmployeeManager.tsx` table columns.
  * Updated frontend `EmployeeForm.tsx` with new input fields (Select, DatePicker, InputNumber) and validation.
* **Frontend Translation:**
  * Added missing translation keys for Sheet Mapping, Employee Manager, and Employee Form in `en/translation.json` and `zh/translation.json`.
* **Git Update & Push:**
  * Successfully added, committed, and pushed all recent changes to the `origin/main` branch on GitHub.

**Next Steps:**

1. Await user instructions for the next development task or focus area.

# ... potential older next steps if relevant ...