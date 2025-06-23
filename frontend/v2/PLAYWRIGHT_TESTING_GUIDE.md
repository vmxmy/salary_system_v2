# Modern Design System - Playwright E2E Testing Guide

## Overview

This guide covers end-to-end testing of our modernized payroll management system using Playwright, with a focus on responsive design and mobile optimization testing.

## Setup

### Prerequisites

1. **Playwright Installation**: Already installed with `npm install playwright @playwright/test --save-dev`
2. **Browser Dependencies**: Run `sudo npx playwright install-deps` if needed
3. **MCP Playwright**: Installed globally with `npm install -g playwright-mcp`

### Configuration

- **Playwright Config**: `playwright.config.ts`
- **MCP Config**: `.mcp.json` (includes playwright server configuration)
- **Test Directory**: `tests/e2e/`

## Test Scripts

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (visual test runner)
npm run test:e2e:ui

# Debug tests (step-by-step execution)
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run only responsive design tests
npm run test:responsive
```

## Testing Strategy

### 1. Responsive Design Testing

Our main test file `modern-design-responsive.spec.ts` covers:

#### **Viewport Testing**
- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1440x900 (Standard desktop)

#### **Pages Tested**
- ✅ SimplePayroll (`/simple-payroll`)
- ✅ Payroll Runs (`/payroll/runs`)
- ✅ Payroll Periods (`/payroll/periods`)
- ✅ Employee Management (`/hr/employees`)
- ✅ User Management (`/admin/users`)
- ✅ Role Management (`/admin/roles`)

#### **Components Tested**
- **ModernPageTemplate**: Responsive layout behavior
- **ModernCard**: Stacking and sizing on different screens
- **UnifiedTabs**: Tab navigation on mobile devices
- **TableActionButton**: Touch target accessibility
- **ProTable**: Responsive table behavior

### 2. Accessibility Testing

#### **Touch Target Requirements**
- Minimum 44px x 44px for all interactive elements
- Proper spacing between clickable elements
- Accessible focus states

#### **Mobile Usability**
- Horizontal scrolling for tables
- Proper modal sizing on small screens
- Readable text at all zoom levels

### 3. Cross-Browser Testing

Tests run across:
- **Chromium** (Desktop Chrome)
- **Firefox** (Desktop Firefox)
- **WebKit** (Desktop Safari)
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 12)
- **iPad** (Portrait and Landscape)

## MCP Playwright Integration

### Available MCP Tools

When connected to Claude Code with MCP, you can use:

```javascript
// Take screenshot of specific page
await page.screenshot({ path: 'screenshot.png' });

// Test responsive behavior
await page.setViewportSize({ width: 375, height: 667 });

// Interact with modern components
await page.click('.modern-button');
await page.fill('.ant-input', 'test data');

// Wait for dynamic content
await page.waitForLoadState('networkidle');
```

### MCP Configuration

`.mcp.json` includes:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "playwright-mcp",
      "args": [],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Test Development Guidelines

### 1. Page Object Pattern

Create reusable page objects:

```typescript
// tests/page-objects/SimplePayrollPage.ts
export class SimplePayrollPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/simple-payroll');
  }
  
  async isResponsive() {
    const cards = this.page.locator('.modern-card');
    return await cards.count() > 0;
  }
}
```

### 2. Test Data Management

Use fixtures for consistent test data:

```typescript
// tests/fixtures/test-data.ts
export const TEST_USERS = {
  admin: { username: 'admin', password: 'password' },
  hr: { username: 'hr', password: 'password' }
};
```

### 3. Visual Testing

Enable visual comparisons:

```typescript
// Visual regression testing
await expect(page).toHaveScreenshot('payroll-runs-desktop.png');
```

## Test Organization

```
tests/
├── e2e/
│   ├── modern-design-responsive.spec.ts  # Main responsive tests
│   ├── example.spec.ts                   # Basic example
│   └── auth.spec.ts                      # Authentication tests
├── page-objects/
│   ├── SimplePayrollPage.ts
│   ├── PayrollRunsPage.ts
│   └── AdminPage.ts
├── fixtures/
│   ├── test-data.ts
│   └── mock-api.ts
└── utils/
    ├── test-helpers.ts
    └── assertions.ts
```

## Test Results and Reporting

### Artifacts Generated

- **Screenshots**: `test-results/*.png` (on failure)
- **Videos**: `test-results/*.webm` (on failure)
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`

### CI/CD Integration

For continuous integration:

```yaml
# .github/workflows/e2e.yml
- name: Run Playwright tests
  run: npm run test:e2e
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Debugging Tests

### Common Issues and Solutions

1. **Authentication Required**
   ```typescript
   test.beforeEach(async ({ page }) => {
     // Mock auth or login
     await page.goto('/login');
     await page.fill('[data-testid="username"]', 'admin');
     await page.click('[data-testid="login-button"]');
   });
   ```

2. **Dynamic Content Loading**
   ```typescript
   // Wait for content to load
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('.data-loaded');
   ```

3. **Responsive Layout Issues**
   ```typescript
   // Check element positioning
   const box = await element.boundingBox();
   expect(box?.y).toBeGreaterThan(previousBox?.y);
   ```

### Debug Mode

Run with debug flags:
```bash
# Step-by-step execution
npm run test:e2e:debug

# Headed mode (show browser)
npx playwright test --headed

# Specific browser
npx playwright test --project="Mobile Chrome"
```

## Performance Testing

### Key Metrics

- **Page Load Time**: < 5 seconds
- **Time to Interactive**: < 3 seconds
- **Largest Contentful Paint**: < 2.5 seconds

```typescript
test('performance metrics', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/simple-payroll');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(5000);
});
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Test real user flows** rather than individual components
3. **Include edge cases** like slow networks and large datasets
4. **Maintain test independence** - each test should work in isolation
5. **Use meaningful assertions** that reflect user experience

## Integration with Modern Design System

Our tests specifically validate:

- ✅ **ModernPageTemplate**: Responsive layout behavior
- ✅ **ModernCard**: Proper stacking and sizing
- ✅ **TableActionButton**: Accessibility compliance
- ✅ **UnifiedTabs**: Mobile navigation
- ✅ **ProTable**: Responsive table features
- ✅ **StatusTag**: Consistent rendering

This ensures our modern design system works flawlessly across all devices and use cases!