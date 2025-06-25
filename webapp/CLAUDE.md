# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Login Credentials

- Default Admin Credentials:
  - Username: `admin`
  - Password: `admin`

## Essential Commands

### Backend Development
```bash
# Navigate to backend directory
cd webapp

# Install Python dependencies
pip install -r requirements.txt

# Start development server with auto-reload
./start-dev.sh
# OR manually:
uvicorn main:app --reload --host 0.0.0.0 --port 8080

# Database operations (Alembic)
cd v2
alembic upgrade head
alembic revision --autogenerate -m "Description"
alembic downgrade -1

# Run API tests
cd scripts
python api_tester.py --test-all
python test_complete_payroll_system.py
python test_v2_auth.py
```

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend/v2

# Install dependencies
npm install

# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:watch
npm run test:coverage

# End-to-end testing with Playwright
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug
npm run test:e2e:report

# Specific test suites
npm run test:responsive
npm run test:modern-components
npm run test:auth
npm run test:modern-validation

# Internationalization
npm run i18n:scan

# Linting
npm run lint
```

### Docker Development
```bash
# Backend container
cd docker/backend
docker-compose up --build

# Frontend container  
cd docker/frontend
docker-compose up --build
```

## Project Architecture

### High-Level Structure
This is a **full-stack salary management system** with a React frontend and FastAPI backend:

- **Frontend**: React 18 + TypeScript + Vite + Ant Design Pro
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Database**: PostgreSQL with comprehensive view layer
- **Authentication**: JWT-based with role-based access control
- **Internationalization**: React i18next (Chinese/English)

### Directory Structure
```
salary_system/
├── webapp/                 # Backend (FastAPI)
│   ├── main.py            # Application entry point
│   ├── v2/                # V2 API implementation
│   │   ├── routers/       # API route handlers
│   │   ├── models/        # SQLAlchemy models
│   │   ├── crud/          # Database operations
│   │   ├── services/      # Business logic
│   │   └── scripts/       # Testing and utility scripts
│   └── core/config.py     # Application settings
├── frontend/v2/           # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API clients
│   │   ├── hooks/         # Custom React hooks
│   │   └── router/        # Route configuration
│   └── public/locales/    # i18n translation files
└── docs/                  # Comprehensive documentation
```

### Key Architectural Patterns

#### Backend Architecture
- **Layered Architecture**: Router → Service → CRUD → Model
- **Database Views**: Comprehensive view layer for optimized queries (e.g., `v_employees_with_details`)
- **Dual API Strategy**: V1 (legacy) and V2 (modern) APIs coexist
- **Configuration Management**: Environment-based settings with Pydantic
- **Permission System**: Role-based access control with granular permissions

#### Frontend Architecture
- **Modern Design System**: Unified design tokens and component library
- **Route-Based Code Splitting**: Lazy loading for optimal performance
- **State Management**: 
  - Redux Toolkit for global state
  - React Query for server state caching
  - Zustand for specific feature stores
- **Component Architecture**:
  - Page components in `/pages`
  - Shared components in `/components/common`
  - Universal components in `/components/universal`

#### Database Design
- **Core Schema**: Employee, Department, Position, Personnel Category
- **Payroll Schema**: Periods, Runs, Entries, Components
- **Report Schema**: Templates, Data Sources, Configurations
- **View Layer**: Optimized views for complex queries
- **Audit System**: Comprehensive logging and change tracking

### API Structure

#### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role hierarchy: SUPER_ADMIN → ADMIN → HR_MANAGER → MANAGER → EMPLOYEE
- Permission-based access control for granular security

#### Core API Endpoints
```
/api/v2/auth/*           # Authentication
/api/v2/employees/*      # Employee management
/api/v2/payroll/*        # Payroll operations
/api/v2/reports/*        # Report generation
/api/v2/config/*         # System configuration
/api/v2/system/*         # System management and health
/api/v2/debug/*          # Debug tools (admin only)
/api/v2/utilities/*      # File conversion and utilities
```

#### Database View Usage
The system extensively uses PostgreSQL views for:
- Employee details with organizational hierarchy
- Payroll calculations with all components
- Report data aggregation
- Performance-optimized queries

### Frontend Component Architecture

#### Modern Design System
- **Design Tokens**: Centralized theme values in `/styles/design-tokens.ts`
- **Component Library**: Modern components with consistent styling
- **Responsive Design**: Mobile-first approach with breakpoint system

#### Key Frontend Patterns
- **Universal Components**: Reusable data browser and management components
- **Service Layer**: Centralized API communication with error handling  
- **Hook Composition**: Custom hooks for business logic separation
- **Internationalization**: Complete i18n support with context-aware translations

### Testing Strategy

#### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright with comprehensive scenarios
- **Visual Regression**: Automated responsive design validation
- **Component Testing**: Isolated component behavior testing

#### Backend Testing
- **API Testing**: Comprehensive endpoint validation using `api_tester.py`
- **Database Testing**: Model and relationship testing
- **Integration Testing**: Full workflow validation
- **Performance Testing**: Database query optimization

### API Testing with api_tester.py

The backend includes a comprehensive API testing tool:

```bash
# List all available endpoints
python v2/scripts/api_tester.py --list-endpoints

# Test all endpoints
python v2/scripts/api_tester.py --test-all

# Test specific categories
python v2/scripts/api_tester.py --test-all --categories employees,payroll

# Test individual endpoint
python v2/scripts/api_tester.py --endpoint /v2/employees --method GET

# Generate test report
python v2/scripts/api_tester.py --test-all --report test_report.json
```

### Development Workflow

#### Branch Strategy
- `main`: Production-ready code
- `feature/*`: Feature development branches
- `feature/style-unification`: Current modernization effort

#### Code Quality
- **Frontend**: ESLint + TypeScript strict mode
- **Backend**: Black formatting + mypy type checking
- **Database**: Alembic migrations with rollback support

#### Performance Considerations
- **Frontend**: Code splitting, lazy loading, React Query caching
- **Backend**: Database connection pooling, query optimization
- **Database**: Indexed views, materialized views for reports

### Important Development Notes

#### Frontend Development
- Always run `npm run i18n:scan` after adding new text content
- Use the modern design system components from `/components/common`
- Follow the established routing patterns with permission guards
- Test responsive design with `npm run test:responsive`

#### Backend Development  
- Use V2 API patterns for new endpoints
- Leverage database views for complex queries
- Follow the established CRUD → Service → Router pattern
- Always create Alembic migrations for schema changes
- Test API endpoints with `api_tester.py` before deployment

#### Database Development
- Create views for complex queries instead of complex joins in code
- Use the existing permission system for access control
- Follow naming conventions: `v_` prefix for views, `hr_` prefix for HR tables

### Debugging Tools

The system includes comprehensive debugging tools for backend development:

```bash
# Check database connection and status
python v2/scripts/test_db_connection.py

# Debug authentication issues
python v2/scripts/diagnose_v2_auth.py

# Test server status
python v2/scripts/test_server_status.py

# Debug payroll calculations
python v2/scripts/debug_payroll_calculation.py
```

## 🔄 V1 to V2 Migration Status

### Completed Migration
All V1 endpoints have been successfully migrated to V2 architecture:

**Original V1 → New V2**
- `GET /` → `GET /v2/system/info`
- `GET /health` → `GET /v2/system/health`  
- `GET /converter` → `GET /v2/utilities/converter`
- `GET /api/debug/field-config/{key}` → `GET /v2/debug/field-config/{key}`

### New V2 System Features
- **System Management**: Health checks, version info, metrics
- **Debug Tools**: Database diagnostics, performance analysis, permission testing
- **Utilities**: File conversion, data export, template management
- **Unified Architecture**: All endpoints follow V2 patterns with proper authentication and error handling

This system represents a mature, production-ready salary management platform with modern architectural patterns and comprehensive functionality.