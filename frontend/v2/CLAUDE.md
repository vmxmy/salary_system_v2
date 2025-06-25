# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

### Build & Development
```bash
npm run dev           # Start development server on host 0.0.0.0
npm run build         # TypeScript compile + production build
npm run preview       # Preview production build
npm run lint          # ESLint code quality check
```

### Testing
```bash
npm run test:e2e               # Run all Playwright E2E tests
npm run test:e2e:ui            # Playwright test runner with UI
npm run test:e2e:debug         # Debug mode for E2E tests
npm run test:responsive        # Test responsive design
npm run test:modern-components # Test modern design system components
npm run test:auth              # Test authentication flow
npm run test:modern-validation # Test modern design validation
```

### Internationalization (i18n)
```bash
npm run i18n:scan     # Scan for i18n keys and update translation files
```

### Code Quality Scripts
```bash
node scripts/check-hardcoded-text.cjs    # Find hardcoded text needing i18n
node scripts/check-untranslated.cjs      # Find missing translations
node scripts/auto-i18n-replace.cjs       # Auto-replace hardcoded strings
```

## Architecture Overview

### Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Ant Design 5 + Pro Components
- **State Management**: Redux Toolkit + React Query (TanStack Query)
- **Routing**: React Router v7
- **Internationalization**: i18next with react-i18next
- **Styling**: Less + Modern Design System
- **Testing**: Playwright (E2E)

### Project Structure
```
src/
├── components/         # Reusable UI components
│   ├── common/        # Generic shared components
│   └── universal/     # Universal data processing components
├── pages/             # Page-level components organized by feature
│   ├── Admin/         # Admin management pages
│   ├── HRManagement/  # HR and employee management
│   ├── Payroll/       # Payroll processing and management
│   └── SimplePayroll/ # Simplified payroll interface
├── layouts/           # Layout components (MainLayout, ProLayoutWrapper)
├── router/            # Route configuration and guards
├── services/          # API clients and business logic
├── hooks/             # Custom React hooks
├── store/             # Redux slices and state management
├── styles/            # Global styles and design system
├── utils/             # Utility functions
└── types/             # TypeScript type definitions
```

### Key Architectural Patterns

#### Modern Design System
The application uses a comprehensive modern design system:
- **Core System**: `src/styles/modern-design-system.less` - Colors, typography, spacing
- **Advanced Components**: `src/styles/modern-components-advanced.less` - Complex component styling
- **Modern Forms**: `src/styles/modern-forms.less` - Form component styling
- **Utilities**: `src/styles/modern-utilities.less` - 500+ utility classes

#### Component Architecture
- **Page Templates**: Use `ModernPageTemplate` for consistent page layouts
- **Cards**: Use `ModernCard` for consistent card styling
- **Tables**: Use `TableActionButton` for consistent table operations
- **Forms**: Follow the established form patterns in modern-forms.less

#### State Management
- **Global State**: Redux Toolkit for authentication, lookups, and configuration
- **Server State**: React Query for API data fetching and caching
- **Local State**: useState/useReducer for component-specific state

#### Internationalization (i18n)
- **Structure**: Nested JSON with dot notation (keySeparator: '.')
- **Namespaces**: Feature-based namespaces (employee, payroll, admin, etc.)
- **Usage**: `useTranslation()` hook with namespace parameter
- **Key Naming**: snake_case with hierarchical structure

## Development Guidelines

### Component Development
1. **Follow Modern Design System**: Use established styles and components
2. **Responsive Design**: Ensure mobile-first responsive behavior
3. **Internationalization**: All user-facing text must use i18n
4. **TypeScript**: Maintain strict typing throughout
5. **Testing**: Add E2E tests for critical user flows

### Styling Approach
- Use existing design tokens from `design-tokens.ts`
- Leverage utility classes from `modern-utilities.less`
- Follow the established color palette and spacing system
- Ensure dark mode compatibility where applicable

### API Integration
- Use React Query for all server state management
- API clients are in `src/services/` directory
- Follow established error handling patterns
- Implement optimistic updates where appropriate

### Routing & Navigation
- Routes are configured in `src/router/routes.tsx`
- Use lazy loading for page components
- Implement proper route guards with `AppProtectedRoute`
- Menu configuration is in `src/config/menuConfig.tsx`

### Performance Considerations
- Build uses manual code splitting (see vite.config.ts)
- Images and assets are optimized
- React Query provides intelligent caching
- Lazy loading is used for route-based code splitting

## Common Development Patterns

### Creating New Pages
1. Create page component in appropriate `src/pages/` subdirectory
2. Add route to `src/router/routes.tsx`
3. Add menu item to `src/config/menuConfig.tsx` if needed
4. Add translation keys to appropriate namespace
5. Follow `ModernPageTemplate` pattern for layout

### Adding New API Endpoints
1. Define types in `src/types/`
2. Create service in `src/services/`
3. Create React Query hooks in component or custom hook
4. Handle loading, error, and success states

### Internationalization Workflow
1. Add translation keys to JSON files in `public/locales/`
2. Use `useTranslation()` hook with appropriate namespace
3. Run `npm run i18n:scan` to update translation files
4. Test both languages (en/zh-CN)

### Testing Strategy
- E2E tests cover critical user journeys
- Responsive tests ensure mobile compatibility
- Modern design validation tests check UI consistency
- Authentication flow testing for security

## Important Configuration Files

### Build Configuration
- `vite.config.ts`: Build optimization, code splitting, aliases
- `tsconfig.json`: TypeScript configuration
- `eslint.config.js`: Code quality rules with React Hooks strict checking

### Testing Configuration
- `playwright.config.ts`: E2E testing setup with multiple devices/browsers
- Tests run against `http://10.10.10.11:5173` (update as needed)

### Internationalization
- `i18next-parser.config.cjs`: Translation file generation
- `src/i18n.ts`: i18next configuration
- Translation files in `public/locales/{lang}/{namespace}.json`

## Quality Standards

### Code Quality
- ESLint enforces React Hooks rules strictly to prevent infinite loops
- TypeScript strict mode enabled
- Unused imports automatically removed
- Component prop-types disabled (using TypeScript)

### Design Consistency
- Modern design system provides visual consistency
- Responsive design tested across multiple viewports
- Accessibility considerations in component design
- Consistent interaction patterns across the application

## Security & Performance

### Security
- CSP headers configured in vite.config.ts
- Authentication handled through protected routes
- API tokens managed through Redux store
- XSS protection through React's built-in escaping

### Performance
- Code splitting reduces initial bundle size
- React Query provides intelligent caching
- Production builds remove console statements
- Terser minification with optimizations

## Memories

- 默认服务已启动,并开启了热加载模式,不需要重复启动.
- 使用中文输出