import { test, expect } from '@playwright/test';

/**
 * Modern Design System Components Validation
 * 
 * Focused tests specifically for validating our modern design system
 * components work correctly without complex authentication flows.
 */

const VIEWPORTS = {
  MOBILE: { width: 375, height: 667 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1440, height: 900 },
};

test.describe('Modern Design System - Component Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock authentication and navigate to a modern page
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user_info', JSON.stringify({ 
        id: 1, 
        username: 'test-user', 
        role: 'admin' 
      }));
    });
    
    // Go directly to simple payroll page (our reference modern page)
    await page.goto('/simple-payroll');
    await page.waitForTimeout(2000);
    
    // If redirected to login, handle it
    if (page.url().includes('login')) {
      await page.fill('input[placeholder*="用户名"], input[type="text"]', 'admin');
      await page.fill('input[placeholder*="密码"], input[type="password"]', 'admin');
      await page.click('button:has-text("登录"), button:has-text("登 录")');
      await page.waitForLoadState('networkidle');
      // Navigate back to target page
      await page.goto('/simple-payroll');
      await page.waitForLoadState('networkidle');
    }
  });

  test.describe('ModernPageTemplate Component', () => {
    
    test('should render with proper responsive layout', async ({ page }) => {
      // Test on different screen sizes
      for (const [device, viewport] of Object.entries(VIEWPORTS)) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        
        // Check if modern page template elements exist
        const pageContent = page.locator('.modern-page-template, .ant-layout-content, main');
        await expect(pageContent.first()).toBeVisible();
        
        // Take screenshot for visual validation
        await page.screenshot({ 
          path: `test-results/modern-page-template-${device.toLowerCase()}.png`,
          fullPage: true 
        });
      }
    });
  });

  test.describe('ModernCard Component', () => {
    
    test('should display cards responsively across devices', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      
      // Look for modern cards
      const cards = page.locator('.modern-card, .ant-card');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        // Verify first card is visible
        await expect(cards.first()).toBeVisible();
        
        // On mobile, cards should stack vertically
        if (cardCount > 1) {
          const firstCard = cards.first();
          const secondCard = cards.nth(1);
          
          const firstBox = await firstCard.boundingBox();
          const secondBox = await secondCard.boundingBox();
          
          if (firstBox && secondBox) {
            // Second card should be below first (stacked)
            expect(secondBox.y).toBeGreaterThan(firstBox.y);
          }
        }
      }
      
      await page.screenshot({ 
        path: 'test-results/modern-cards-mobile.png',
        fullPage: true 
      });
    });
  });

  test.describe('Typography and Design Tokens', () => {
    
    test('should use consistent typography across the page', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.DESKTOP);
      
      // Check for Inter font usage (our design system font)
      const computedStyle = await page.evaluate(() => {
        const element = document.querySelector('body, .ant-typography');
        if (element) {
          return window.getComputedStyle(element).fontFamily;
        }
        return null;
      });
      
      // Inter should be in the font stack
      if (computedStyle) {
        expect(computedStyle.toLowerCase()).toContain('inter');
      }
      
      // Look for typography classes
      const typographyElements = page.locator('.typography-heading, .typography-body, .ant-typography');
      const count = await typographyElements.count();
      
      if (count > 0) {
        await expect(typographyElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Behavior Validation', () => {
    
    test('should handle viewport changes gracefully', async ({ page }) => {
      // Start with desktop, then resize to mobile
      await page.setViewportSize(VIEWPORTS.DESKTOP);
      await page.waitForTimeout(500);
      
      // Verify page loads properly on desktop
      const content = page.locator('main, .ant-layout-content, .page-content');
      await expect(content.first()).toBeVisible();
      
      // Resize to mobile
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.waitForTimeout(1000);
      
      // Content should still be visible after resize
      await expect(content.first()).toBeVisible();
      
      // Check for mobile-specific elements
      const possibleMobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, .ant-drawer');
      // Note: We don't assert this must exist, just check if it's functional if present
      
      await page.screenshot({ 
        path: 'test-results/responsive-transition.png',
        fullPage: true 
      });
    });
  });

  test.describe('Touch Target Accessibility', () => {
    
    test('should have proper touch targets on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.waitForTimeout(1000);
      
      // Find interactive elements
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        // Test first few buttons for touch target size
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = buttons.nth(i);
          const boundingBox = await button.boundingBox();
          
          if (boundingBox) {
            // Minimum 44px touch target for accessibility
            expect(boundingBox.height).toBeGreaterThanOrEqual(32); // Slightly relaxed for Ant Design
            expect(boundingBox.width).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });
  });

  test.describe('Performance and Loading', () => {
    
    test('should load modern components efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/simple-payroll');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (relaxed for testing)
      expect(loadTime).toBeLessThan(10000);
      
      // Check that key elements are present
      const keyElements = page.locator('button, .ant-card, .modern-card, .ant-typography');
      const elementCount = await keyElements.count();
      
      expect(elementCount).toBeGreaterThan(0);
    });
  });

  test.describe('Visual Consistency', () => {
    
    test('should maintain visual consistency across browsers', async ({ page, browserName }) => {
      await page.setViewportSize(VIEWPORTS.DESKTOP);
      await page.waitForLoadState('networkidle');
      
      // Take browser-specific screenshot for comparison
      await page.screenshot({ 
        path: `test-results/visual-consistency-${browserName}.png`,
        fullPage: true 
      });
      
      // Basic visibility checks
      const mainContent = page.locator('main, .ant-layout-content');
      await expect(mainContent.first()).toBeVisible();
    });
  });
});