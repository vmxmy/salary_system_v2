/**
 * API性能监控工具
 * 用于监控和记录API请求的性能指标
 */

interface ApiPerformanceMetric {
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  size?: number;
  error?: string;
}

class ApiPerformanceMonitor {
  private metrics: ApiPerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // 最多保存1000条记录
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 慢请求阈值：1秒
  private readonly VERY_SLOW_REQUEST_THRESHOLD = 3000; // 极慢请求阈值：3秒

  /**
   * 记录API请求指标
   */
  recordMetric(metric: ApiPerformanceMetric) {
    this.metrics.push(metric);
    
    // 保持数组大小在限制内
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
    
    // 在开发环境下记录慢请求
    if (import.meta.env.DEV) {
      this.logSlowRequests(metric);
    }
  }

  /**
   * 记录慢请求
   */
  private logSlowRequests(metric: ApiPerformanceMetric) {
    const { url, method, duration, status } = metric;
    
    if (duration > this.VERY_SLOW_REQUEST_THRESHOLD) {
      console.warn(
        `🐌 极慢请求: ${method} ${url} - ${duration.toFixed(2)}ms (状态: ${status})`
      );
    } else if (duration > this.SLOW_REQUEST_THRESHOLD) {
      console.warn(
        `⚠️ 慢请求警告: ${method} ${url} - ${duration.toFixed(2)}ms (状态: ${status})`
      );
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const durations = this.metrics.map(m => m.duration);
    const slowRequests = this.metrics.filter(m => m.duration > this.SLOW_REQUEST_THRESHOLD);
    const verySlowRequests = this.metrics.filter(m => m.duration > this.VERY_SLOW_REQUEST_THRESHOLD);
    
    // 按URL分组统计
    const urlStats = this.metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.url}`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxDuration: 0,
          minDuration: Infinity,
        };
      }
      
      const stat = acc[key];
      stat.count++;
      stat.totalDuration += metric.duration;
      stat.avgDuration = stat.totalDuration / stat.count;
      stat.maxDuration = Math.max(stat.maxDuration, metric.duration);
      stat.minDuration = Math.min(stat.minDuration, metric.duration);
      
      return acc;
    }, {} as Record<string, any>);

    return {
      totalRequests: this.metrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      slowRequestsCount: slowRequests.length,
      verySlowRequestsCount: verySlowRequests.length,
      slowRequestsPercentage: (slowRequests.length / this.metrics.length) * 100,
      urlStats,
      recentSlowRequests: slowRequests.slice(-10), // 最近10个慢请求
    };
  }

  /**
   * 获取最慢的请求
   */
  getSlowestRequests(limit = 10) {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * 清除所有指标
   */
  clearMetrics() {
    this.metrics = [];
    console.log('📊 API性能指标已清除');
  }

  /**
   * 导出性能报告
   */
  exportReport() {
    const stats = this.getPerformanceStats();
    const slowestRequests = this.getSlowestRequests();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: stats,
      slowestRequests,
      recommendations: this.generateRecommendations(stats),
    };
    
    console.log('📊 API性能报告:', report);
    return report;
  }

  /**
   * 生成性能优化建议
   */
  private generateRecommendations(stats: any) {
    const recommendations = [];
    
    if (stats?.slowRequestsPercentage > 20) {
      recommendations.push('超过20%的请求响应较慢，建议检查后端性能或网络状况');
    }
    
    if (stats?.verySlowRequestsCount > 0) {
      recommendations.push('存在极慢请求，建议优先优化这些接口');
    }
    
    if (stats?.averageDuration > 500) {
      recommendations.push('平均响应时间超过500ms，建议实施缓存策略');
    }
    
    // 分析URL统计，找出最慢的接口
    if (stats?.urlStats) {
      const slowestUrls = Object.entries(stats.urlStats)
        .sort(([,a]: any, [,b]: any) => b.avgDuration - a.avgDuration)
        .slice(0, 3);
      
      if (slowestUrls.length > 0) {
        recommendations.push(
          `最慢的接口: ${slowestUrls.map(([url, stat]: any) => 
            `${url} (平均${stat.avgDuration.toFixed(2)}ms)`
          ).join(', ')}`
        );
      }
    }
    
    return recommendations;
  }
}

// 创建全局实例
export const apiPerformanceMonitor = new ApiPerformanceMonitor();

/**
 * Axios拦截器辅助函数
 */
export const createPerformanceInterceptors = () => {
  return {
    request: (config: any) => {
      config.metadata = { startTime: Date.now() };
      return config;
    },
    
    response: (response: any) => {
      const endTime = Date.now();
      const startTime = response.config.metadata?.startTime || endTime;
      const duration = endTime - startTime;
      
      apiPerformanceMonitor.recordMetric({
        url: response.config.url || '',
        method: (response.config.method || '').toUpperCase(),
        startTime,
        endTime,
        duration,
        status: response.status,
        size: JSON.stringify(response.data).length,
      });
      
      return response;
    },
    
    error: (error: any) => {
      const endTime = Date.now();
      const startTime = error.config?.metadata?.startTime || endTime;
      const duration = endTime - startTime;
      
      apiPerformanceMonitor.recordMetric({
        url: error.config?.url || '',
        method: (error.config?.method || '').toUpperCase(),
        startTime,
        endTime,
        duration,
        status: error.response?.status || 0,
        error: error.message,
      });
      
      return Promise.reject(error);
    },
  };
};

// 在开发环境下，将监控器暴露到全局，方便调试
if (import.meta.env.DEV) {
  (window as any).apiPerformanceMonitor = apiPerformanceMonitor;
  console.log('📊 API性能监控器已启用，可通过 window.apiPerformanceMonitor 访问');
} 