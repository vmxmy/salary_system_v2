```plaintext
salary_system/
├── .env                     # Backend environment variables
├── .DS_Store                # macOS system file (can be ignored)
├── alembic.ini              # Alembic configuration
├── alembic/                 # Alembic migration scripts
│   ├── README
│   ├── env.py               # Alembic environment setup
│   ├── script.py.mako       # Migration script template
│   ├── versions/            # Migration script files (.py)
│   └── __pycache__/
├── frontend/                # Frontend application
│   └── salary-viewer/       # React application root
│       ├── public/
│       ├── src/             # Source code
│       │   ├── App.css
│       │   ├── App.tsx      # Main application component, routing, layout
│       │   ├── index.css
│       │   ├── main.tsx     # Entry point
│       │   ├── vite-env.d.ts
│       │   ├── assets/      # Static assets (images, etc.)
│       │   ├── components/  # React components (e.g., EmployeeManager.tsx)
│       │   └── services/    # API service calls (e.g., api.ts)
│       ├── .eslintrc.cjs
│       ├── .gitignore
│       ├── index.html
│       ├── package-lock.json
│       ├── package.json
│       ├── postcss.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       └── vite.config.ts
├── logs/                    # Log files directory (may contain old logs)
│   ├── employee_import.log
│   └── preprocess_salary.log
├── models.py                # SQLAlchemy models (likely shared or legacy?)
├── salary_dbt_transforms/   # dbt project for data transformations
│   ├── README.md
│   ├── analyses/
│   ├── dbt_project.yml      # dbt project configuration
│   ├── logs/                # dbt generated logs
│   ├── macros/
│   ├── models/              # dbt models (SQL or Python)
│   │   ├── staging/
│   │   ├── intermediate/
│   │   └── marts/
│   ├── package-lock.yml
│   ├── seeds/
│   ├── snapshots/
│   ├── target/              # dbt compiled files (generated)
│   └── tests/
├── scripts/                 # Utility scripts (if any)
├── webapp/                  # Backend FastAPI application
│   ├── .env                 # Potentially redundant .env?
│   ├── .env.example
│   ├── backend/             # (Potentially holds more structured backend code?)
│   ├── config/              # Configuration files
│   ├── converter.html       # Legacy or specific HTML template?
│   ├── file_converter.py    # Seems like a standalone script, maybe legacy?
│   ├── main.py              # Main FastAPI application file (API endpoints)
│   ├── requirements.txt     # Backend Python dependencies
│   └── __pycache__/
└── __pycache__/             # Python cache directory
``` 