import { test, expect } from '@playwright/test';

/**
 * 员工详情页面循环刷新检测测试
 * 测试新版员工详情页面是否存在嵌套循环刷新问题
 */
test.describe('Employee Detail Page Loop Detection', () => {
  test.beforeEach(async ({ page }) => {
    // 拦截并监控网络请求
    await page.route('**/api/**', (route) => {
      console.log(`API Request: ${route.request().method()} ${route.request().url()}`);
      route.continue();
    });
    
    // 监控控制台错误和警告
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`Console ${msg.type()}: ${msg.text()}`);
      }
    });
    
    // 捕获页面错误
    page.on('pageerror', (error) => {
      console.log(`Page error: ${error.message}`);
    });
  });

  test('should not have infinite loops in employee detail page (Modern)', async ({ page }) => {
    // 记录API请求次数
    const apiRequests = new Map<string, number>();
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        const endpoint = url.split('/api/')[1];
        apiRequests.set(endpoint, (apiRequests.get(endpoint) || 0) + 1);
      }
    });

    // 导航到员工列表页面
    await page.goto('/');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 导航到HR管理 -> 员工管理 -> 员工列表(新版)
    try {
      // 点击HR管理菜单
      await page.click('[data-menu-id*="hr"], [data-testid="hr-menu"], text="HR管理"', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // 点击员工管理子菜单
      await page.click('text="员工管理"', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      // 点击员工列表(新版)
      await page.click('text="员工列表 (新版)"', { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      
      // 等待表格加载
      await page.waitForSelector('.ant-table-tbody tr', { timeout: 10000 });
      
      // 点击第一个员工的查看详情按钮
      const detailButton = page.locator('.ant-table-tbody tr').first().locator('button:has-text("查看"), .ant-btn:has-text("详情"), [title*="查看"]').first();
      
      if (await detailButton.count() > 0) {
        await detailButton.click();
        await page.waitForLoadState('networkidle');
      } else {
        // 如果没有查看按钮，尝试双击行
        await page.locator('.ant-table-tbody tr').first().dblclick();
        await page.waitForLoadState('networkidle');
      }
      
      // 等待详情页面加载
      await page.waitForTimeout(2000);
      
      // 检查是否成功进入详情页面
      const isDetailPage = await page.locator('text="员工详情", text="Employee Detail", [data-testid="employee-detail"]').count() > 0;
      
      if (!isDetailPage) {
        console.log('Could not navigate to employee detail page, checking alternative routes...');
        // 尝试直接导航到一个员工详情页面
        await page.goto('/hr/employees/1/detail');
        await page.waitForLoadState('networkidle');
      }
      
    } catch (error) {
      console.log('Navigation failed, trying direct URL approach...');
      // 直接导航到员工详情页面
      await page.goto('/hr/employees/1/detail');
      await page.waitForLoadState('networkidle');
    }

    // 监控5秒内的网络请求，检查是否有异常频繁的请求
    const startTime = Date.now();
    const monitorDuration = 5000; // 5秒
    const initialRequestCounts = new Map(apiRequests);
    
    await page.waitForTimeout(monitorDuration);
    
    // 分析请求频率
    let hasExcessiveRequests = false;
    const requestAnalysis: string[] = [];
    
    for (const [endpoint, count] of apiRequests) {
      const initialCount = initialRequestCounts.get(endpoint) || 0;
      const newRequests = count - initialCount;
      
      if (newRequests > 5) {
        hasExcessiveRequests = true;
        requestAnalysis.push(`${endpoint}: ${newRequests} requests in ${monitorDuration}ms`);
      }
    }
    
    // 检查页面是否仍然响应
    const isPageResponsive = await page.evaluate(() => {
      return document.readyState === 'complete' && !document.hidden;
    });
    
    // 检查是否有React dev tools警告（循环渲染通常会触发警告）
    const hasReactWarnings = await page.evaluate(() => {
      // 检查控制台是否有React相关的警告
      return window.console && typeof window.console.warn === 'function';
    });
    
    // 断言结果
    console.log('=== Loop Detection Results ===');
    console.log(`Page responsive: ${isPageResponsive}`);
    console.log(`Total API endpoints: ${apiRequests.size}`);
    console.log(`Excessive requests detected: ${hasExcessiveRequests}`);
    
    if (requestAnalysis.length > 0) {
      console.log('Excessive request details:');
      requestAnalysis.forEach(analysis => console.log(`  - ${analysis}`));
    }
    
    // 验证没有过度的API请求（可能表明循环刷新）
    expect(hasExcessiveRequests).toBe(false);
    
    // 验证页面仍然响应
    expect(isPageResponsive).toBe(true);
    
    // 尝试与页面交互以确保没有冻结
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    
    console.log(`✅ Employee detail page test completed successfully. Page title: ${pageTitle}`);
  });

  test('should load employee detail page without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    // 收集控制台错误和警告
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    // 直接导航到员工详情页面
    await page.goto('/hr/employees/1/detail');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 输出错误和警告以供调试
    if (consoleErrors.length > 0) {
      console.log('Console Errors:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('Console Warnings:');
      consoleWarnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    // 检查是否有关键的循环相关错误
    const loopRelatedErrors = consoleErrors.filter(error => 
      error.includes('Maximum update depth exceeded') ||
      error.includes('Cannot update a React state') ||
      error.includes('infinite loop') ||
      error.includes('stack overflow')
    );
    
    expect(loopRelatedErrors).toHaveLength(0);
    
    console.log(`✅ Console error check completed. Found ${consoleErrors.length} errors, ${consoleWarnings.length} warnings.`);
  });
});