# 1. Documentation Guide

This document outlines the standards and guidelines for creating and maintaining project documentation. It ensures consistency, maintainability, and effectiveness of all project-related documents.

## 1. Scope of Documentation

This guide applies to three main types of documents within the project:

1.  **Instructional Documents (Documentation):** Records various aspects of the project, including overviews, installation guides, system architecture, API references, contribution guidelines, changelogs, etc.
2.  **Task Documents:** Used for recording and managing tasks during the project development process.
3.  **Memory Documents:** Stores non-code files of reference value generated during project development, especially LLM-related data, configurations, or experimental records, and other important design, decision, or process documents.

## 2. General Principles

*   **Clarity and Accuracy:** Content must be accurate and reflect the current state of the project.
*   **Conciseness:** Use clear language and avoid unnecessary jargon or overly verbose descriptions.
*   **Audience-Oriented:** Consider the target audience (developers, users, project managers) and provide the information they need.
*   **Timeliness:** Documents should be updated promptly when project changes occur.
*   **Accessibility:** All documents should be stored in a centralized and easily accessible location.
*   **Format:** Primarily use Markdown for documentation.

## 3. Instructional Documents (e.g., in `docs/frontend/`, `docs/backend/`)

### 3.1 Purpose

*   Provide clear and accurate project information to team members.
*   Facilitate quick onboarding for new members.
*   Record design decisions and project evolution.
*   Offer operational guides and reference information for users and developers.

### 3.2 Storage Location

All instructional documents should be stored within the `docs/` directory, organized into subdirectories like `docs/frontend/`, `docs/backend/`, and `docs/common/`. Further subdirectories can be created based on document type or topic (e.g., `docs/backend/api/`, `docs/backend/architecture/`).

### 3.3 Naming Conventions

*   Filenames should be descriptive, in English lowercase, with words separated by hyphens (preferred) or underscores.
*   Use `.md` as the file extension.
*   Examples: `README.md`, `installation-guide.md`, `system-architecture.md`, `api-reference.md`.

### 3.4 Writing Format

*   Use Markdown.
*   Follow a consistent heading structure.
*   Use code blocks for code examples, configurations, or commands.
*   Utilize lists, tables, etc., to enhance readability.
*   For images, store them in an `images/` subdirectory within the respective document's location and use relative paths.

### 3.5 Common Document Types

*   `README.md` or `0_Overview_and_Roadmap.md`: Entry point, providing an introduction, core information.
*   Installation Guide: Detailed setup and configuration steps.
*   Architecture Document: Describes system architecture, modules, technology choices.
*   Database Schema Document: Details database structure, tables, fields, relationships.
*   API Reference: Lists API endpoints, parameters, responses, examples.
*   Contribution Guide: Explains how to contribute, submit code, report issues.
*   Changelog: Records updates, new features, bug fixes for each version.

## 4. Task Documents (e.g., in `docs/frontend/2_Development_Tasks_and_Phases/`)

### 4.1 Purpose

*   Clearly record project tasks, assignees, statuses, and priorities.
*   Track task progress.
*   Help team members understand current task assignments and work focus.

### 4.2 Storage and Format

*   Task planning documents (like current development plans, backlogs) are stored in Markdown within the respective `docs/frontend/2_Development_Tasks_and_Phases/` or `docs/backend/2_Development_Tasks_and_Phases/` directories.
*   If using external project management tools (Jira, Trello), ensure information is kept up-to-date there.
*   Markdown task lists should include: Title, Description, Type, Priority, Status, Assignee, Due Dates, Progress Notes.

## 5. Memory Documents (e.g., in `memory-bank/`)

### 5.1 Purpose

*   Centralize non-code assets and important records.
*   Preserve LLM-related experimental data and configurations for reproducibility and iteration.
*   Record significant design decisions, meeting minutes, or technical research findings.

### 5.2 Storage Location

Store in the project's `memory-bank/` directory. It is highly recommended to create subdirectories based on content type (e.g., `llm-data/`, `llm-configs/`, `design-docs/`, `meeting-notes/`, `research/`, `processes/`).

### 5.3 Naming Conventions

*   Descriptive filenames reflecting content.
*   May include dates or version numbers.
*   Examples: `llm-training-data-v1.csv`, `system-design-v2.md`, `api-design-meeting-20231026.md`.

### 5.4 Content Requirements

*   **Clear Structure:** Easy to navigate and read.
*   **Contextual Information:** For data/config files, provide explanations of source, format, purpose.
*   **Security:** Be mindful of sensitive information in `memory-bank/`. Do not commit secrets to the repository; use environment variables or a secrets management system.
*   **Version Control:** Version important documents.

## 6. Document Review and Maintenance

*   Important documents (e.g., system architecture, API docs) should undergo team review.
*   Assign responsibility for maintaining key documents.
*   Include checks for relevant documentation updates during code reviews.

*Content adapted from `docs/v2/文档规范.md`.* 