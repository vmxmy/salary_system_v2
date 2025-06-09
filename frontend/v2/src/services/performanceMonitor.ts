/**
 * 🚀 API性能监控服务
 * 实时追踪优化接口的性能表现和降级情况
 */

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  optimized: boolean; // 是否使用了优化接口
  fallback: boolean;  // 是否发生了降级
  error?: string;
  responseSize?: number;
  timestamp: string;
}

export interface PerformanceStats {
  totalRequests: number;
  optimizedRequests: number;
  fallbackRequests: number;
  averageResponseTime: number;
  optimizedAverageTime: number;
  fallbackAverageTime: number;
  successRate: number;
  optimizationRate: number;
  fallbackRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // 最多保存1000条记录
  private listeners: ((metric: PerformanceMetric) => void)[] = [];

  /**
   * 开始监控一个API请求
   */
  startRequest(endpoint: string, method: string = 'GET'): string {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    // 存储请求开始信息
    (window as any).__performanceRequests = (window as any).__performanceRequests || {};
    (window as any).__performanceRequests[requestId] = {
      endpoint,
      method,
      startTime,
      timestamp: new Date().toISOString()
    };
    
    return requestId;
  }

  /**
   * 结束监控一个API请求
   */
  endRequest(
    requestId: string, 
    success: boolean, 
    optimized: boolean = false, 
    fallback: boolean = false,
    error?: string,
    responseSize?: number
  ): void {
    const requests = (window as any).__performanceRequests || {};
    const requestInfo = requests[requestId];
    
    if (!requestInfo) {
      console.warn('⚠️ 性能监控: 找不到请求信息', requestId);
      return;
    }
    
    const endTime = performance.now();
    const duration = endTime - requestInfo.startTime;
    
    const metric: PerformanceMetric = {
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      startTime: requestInfo.startTime,
      endTime,
      duration,
      success,
      optimized,
      fallback,
      error,
      responseSize,
      timestamp: requestInfo.timestamp
    };
    
    this.addMetric(metric);
    
    // 清理请求信息
    delete requests[requestId];
  }

  /**
   * 添加性能指标
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // 保持最大记录数限制
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // 通知监听器
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (error) {
        console.error('性能监控监听器错误:', error);
      }
    });
    
    // 控制台输出性能信息
    this.logPerformance(metric);
  }

  /**
   * 输出性能日志
   */
  private logPerformance(metric: PerformanceMetric): void {
    const { endpoint, duration, success, optimized, fallback, error } = metric;
    
    let emoji = '📊';
    let level = 'info';
    
    if (!success) {
      emoji = '❌';
      level = 'error';
    } else if (fallback) {
      emoji = '⚠️';
      level = 'warn';
    } else if (optimized) {
      emoji = '🚀';
      level = 'info';
    }
    
    const message = `${emoji} API性能 ${endpoint} | ${duration.toFixed(2)}ms | ${optimized ? '优化' : '原始'}${fallback ? ' (降级)' : ''}`;
    
    if (level === 'error') {
      console.error(message, error);
    } else if (level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }

  /**
   * 获取性能统计信息
   */
  getStats(timeRange?: number): PerformanceStats {
    let filteredMetrics = this.metrics;
    
    // 如果指定了时间范围，过滤指标
    if (timeRange) {
      const cutoffTime = Date.now() - timeRange;
      filteredMetrics = this.metrics.filter(m => 
        new Date(m.timestamp).getTime() > cutoffTime
      );
    }
    
    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        optimizedRequests: 0,
        fallbackRequests: 0,
        averageResponseTime: 0,
        optimizedAverageTime: 0,
        fallbackAverageTime: 0,
        successRate: 0,
        optimizationRate: 0,
        fallbackRate: 0
      };
    }
    
    const totalRequests = filteredMetrics.length;
    const successfulRequests = filteredMetrics.filter(m => m.success).length;
    const optimizedRequests = filteredMetrics.filter(m => m.optimized).length;
    const fallbackRequests = filteredMetrics.filter(m => m.fallback).length;
    
    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    const optimizedDuration = filteredMetrics
      .filter(m => m.optimized)
      .reduce((sum, m) => sum + m.duration, 0);
    const fallbackDuration = filteredMetrics
      .filter(m => m.fallback)
      .reduce((sum, m) => sum + m.duration, 0);
    
    return {
      totalRequests,
      optimizedRequests,
      fallbackRequests,
      averageResponseTime: totalDuration / totalRequests,
      optimizedAverageTime: optimizedRequests > 0 ? optimizedDuration / optimizedRequests : 0,
      fallbackAverageTime: fallbackRequests > 0 ? fallbackDuration / fallbackRequests : 0,
      successRate: (successfulRequests / totalRequests) * 100,
      optimizationRate: (optimizedRequests / totalRequests) * 100,
      fallbackRate: (fallbackRequests / totalRequests) * 100
    };
  }

  /**
   * 获取最近的性能指标
   */
  getRecentMetrics(count: number = 10): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * 按端点分组的性能统计
   */
  getStatsByEndpoint(): Record<string, PerformanceStats> {
    const groupedMetrics: Record<string, PerformanceMetric[]> = {};
    
    this.metrics.forEach(metric => {
      if (!groupedMetrics[metric.endpoint]) {
        groupedMetrics[metric.endpoint] = [];
      }
      groupedMetrics[metric.endpoint].push(metric);
    });
    
    const stats: Record<string, PerformanceStats> = {};
    
    Object.entries(groupedMetrics).forEach(([endpoint, metrics]) => {
      const totalRequests = metrics.length;
      const successfulRequests = metrics.filter(m => m.success).length;
      const optimizedRequests = metrics.filter(m => m.optimized).length;
      const fallbackRequests = metrics.filter(m => m.fallback).length;
      
      const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
      const optimizedDuration = metrics
        .filter(m => m.optimized)
        .reduce((sum, m) => sum + m.duration, 0);
      const fallbackDuration = metrics
        .filter(m => m.fallback)
        .reduce((sum, m) => sum + m.duration, 0);
      
      stats[endpoint] = {
        totalRequests,
        optimizedRequests,
        fallbackRequests,
        averageResponseTime: totalDuration / totalRequests,
        optimizedAverageTime: optimizedRequests > 0 ? optimizedDuration / optimizedRequests : 0,
        fallbackAverageTime: fallbackRequests > 0 ? fallbackDuration / fallbackRequests : 0,
        successRate: (successfulRequests / totalRequests) * 100,
        optimizationRate: (optimizedRequests / totalRequests) * 100,
        fallbackRate: (fallbackRequests / totalRequests) * 100
      };
    });
    
    return stats;
  }

  /**
   * 添加性能监听器
   */
  addListener(listener: (metric: PerformanceMetric) => void): () => void {
    this.listeners.push(listener);
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 清除所有性能数据
   */
  clear(): void {
    this.metrics = [];
    (window as any).__performanceRequests = {};
  }

  /**
   * 导出性能数据
   */
  exportData(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 生成性能报告
   */
  generateReport(timeRange?: number): string {
    const stats = this.getStats(timeRange);
    const endpointStats = this.getStatsByEndpoint();
    
    let report = `
🚀 API性能监控报告
==================

📊 总体统计 (${timeRange ? `最近${timeRange/1000/60}分钟` : '全部时间'})
- 总请求数: ${stats.totalRequests}
- 成功率: ${stats.successRate.toFixed(1)}%
- 平均响应时间: ${stats.averageResponseTime.toFixed(2)}ms
- 优化接口使用率: ${stats.optimizationRate.toFixed(1)}%
- 降级率: ${stats.fallbackRate.toFixed(1)}%

🚀 优化效果
- 优化接口平均响应时间: ${stats.optimizedAverageTime.toFixed(2)}ms
- 降级接口平均响应时间: ${stats.fallbackAverageTime.toFixed(2)}ms
- 性能提升: ${stats.fallbackAverageTime > 0 ? (stats.fallbackAverageTime / stats.optimizedAverageTime).toFixed(1) + '倍' : 'N/A'}

📈 各端点详细统计
`;

    Object.entries(endpointStats)
      .sort(([,a], [,b]) => b.totalRequests - a.totalRequests)
      .forEach(([endpoint, stat]) => {
        report += `
${endpoint}:
  - 请求数: ${stat.totalRequests}
  - 平均响应时间: ${stat.averageResponseTime.toFixed(2)}ms
  - 优化率: ${stat.optimizationRate.toFixed(1)}%
  - 降级率: ${stat.fallbackRate.toFixed(1)}%
`;
      });

    return report;
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 在开发环境下暴露到全局对象，方便调试
if (process.env.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor;
}

/**
 * 性能监控装饰器，用于自动监控API调用
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  endpoint: string,
  method: string = 'GET',
  optimized: boolean = false
): T {
  return (async (...args: any[]) => {
    const requestId = performanceMonitor.startRequest(endpoint, method);
    
    try {
      const result = await fn(...args);
      performanceMonitor.endRequest(requestId, true, optimized, false);
      return result;
    } catch (error) {
      const isOptimizedError = error instanceof Error && error.message.includes('优化接口');
      performanceMonitor.endRequest(
        requestId, 
        false, 
        optimized && !isOptimizedError, 
        isOptimizedError,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }) as T;
} 