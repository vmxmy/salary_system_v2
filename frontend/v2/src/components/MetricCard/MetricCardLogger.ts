// 指标卡片日志工具
export class MetricCardLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static info(component: string, message: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`[MetricCard/${component}] ${message}`, data || '');
    }
  }

  static warn(component: string, message: string, data?: any) {
    console.warn(`[MetricCard/${component}] ${message}`, data || '');
  }

  static error(component: string, message: string, error?: any) {
    console.error(`[MetricCard/${component}] ${message}`, error || '');
  }

  static group(component: string, title: string) {
    if (this.isDevelopment) {
      console.group(`[MetricCard/${component}] ${title}`);
    }
  }

  static groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  // 数据验证日志
  static validateData(component: string, dataName: string, data: any, expected: any) {
    if (this.isDevelopment) {
      const isValid = Array.isArray(data) ? data.length > 0 : data != null;
      if (!isValid) {
        this.warn(component, `数据验证失败: ${dataName}`, {
          received: data,
          expected,
          type: typeof data
        });
      } else {
        this.info(component, `数据验证通过: ${dataName}`, {
          count: Array.isArray(data) ? data.length : 1,
          type: typeof data
        });
      }
    }
  }

  // 性能监控
  static performance(component: string, operation: string, startTime: number) {
    if (this.isDevelopment) {
      const duration = performance.now() - startTime;
      if (duration > 100) { // 超过100ms记录
        this.warn(component, `性能警告: ${operation} 耗时 ${duration.toFixed(2)}ms`);
      } else {
        this.info(component, `性能正常: ${operation} 耗时 ${duration.toFixed(2)}ms`);
      }
    }
  }
}