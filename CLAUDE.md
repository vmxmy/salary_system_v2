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
# Start development server (check start-dev.sh for exact command)python -m uvicorn main:app --reload --host 0.0.0.0 --port 8080

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

## Development Environment Notes

### Terminal and Environment Setup
- Terminal: Use zsh
- Python Environment: `conda activate lightweight-salary-system`
- Alembic Path: `webapp/v2`

## Architecture

## Development Notes

- 前后端服务器都已经启动,并且都是热加载状态,你不用启动服务,只需要调用和测试.