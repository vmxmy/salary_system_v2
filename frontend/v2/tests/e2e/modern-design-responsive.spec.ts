import { test, expect } from '@playwright/test';

/**
 * Modern Design System Responsive Testing Suite
 * 
 * Tests the responsive behavior of our modernized payroll management system
 * across different viewport sizes and devices.
 */

// Test data and selectors
const ROUTES = {
  SIMPLE_PAYROLL: '/simple-payroll',
  PAYROLL_RUNS: '/payroll/runs',
  PAYROLL_PERIODS: '/payroll/periods',
  EMPLOYEES: '/hr/employees',
  USERS: '/admin/users',
  ROLES: '/admin/roles'
};

const VIEWPORTS = {
  MOBILE: { width: 375, height: 667 }, // iPhone SE
  TABLET: { width: 768, height: 1024 }, // iPad
  DESKTOP: { width: 1440, height: 900 }, // Standard desktop
};

test.describe('Modern Design System - Responsive Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up authentication tokens to bypass login
    await page.addInitScript(() => {
      // Mock authentication state
      localStorage.setItem('auth_token', 'mock-test-token');
      localStorage.setItem('user_info', JSON.stringify({ 
        id: 1, 
        username: 'test-admin', 
        role: 'admin' 
      }));
      localStorage.setItem('permissions', JSON.stringify(['*']));
    });
    
    // Navigate to home page
    await page.goto('/');
    
    // Wait for potential authentication redirect and settle
    await page.waitForTimeout(1000);
    
    // If still on login page, perform login
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      await page.fill('input[type="text"], input[placeholder*="用户名"], input[placeholder*="username"]', 'admin');
      await page.fill('input[type="password"], input[placeholder*="密码"], input[placeholder*="password"]', 'admin');
      await page.click('button[type="submit"], button:has-text("登录"), button:has-text("登 录"), button:has-text("Login")');
      await page.waitForLoadState('networkidle');
    }
  });

  test.describe('SimplePayroll Page - Responsive Layout', () => {
    
    test('should display properly on mobile devices', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.goto(ROUTES.SIMPLE_PAYROLL);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check if ModernPageTemplate responsive features work
      const pageTemplate = page.locator('.modern-page-template');
      await expect(pageTemplate).toBeVisible();
      
      // Check if cards stack properly on mobile
      const cards = page.locator('.modern-card');
      await expect(cards.first()).toBeVisible();
      
      // Test mobile menu if exists
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await expect(page.locator('.mobile-menu-content')).toBeVisible();
      }
      
      // Take screenshot for visual comparison
      await page.screenshot({ 
        path: 'test-results/simple-payroll-mobile.png',
        fullPage: true 
      });
    });

    test('should display properly on tablet devices', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.TABLET);
      await page.goto(ROUTES.SIMPLE_PAYROLL);
      
      await page.waitForLoadState('networkidle');
      
      // Check tablet-specific layouts
      const container = page.locator('.container, .ant-layout-content');
      await expect(container).toBeVisible();
      
      // Test that buttons are touchable (min 44px target size)
      const buttons = page.locator('button');
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        const buttonBox = await firstButton.boundingBox();
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
        expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
      }
      
      await page.screenshot({ 
        path: 'test-results/simple-payroll-tablet.png',
        fullPage: true 
      });
    });

    test('should display properly on desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.DESKTOP);
      await page.goto(ROUTES.SIMPLE_PAYROLL);
      
      await page.waitForLoadState('networkidle');
      
      // Check desktop layout features
      const sidebar = page.locator('.ant-layout-sider, .sidebar');
      const content = page.locator('.ant-layout-content, .main-content');
      
      await expect(content).toBeVisible();
      
      // Test that multi-column layouts work properly
      const rows = page.locator('.ant-row');
      if (await rows.count() > 0) {
        const firstRow = rows.first();
        await expect(firstRow).toBeVisible();
      }
      
      await page.screenshot({ 
        path: 'test-results/simple-payroll-desktop.png',
        fullPage: true 
      });
    });
  });

  test.describe('Payroll Management Pages - Responsive Tables', () => {
    
    test('should handle responsive tables on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.goto(ROUTES.PAYROLL_RUNS);
      
      await page.waitForLoadState('networkidle');
      
      // Check if ProTable has responsive features
      const table = page.locator('.ant-table, .ant-pro-table');
      if (await table.isVisible()) {
        // Check if table scrolls horizontally on mobile
        const tableScroll = page.locator('.ant-table-body');
        await expect(tableScroll).toBeVisible();
        
        // Test if action buttons are accessible
        const actionButtons = page.locator('.ant-table-cell .ant-btn');
        if (await actionButtons.count() > 0) {
          await expect(actionButtons.first()).toBeVisible();
        }
      }
      
      await page.screenshot({ 
        path: 'test-results/payroll-runs-mobile.png',
        fullPage: true 
      });
    });

    test('should display statistics cards responsively', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.goto(ROUTES.PAYROLL_PERIODS);
      
      await page.waitForLoadState('networkidle');
      
      // Check if ModernCard components stack properly
      const cards = page.locator('.modern-card, .ant-card');
      if (await cards.count() > 0) {
        // Cards should be visible and stacked vertically on mobile
        const firstCard = cards.first();
        const secondCard = cards.nth(1);
        
        if (await firstCard.isVisible() && await secondCard.isVisible()) {
          const firstBox = await firstCard.boundingBox();
          const secondBox = await secondCard.boundingBox();
          
          // Second card should be below the first (stacked)
          expect(secondBox?.y).toBeGreaterThan(firstBox?.y || 0);
        }
      }
    });
  });

  test.describe('Navigation and Interactive Elements', () => {
    
    test('should have accessible touch targets on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.goto(ROUTES.EMPLOYEES);
      
      await page.waitForLoadState('networkidle');
      
      // Test button sizes meet accessibility guidelines (44px minimum)
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should handle form inputs on different screen sizes', async ({ page }) => {
      // Test on tablet size
      await page.setViewportSize(VIEWPORTS.TABLET);
      await page.goto(ROUTES.USERS);
      
      await page.waitForLoadState('networkidle');
      
      // Look for create/edit buttons
      const createButton = page.locator('button:has-text("创建"), button:has-text("Create"), button:has-text("添加")');
      
      if (await createButton.first().isVisible()) {
        await createButton.first().click();
        
        // Wait for modal or form to appear
        await page.waitForTimeout(1000);
        
        // Check if form modal is responsive
        const modal = page.locator('.ant-modal, .ant-drawer');
        if (await modal.isVisible()) {
          const modalBox = await modal.boundingBox();
          
          // Modal should not exceed viewport width
          expect(modalBox?.width).toBeLessThanOrEqual(VIEWPORTS.TABLET.width);
          
          // Form inputs should be properly sized
          const inputs = page.locator('.ant-input, .ant-select');
          if (await inputs.count() > 0) {
            const firstInput = inputs.first();
            const inputBox = await firstInput.boundingBox();
            
            // Input should be at least 44px high for touch accessibility
            expect(inputBox?.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });

  test.describe('Modern Design System Components', () => {
    
    test('should render UnifiedTabs responsively', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.goto(ROUTES.ROLES);
      
      await page.waitForLoadState('networkidle');
      
      // Check if tabs render properly on mobile
      const tabs = page.locator('.ant-tabs, .unified-tabs');
      if (await tabs.isVisible()) {
        // Tabs should be visible and scrollable if needed
        const tabNav = page.locator('.ant-tabs-nav');
        await expect(tabNav).toBeVisible();
        
        // Check if tab content is accessible
        const tabPane = page.locator('.ant-tabs-tabpane');
        if (await tabPane.isVisible()) {
          await expect(tabPane).toBeVisible();
        }
      }
    });

    test('should handle TableActionButton responsively', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.goto(ROUTES.PAYROLL_RUNS);
      
      await page.waitForLoadState('networkidle');
      
      // Check if action buttons are properly sized and accessible
      const actionButtons = page.locator('.action-button, .table-action-button');
      
      if (await actionButtons.count() > 0) {
        const firstButton = actionButtons.first();
        const buttonBox = await firstButton.boundingBox();
        
        if (buttonBox) {
          // Action buttons should meet minimum touch target size
          expect(buttonBox.height).toBeGreaterThanOrEqual(44);
          expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        }
        
        // Test button interaction
        await firstButton.hover();
        await page.waitForTimeout(500);
        
        // Tooltip should be visible on hover
        const tooltip = page.locator('.ant-tooltip');
        // Note: Tooltips might not show on mobile, so we don't assert they must be visible
      }
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    
    test('should render consistently across browsers', async ({ page, browserName }) => {
      await page.setViewportSize(VIEWPORTS.DESKTOP);
      await page.goto(ROUTES.SIMPLE_PAYROLL);
      
      await page.waitForLoadState('networkidle');
      
      // Check key elements render in all browsers
      const pageTitle = page.locator('h1, .page-title, .ant-typography-title');
      await expect(pageTitle.first()).toBeVisible();
      
      const cards = page.locator('.modern-card, .ant-card');
      await expect(cards.first()).toBeVisible();
      
      // Take browser-specific screenshot
      await page.screenshot({ 
        path: `test-results/simple-payroll-${browserName}.png`,
        fullPage: true 
      });
    });
  });

  test.describe('Performance and Loading', () => {
    
    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(ROUTES.SIMPLE_PAYROLL);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      // Check if key interactive elements are present
      const interactiveElements = page.locator('button, input, a[href]');
      expect(await interactiveElements.count()).toBeGreaterThan(0);
    });
  });
});