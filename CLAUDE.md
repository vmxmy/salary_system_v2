# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive enterprise payroll management system (高新区工资信息管理系统) designed for government/public sector organizations. It's a full-stack web application with modern React frontend and FastAPI backend.

## Development Commands

### Frontend (React + TypeScript + Vite)
```bash
cd frontend/v2
npm run dev          # Start development server
npm run build        # Build for production (runs tsc -b && vite build)
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:coverage # Run tests with coverage
npm run i18n:scan    # Extract i18n strings
```

### Backend (FastAPI + SQLAlchemy)
```bash
cd webapp/v2
# Start development server (check start-dev.sh for exact command)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8080

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Run tests
python -m pytest
```

### Docker Development
```bash
cd docker
docker-compose up -d    # Start all services
docker-compose down     # Stop all services
```

## Architecture

### Frontend Architecture (`frontend/v2/`)
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Ant Design 5.25+ with Pro Components
- **State Management**: Redux Toolkit + React Query (TanStack Query)
- **Routing**: React Router DOM 7.6+
- **Internationalization**: i18next with Chinese/English support
- **Build Tool**: Vite 6.3+ for fast development and builds

### Backend Architecture (`webapp/v2/`)
- **Framework**: FastAPI with async/await support
- **Database**: PostgreSQL with SQLAlchemy 2.0+ ORM
- **Migrations**: Alembic for database schema management
- **Authentication**: JWT-based with role-based access control (60+ permissions)
- **API Design**: RESTful APIs with OpenAPI/Swagger documentation

### Database Schema Structure
- **hr schema**: Employee management, departments, positions, personnel categories
- **payroll schema**: Salary calculations, payroll periods, payroll runs
- **config schema**: System configurations, lookup values, payroll components
- **security schema**: Users, roles, permissions, audit logs
- **reports schema**: Report templates, data sources, batch report generation

## Key Development Patterns

### Frontend Patterns
- Use ProTable components for data tables with built-in pagination and search
- Implement internationalization with `useTranslation()` hook from react-i18next
- Follow the component structure in `src/components/common/` for reusable components
- Use React Query for server state management and API caching
- Implement permission-based UI rendering with PermissionGuard component

### Chart Component Patterns (`MetricCard` components)
- **Dual Component Architecture**: Full-size and Mini versions for different layouts
- **Tooltip Handling**: Use `onReady` event listeners with DOM manipulation rather than `customContent` for complex tooltips
- **Error Boundaries**: Wrap chart components in `MetricCardErrorBoundary` for fault tolerance
- **Data Processing**: Use `safeNumber()` utility for robust number conversion and null handling
- **Multi-line Charts**: For Line charts with multiple series, ensure data format matches `{xField, yField, seriesField}` structure
- **Color Configuration**: Use callback functions `color: (datum) => datum.color` for dynamic coloring

### Backend Patterns
- Follow the modular router structure in `routers/` directory
- Use Pydantic models for request/response validation in `pydantic_models/`
- Implement CRUD operations following the pattern in `crud/` directory
- Use database views for complex queries (defined in migration files)
- Follow the service layer pattern in `services/` directory for business logic

### Analytics Service Pattern
- Service classes in `services/simple_payroll/analytics_service.py` for complex data analysis
- Use database views (`reports.v_payroll_basic`) for optimized cross-schema queries
- Implement comprehensive logging with emoji prefixes for easy debugging
- Return structured Pydantic models for type safety

### Database Patterns
- Use Alembic migrations for all schema changes
- Implement comprehensive database views for optimized querying
- Follow the schema separation pattern (hr, payroll, config, security, reports)
- Use JSONB fields for flexible data storage with proper indexing

## Important Conventions

### Cursor Rules Integration
- Always use Python venv: `./venv` (activate before development)
- Use `uv pip install` if uv is available, otherwise fallback to pip
- Read files before editing them
- Include debugging information in program output
- For git commits with multiline messages, write to file first then use `git commit -F <filename>`
- Keep file operations under 250 lines per task - break down larger operations

### Code Quality Standards
- Follow single responsibility principle for all modules
- Keep files under 500 lines (prefer 200-300 lines)
- Keep functions under 50 lines
- Use consistent naming conventions (camelCase for frontend, snake_case for backend)
- Write clear, descriptive commit messages

### Testing Requirements
- Frontend: Use Jest + React Testing Library
- Backend: Use pytest for unit and integration tests
- Always run linting commands before committing
- Ensure test coverage for critical business logic

### Debugging Patterns
- **Chart Debugging**: Add comprehensive console logging in chart event handlers to trace data flow
- **API Data Validation**: Log API responses with detailed structure analysis before processing
- **Async Data Issues**: Check loading states and data availability in chart tooltip handlers
- **Component Rendering**: Use distinctive console log prefixes (e.g., 🎯🎯🎯) to identify which component version is rendering

## Technology Stack Details

### Frontend Dependencies
- Core: React 18.2+, TypeScript 5.8+, Vite 6.3+
- UI: Ant Design 5.25+, @ant-design/pro-components 2.8+
- Charts: @ant-design/charts 2.3+ (based on G2 engine)
- State: @reduxjs/toolkit 2.8+, @tanstack/react-query 5.80+
- Routing: react-router-dom 7.6+
- Utils: lodash, dayjs, axios, xlsx

### Chart Library Specifics (@ant-design/charts)
- **Column Charts**: Use `{data, xField, yField, colorField}` configuration
- **Pie Charts**: Use `{data, angleField, colorField, radius, innerRadius}` configuration  
- **Line Charts**: Use `{data, xField, yField, seriesField}` for multi-line charts
- **Tooltip Issues**: `customContent` may not work reliably; use `onReady` with event listeners
- **Color Mapping**: Use functions `color: (datum) => datum.color` rather than arrays for precise control
- **Data Structure**: Ensure data objects contain all required fields before passing to chart

### Backend Dependencies  
- Core: FastAPI, SQLAlchemy 2.0+, Alembic 1.12+
- Database: psycopg2-binary 2.9+, PostgreSQL
- Auth: python-jose, passlib for JWT authentication
- Data: pandas 2.1+, openpyxl 3.1+ for Excel processing
- Async: uvicorn with standard extras

## Business Domain Knowledge

### Payroll System Features
- **Simple Payroll**: Streamlined workflow for basic salary processing
- **Advanced Payroll**: Complex calculations with multiple components and social insurance
- **Bulk Import**: Excel-based data import with validation and transformation
- **Report Generation**: Automated batch reports with multiple export formats

### Permission System
- 60+ granular permissions across 12 functional modules
- Role-based access control with hierarchical permission inheritance
- Dynamic menu and UI rendering based on user permissions

### Internationalization
- Bilingual support (Chinese/English) throughout the application
- Automatic text extraction with i18next-parser
- Context-aware translations for business terminology

## Development Workflow

1. **Setup**: Ensure Python venv is activated and dependencies installed
2. **Database**: Run Alembic migrations to ensure schema is up to date
3. **Frontend**: Use npm commands for development, building, and testing
4. **Backend**: Use uvicorn for development server with auto-reload
5. **Testing**: Run both frontend and backend tests before committing
6. **Linting**: Always run linting commands to maintain code quality

## Common Development Tasks

- **Adding new API endpoints**: Follow the router → service → CRUD → model pattern
- **Database changes**: Always use Alembic migrations, never direct SQL changes
- **Frontend forms**: Use ProForm components with validation and i18n
- **Permission checks**: Implement both frontend (UI) and backend (API) permission validation
- **Report generation**: Use the report generator registry pattern in `services/report_generators/`