import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * 
 * Tests login functionality and authenticated page access
 */

test.describe('Authentication Flow', () => {
  
  test('should login successfully with correct credentials', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Wait for page to load and check if we're on login page
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    if (currentUrl.includes('login') || await page.getByRole('textbox', { name: /用户名/ }).isVisible()) {
      // Fill in login credentials using accessible labels
      await page.getByRole('textbox', { name: /用户名/ }).fill('admin');
      await page.getByRole('textbox', { name: /密码/ }).fill('admin');
      
      // Click login button
      await page.getByRole('button', { name: '登 录' }).click();
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Verify we're no longer on login page
      const newUrl = page.url();
      expect(newUrl).not.toContain('login');
      
      // Look for authenticated content
      const authenticatedContent = page.locator('.ant-layout, main, .app-content');
      await expect(authenticatedContent.first()).toBeVisible();
      
      console.log('Login successful, current URL:', newUrl);
    } else {
      console.log('Already authenticated or no login required');
    }
  });

  test('should access SimplePayroll page after authentication', async ({ page }) => {
    // Navigate and login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Handle login if needed
    const currentUrl = page.url();
    if (currentUrl.includes('login') || await page.getByRole('textbox', { name: /用户名/ }).isVisible()) {
      await page.getByRole('textbox', { name: /用户名/ }).fill('admin');
      await page.getByRole('textbox', { name: /密码/ }).fill('admin');
      await page.getByRole('button', { name: '登 录' }).click();
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to SimplePayroll page
    await page.goto('/simple-payroll');
    await page.waitForLoadState('networkidle');
    
    // Verify we can access the page
    const pageContent = page.locator('main, .ant-layout-content, .page-content');
    await expect(pageContent.first()).toBeVisible();
    
    // Take screenshot for verification
    await page.screenshot({ 
      path: 'test-results/simple-payroll-authenticated.png',
      fullPage: true 
    });
    
    console.log('SimplePayroll page accessible:', page.url());
  });

  test('should access multiple pages after authentication', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('login') || await page.getByRole('textbox', { name: /用户名/ }).isVisible()) {
      await page.getByRole('textbox', { name: /用户名/ }).fill('admin');
      await page.getByRole('textbox', { name: /密码/ }).fill('admin');
      await page.getByRole('button', { name: '登 录' }).click();
      await page.waitForLoadState('networkidle');
    }
    
    // Test multiple pages
    const pages = [
      '/simple-payroll',
      '/payroll/runs',
      '/hr/employees',
      '/admin/users'
    ];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check if page loads without login redirect
      const url = page.url();
      expect(url).not.toContain('login');
      
      // Look for page content
      const content = page.locator('main, .ant-layout-content, .page-content, .modern-page-template');
      await expect(content.first()).toBeVisible();
      
      console.log(`✓ Page accessible: ${pagePath}`);
    }
  });
});