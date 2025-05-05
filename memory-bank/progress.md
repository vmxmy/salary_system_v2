# Progress

*Track what works, what's left to build, current status, and known issues.*

**What Works / Completed:**
*   Project directory (`salary_system`) created.
*   Python environment setup with core dependencies (Alembic, SQLAlchemy, psycopg2, pandas, openpyxl).
*   Alembic initialized and configured to connect to the target PostgreSQL database (connection details in `.env`).
*   Detailed database schema designed and agreed upon (6 core tables: `units`, `departments`, `establishment_types`, `employees`, `salary_records`, `field_mappings`). SQLAlchemy models defined in `models.py`.
*   Architectural decision made: Use nested views in PostgreSQL for core calculations, combined with Metabase for BI.
*   Python preprocessing script (`scripts/preprocess_salary_data_parameterized.py`) developed to convert single Excel file to standardized CSV with Chinese headers.
*   Python header renaming script (`scripts/rename_csv_headers.py`) developed to convert preprocessed CSV headers to English using a JSON map, handling prefixes and outputting `utf-8-sig`.
*   `raw_salary_data_staging` table created in the database via Alembic migration, matching the structure of the **English-header** CSV.
*   **dbt Core Data Pipeline Established:**
    *   Sources defined (`raw_salary_data_staging`, `employees`, `units`, `departments`, `establishment_types`) in `schema.yml`.
    *   Staging models created and validated (`stg_raw_salary_data`, `stg_employees`, `stg_units`, `stg_departments`, `stg_establishment_types`).
    *   Mart models created and validated (`salary_records` fact table, `dim_units`, `dim_departments`, `dim_establishment_types` dimension tables).
    *   Successfully resolved various dbt compilation and runtime errors.
*   **Core Calculation Views (`view_base_data`, `view_level1_calculations`) created and managed by dbt:**
    *   View definitions migrated from Alembic to dbt models (`models/marts/views/`).
    *   Alembic migration (`a23d70659b45`) created to remove Alembic's management of these views.
    *   Resolved issue where `dbt run` caused view deletion via `CASCADE`.
*   Database table `public.establishment_types` updated with correct types: "专项", "专技", "区聘", "原投服".
*   Logic in `view_level1_calculations` (dbt model) updated for new establishment types.
*   Likely resolved issue of NULL `establishment_type_id` in `salary_records` by ensuring consistent naming for JOINs.
*   **Web Application Backend (FastAPI in `salary_system/webapp`):**
    *   Basic setup with CORS.
    *   Database connection established.
    *   Admin authentication (Basic Auth) implemented.
    *   **Authentication endpoint (`/token`) updated to include user email in JWT payload.**
    *   API endpoints for Employee CRUD (`/api/employees`) including filtering.
    *   API endpoints for Department and Establishment Type lists (`/api/departments-list`, `/api/establishment-types-list`).
    *   API endpoints for Field Mapping CRUD (`/api/config/mappings`).
    *   API endpoints for User CRUD (`POST /api/users`, `GET /api/users`, `GET /api/users/{id}`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`) and roles list (`GET /api/users/roles/list`) implemented.
    *   **User Management routes refactored to use SQLAlchemy ORM functions (`get_users_orm`, `create_user_orm`, `update_user_orm`, `delete_user_orm`, etc.), resolving `psycopg2` related errors.**
    *   API endpoint for Excel to CSV conversion and optional DB import (`/api/convert/excel-to-csv`), including triggering `dbt build` in background.
*   **Web Application Frontend (React/Vite/AntD in `salary_system/frontend/salary-viewer`):**
    *   Basic setup with routing (`App.tsx`).
    *   API client setup (`api.ts`).
    *   Employee Management component (`EmployeeManager.tsx`) with:
        *   Table display with pagination.
        *   Filtering UI (Name, Unique ID, Department, Establishment Type).
        *   Create Employee Modal using `EmployeeForm.tsx`.
        *   Edit Employee Modal using `EmployeeForm.tsx` (correctly handles establishment type).
        *   Delete Employee confirmation and functionality.
    *   **User Management component (`UserManager.tsx`) with:**
        *   Table display (users, roles, status) with pagination, sorting, and filtering.
        *   Combined Add/Edit modal with form validation (including password confirmation for add).
        *   Delete confirmation (`Popconfirm`).
        *   Backend API integration for viewing, adding, editing (email, role, status), and deleting users.
        *   Resolved various frontend warnings (i18n keys, AntD static context, autocomplete).
*   **Salary Record Viewing Module (Web App):**
    *   Backend API (`/api/salary_data`) provides filtered and paginated access to `view_level1_calculations`.
    *   Frontend component displays salary records in a table with pagination and filtering.
    *   **Field Mapping Configuration Module (Web App):**
        *   Backend API (`/api/config/mappings`) supports CRUD operations.
        *   Frontend component provides UI for managing field mappings.
    *   **UI/UX:**
        *   Sidebar navigation implemented, linking to major application modules.
    *   **User Profile Page (`UserProfilePage.tsx`) implemented, including displaying user info (username, email loaded from JWT), email update, and password change functionality.**
    *   **Resolved translation key errors across multiple components (`UserProfilePage`, `DepartmentManager`).**
    *   **Department Management component (`DepartmentManager.tsx`) UI refined (fixed layout overlap).**
*   **Field Mapping Configuration Module (Web App):**
    *   Backend API (`/api/config/mappings`) supports CRUD operations.
    *   Frontend component provides UI for managing field mappings.
*   **UI/UX:**
    *   Sidebar navigation implemented, linking to major application modules.
*   **Dockerization & Deployment Setup:**
    *   Backend (`docker/backend/Dockerfile`) and frontend (`docker/frontend/Dockerfile`) Dockerfiles created and functional (using Node 18 for frontend).
    *   `docker-compose.yml` configured in `salary_system/docker/` defining services: `db`, `backend-init`, `backend`, `frontend`, `jimu`, `db-backup`.
    *   Services connected via `salary-network`.
    *   Persistent volumes (`postgres_data`, `db_backups`) and config mounts (`nginx.conf`) configured.
    *   Configuration managed via `.env` file with defaults in `docker-compose.yml`.
    *   `backend-init` service implemented with `init_app.py` script template for DB migration and admin user creation.
    *   `db-backup` service implemented for automated backups.
    *   Frontend build issues (TypeScript TS6133, Node 16 crypto error) resolved.
    *   Frontend image (`salary-frontend:latest`) built and pushed to ACR (`registry.cn-hangzhou.aliyuncs.com/salary_system`).
    *   Backend image (`salary-backend:latest`) built and pushed to ACR (`registry.cn-hangzhou.aliyuncs.com/salary_system`).

**What's Left to Build:**
*   **Docker Environment Testing & Debugging:**
    *   Thoroughly test the application startup and functionality using `docker compose up`.
    *   Verify and debug the `init_app.py` script's imports and logic within the container environment.
    *   Test the database backup and restore process.
*   Implement SQLAlchemy models for the core database tables (e.g., `employees`, `salary_records`, etc.) - *Note: Review if models in `salary_system/models.py` cover all needs or if this refers to ORM usage within FastAPI which hasn't been fully implemented yet.*
*   Create and apply the initial Alembic database migration for the core tables - *Note: Core schema (employees, types, units, departments, mappings) seems established via Alembic. `salary_records` was defined but might need review as dbt creates a table with that name too.*
*   Test manual import API thoroughly.
*   Create the final reporting view (`view_final_report`) - *Potentially as a dbt model*.
*   Set up Jimu Reports dashboards and reports.
*   **Web Application Development (Remaining Features):**
    *   **Authentication integration on the frontend (Login page/flow).**
    *   **Role-Based Access Control (RBAC) enforcement on backend and frontend.**
*   Testing (dbt tests, unit, integration, end-to-end).
*   **Production Deployment.**

**Current Status:** Core dbt transformation pipeline and web application features are implemented. The entire application stack (DB, Backend, Frontend, Init, Backup) has been successfully **containerized** using Docker Compose. Frontend and backend images have been built and **pushed to the specified ACR repository**. The system is now ready for **integration testing within the Docker environment**, focusing on the initialization process, application functionality, and backup mechanism before final deployment planning.

**Known Issues/Risks:**
*   Reliance on employee Name for merging deduction sheets is a potential risk if names are not truly unique within a pay period; script includes an abort mechanism if duplicates are detected in deduction sheets.
*   Need to ensure `establishment_type_name` consistency between source data and `establishment_types` table for correct `salary_records` generation.
*   Complexity of nested views if calculation logic becomes very intricate.
*   The `init_app.py` script currently contains placeholder imports and logic; it **requires verification and modification** to match the actual backend project structure for database initialization and admin creation to work correctly within the container.
*   The `db-backup` service logic (backup frequency, retention) might need adjustment based on requirements and testing. 