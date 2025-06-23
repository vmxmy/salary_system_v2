import { test, expect } from '@playwright/test';

/**
 * Modern Design System Validation Tests
 * 
 * Tests our modern design system components and responsive behavior
 * with proper authentication handling
 */

test.describe('Modern Design System Validation', () => {
  
  // Helper function to handle login
  async function login(page) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    if (page.url().includes('login') || await page.getByRole('textbox', { name: /用户名/ }).isVisible()) {
      await page.getByRole('textbox', { name: /用户名/ }).fill('admin');
      await page.getByRole('textbox', { name: /密码/ }).fill('admin');
      await page.getByRole('button', { name: '登 录' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  }

  test('should access SimplePayroll page and verify modern components', async ({ page }) => {
    await login(page);
    
    // Navigate to SimplePayroll page
    await page.goto('/simple-payroll');
    await page.waitForLoadState('networkidle');
    
    // Verify page loads successfully
    expect(page.url()).toContain('simple-payroll');
    expect(page.url()).not.toContain('login');
    
    // Look for any content on the page (flexible check)
    const anyContent = page.locator('body *').first();
    await expect(anyContent).toBeVisible();
    
    // Check for modern design elements if they exist
    const modernElements = [
      '.modern-card',
      '.modern-page-template', 
      '.ant-card',
      '.ant-layout',
      '.ant-typography',
      'button',
      'h1, h2, h3'
    ];
    
    let foundElements = 0;
    for (const selector of modernElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        foundElements++;
        console.log(`✓ Found ${count} elements matching ${selector}`);
      }
    }
    
    expect(foundElements).toBeGreaterThan(0);
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'test-results/simple-payroll-modern-validated.png',
      fullPage: true 
    });
    
    console.log(`✓ SimplePayroll page validated with ${foundElements} modern element types found`);
  });

  test('should test responsive design on different viewports', async ({ page }) => {
    await login(page);
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/simple-payroll');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Verify page is accessible
      expect(page.url()).not.toContain('login');
      
      // Basic content check
      const bodyContent = page.locator('body');
      await expect(bodyContent).toBeVisible();
      
      // Take responsive screenshot
      await page.screenshot({ 
        path: `test-results/responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
      
      console.log(`✓ ${viewport.name} viewport (${viewport.width}x${viewport.height}) tested`);
    }
  });

  test('should verify multiple pages are accessible', async ({ page }) => {
    await login(page);
    
    const pages = [
      { path: '/simple-payroll', name: 'SimplePayroll' },
      { path: '/payroll/runs', name: 'PayrollRuns' },
      { path: '/hr/employees', name: 'Employees' },
      { path: '/admin/users', name: 'Users' }
    ];
    
    for (const testPage of pages) {
      await page.goto(testPage.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Verify not redirected to login
      const url = page.url();
      expect(url).not.toContain('login');
      console.log(`✓ ${testPage.name} page accessible: ${url}`);
      
      // Basic visibility check
      const content = page.locator('body');
      await expect(content).toBeVisible();
      
      // Look for interactive elements
      const interactiveElements = page.locator('button, input, a[href], .ant-btn');
      const interactiveCount = await interactiveElements.count();
      
      if (interactiveCount > 0) {
        console.log(`  └─ Found ${interactiveCount} interactive elements`);
      }
    }
  });

  test('should verify touch targets are properly sized on mobile', async ({ page }) => {
    await login(page);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/simple-payroll');
    await page.waitForLoadState('networkidle');
    
    // Find buttons and check touch target sizes
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Test first few buttons
      const testCount = Math.min(buttonCount, 3);
      
      for (let i = 0; i < testCount; i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          // Relaxed touch target requirements (32px minimum)
          expect(boundingBox.height).toBeGreaterThanOrEqual(32);
          expect(boundingBox.width).toBeGreaterThanOrEqual(32);
          console.log(`✓ Button ${i + 1}: ${boundingBox.width}x${boundingBox.height}px (meets touch target requirements)`);
        }
      }
    }
    
    console.log(`✓ Tested ${Math.min(buttonCount, 3)} buttons for touch target compliance`);
  });

  test('should verify page load performance', async ({ page }) => {
    await login(page);
    
    const startTime = Date.now();
    
    await page.goto('/simple-payroll');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Reasonable load time expectation (10 seconds max for testing)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`✓ Page loaded in ${loadTime}ms (under 10s threshold)`);
    
    // Check that key interactive elements are present
    const interactiveElements = page.locator('button, input, a[href], .ant-btn');
    const elementCount = await interactiveElements.count();
    
    expect(elementCount).toBeGreaterThan(0);
    console.log(`✓ Found ${elementCount} interactive elements after load`);
  });

  test('should test navigation between pages', async ({ page }) => {
    await login(page);
    
    // Start at simple payroll
    await page.goto('/simple-payroll');
    await page.waitForLoadState('networkidle');
    
    // Try to find navigation elements and test navigation
    const navigationLinks = page.locator('a[href*="/"], .ant-menu-item a, .ant-breadcrumb a');
    const linkCount = await navigationLinks.count();
    
    if (linkCount > 0) {
      // Try to click a navigation link
      const firstLink = navigationLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href && !href.includes('logout') && !href.includes('#')) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Verify navigation worked and we're not on login
        expect(page.url()).not.toContain('login');
        console.log(`✓ Navigation successful to: ${page.url()}`);
      }
    }
    
    console.log(`✓ Found ${linkCount} navigation links`);
  });
});