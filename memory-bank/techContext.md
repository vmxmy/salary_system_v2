# Tech Context

*List technologies used, development setup, technical constraints, and dependencies.*

**Core Technologies:**
*   **Database:** PostgreSQL (v14+)
*   **ETL:** Python Scripts (for preprocessing)
*   **Transformation:** dbt Core
*   **BI / Reporting:** Jimu Reports
*   **Backend / DB Management:** Python (v3.10+), SQLAlchemy (for models), Alembic (for DB schema migrations)
*   **Web Framework:** 
    *   Backend: **FastAPI**
    *   Frontend: **React** (using Vite) with **Ant Design** component library
*   **Containerization:** Docker, Docker Compose
*   **Image Registry:** Aliyun Container Registry (ACR)

**Configuration:**
*   Database connection and other sensitive parameters are managed via `.env` files (main one located in `salary_system/docker/.env`).

**Dependencies:**
*   Docker/Docker Compose environment.
*   Python environment (`lightweight-salary-system` conda env or similar venv) with dependencies listed in `salary_system/webapp/requirements.txt`.
*   Node.js environment (v18+) with dependencies listed in `salary_system/frontend/salary-viewer/package.json`. 