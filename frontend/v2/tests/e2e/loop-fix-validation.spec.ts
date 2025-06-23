import { test, expect, Page } from '@playwright/test';

/**
 * React无限循环渲染修复验证测试
 * 验证UniversalDataModal和EmployeeListPageUniversal组件不会出现无限循环渲染
 */

test.describe('React无限循环渲染修复验证', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // 监听控制台错误和警告
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    // 导航到员工管理页面
    await page.goto('/hr/employees/universal');
    await page.waitForLoadState('networkidle');
  });

  test('验证页面加载后组件渲染次数正常', async () => {
    // 等待一段时间让组件稳定
    await page.waitForTimeout(2000);

    // 检查控制台是否有渲染次数异常的警告
    const consoleWarnings = await page.evaluate(() => {
      // 获取全局渲染监控器的统计信息
      const monitor = (window as any).__RENDER_MONITOR__;
      if (!monitor) return { error: 'Render monitor not found' };

      const stats = monitor.getAllStats();
      const excessiveComponents = monitor.getExcessiveComponents();
      
      return {
        totalComponents: stats.length,
        excessiveComponents: excessiveComponents.length,
        stats: stats.map((stat: any) => ({
          componentName: stat.componentName,
          renderCount: stat.totalRenders,
          isExcessive: stat.isExcessive,
          threshold: stat.warningThreshold
        }))
      };
    });

    console.log('渲染监控统计:', consoleWarnings);

    // 验证没有组件出现异常渲染
    expect(consoleWarnings.excessiveComponents).toBe(0);
    
    // 验证主要组件存在且渲染次数合理
    const employeePageStats = consoleWarnings.stats?.find(
      (stat: any) => stat.componentName === 'EmployeeListPageUniversal'
    );
    
    if (employeePageStats) {
      expect(employeePageStats.renderCount).toBeLessThanOrEqual(3);
      expect(employeePageStats.isExcessive).toBe(false);
    }
  });

  test('验证打开UniversalDataModal不会导致无限循环', async () => {
    // 点击高级搜索浏览按钮
    await page.click('button:has-text("高级搜索浏览")');
    
    // 等待Modal打开
    await page.waitForSelector('.ant-modal', { state: 'visible' });
    
    // 等待Modal内容加载完成
    await page.waitForSelector('.ant-table-tbody', { state: 'visible' });
    
    // 等待一段时间让组件稳定
    await page.waitForTimeout(3000);

    // 检查UniversalDataModal的渲染统计
    const modalStats = await page.evaluate(() => {
      const monitor = (window as any).__RENDER_MONITOR__;
      if (!monitor) return null;

      const stats = monitor.getAllStats();
      return stats.find((stat: any) => stat.componentName === 'UniversalDataModal');
    });

    console.log('UniversalDataModal渲染统计:', modalStats);

    if (modalStats) {
      // 验证Modal组件渲染次数合理
      expect(modalStats.totalRenders).toBeLessThanOrEqual(5);
      expect(modalStats.isExcessive).toBe(false);
    }

    // 关闭Modal
    await page.press('body', 'Escape');
    await page.waitForSelector('.ant-modal', { state: 'hidden' });
  });

  test('生成渲染性能报告', async () => {
    // 执行一系列操作来产生渲染统计
    await page.click('button:has-text("高级搜索浏览")');
    await page.waitForSelector('.ant-modal', { state: 'visible' });
    await page.waitForTimeout(1000);

    // 生成性能报告
    const report = await page.evaluate(() => {
      const monitor = (window as any).__RENDER_MONITOR__;
      if (!monitor) return 'Render monitor not available';
      
      return monitor.generateReport();
    });

    console.log('渲染性能报告:');
    console.log(report);

    // 验证报告包含预期内容
    expect(report).toContain('渲染性能报告');
    expect(report).toContain('总计监控组件');
  });
});