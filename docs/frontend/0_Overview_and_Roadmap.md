# 0. Frontend Overview and Roadmap (v2)

This document provides an overview of the Salary Information Management System's v2 frontend, its objectives, and the development roadmap. It is primarily based on `docs/v2/V2实施计划.md` and `docs/v2/项目开发核心信息.md`.

## 1. Project Overview (Frontend v2)

*   **Objective:** To build a new v2 frontend for the HR & Payroll system, leveraging the functional base of the existing `salary-viewer` project but with a modern tech stack (Vite + React + TypeScript + Ant Design) and a cleaner architecture. This new frontend will interface with the v2 backend APIs.
*   **Core Strategy:** Migrate and refactor functionalities from the `salary-viewer` project, rather than a complete rewrite from scratch or modifying the old Vue project. Existing React components and logic from `salary-viewer` will be reused where feasible, adapted to the v2 architecture.
*   **Target Directory:** `frontend/v2/`

## 2. Key Frontend Goals

*   **Modern User Interface:** Provide an intuitive, responsive, and aesthetically pleasing user experience using Ant Design components.
*   **Improved Performance:** Utilize Vite for faster builds and development, and optimize component rendering.
*   **Enhanced Maintainability:** Implement a clear project structure, well-defined components (common, layout, business), and consistent state management (e.g., Redux Toolkit or Zustand, TBD based on final V2 docs).
*   **TypeScript Integration:** Ensure strong typing throughout the application for better code quality and developer experience.
*   **Comprehensive Feature Set:** Support all necessary HR, Payroll, Employee Self-Service (ESS), and Manager Self-Service (MSS) functionalities as defined in requirements.
*   **Internationalization (i18n):** Support for multiple languages.

## 3. Core Technologies (as per `docs/v2/项目开发核心信息.md` and `V2实施计划.md`)

*   **Framework/Library:** React (18)
*   **Language:** TypeScript (~5.7.2)
*   **Build Tool:** Vite (^6.3.1)
*   **UI Component Library:** Ant Design (implied by `V2实施计划.md`, version TBD)
*   **State Management:** Redux Toolkit (mentioned in `V2实施计划.md`, though `项目开发核心信息.md` lists Zustand - **clarification needed from definitive V2 frontend docs**)
*   **Routing:** React Router
*   **API Client:** Axios (^1.8.4)
*   **Charts:** @ant-design/charts (mentioned in `V2实施计划.md`)
*   **Drag & Drop:** @dnd-kit (mentioned in `V2实施计划.md`)
*   **Excel Export:** xlsx (mentioned in `V2实施计划.md`)

## 4. High-Level Frontend Roadmap & Phases (from `docs/v2/V2实施计划.md`)

*   **Phase 1: Preparation & Base Infrastructure Setup**
    *   Environment setup, V2 project initialization.
    *   Base routing and main layout components.
    *   State management integration (e.g., Redux Toolkit store).
    *   API service layer setup (Axios instance, interceptors).
*   **Phase 2: Core Functionality Migration & Refactoring**
    *   Authentication module (login, user profile).
    *   `SalaryDataViewer` component and related table/filter logic.
    *   Integration with Backend v2 APIs.
    *   Basic data management pages (e.g., for employees, departments - if part of `salary-viewer` scope).
*   **Phase 3: Extended Functionality Migration & Optimization**
    *   Email services (payslip sending, configuration).
    *   Reporting features.
    *   Advanced table features (column settings, export).
    *   Chatbot integration (e.g., Dify).
    *   Full internationalization.
*   **Phase 4: Testing, Optimization & Deployment**
    *   Unit, integration, and end-to-end testing.
    *   Performance analysis and optimization.
    *   Security checks.
    *   Production build and deployment processes.

## 5. Estimated Timeline (from `docs/v2/V2实施计划.md`)

*   Phase 1: 1-2 Weeks
*   Phase 2: 4-6 Weeks
*   Phase 3: 3-4 Weeks
*   Phase 4: 2-3 Weeks
*   **Total Estimated Time:** 10-15 Weeks (subject to adjustment)

## 6. Key Risks & Mitigation (from `docs/v2/V2实施计划.md`)

*   Learning curve for tech stack.
*   Complexity of migrating old code.
*   Backend API changes requiring frontend adaptation.
*   Potential performance bottlenecks.
*   **Mitigation:** Training, detailed planning, close backend communication, continuous performance monitoring.

*This document provides a summary. For full details, refer to the source documents, particularly `docs/v2/V2实施计划.md` for the frontend plan.* 