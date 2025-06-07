/**
 * 薪资API性能监控工具
 * 用于对比视图API与原有API的性能差异
 */

interface PerformanceMetric {
  apiName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorMessage?: string;
  dataSize?: number;
  recordCount?: number;
}

export interface PerformanceComparison {
  originalApi: PerformanceMetric;
  viewApi: PerformanceMetric;
  improvement: {
    durationImprovement: number; // 毫秒
    percentageImprovement: number; // 百分比
    dataSizeComparison?: number;
  };
}

class PayrollPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private comparisons: PerformanceComparison[] = [];

  /**
   * 开始监控API调用
   */
  startMonitoring(apiName: string): number {
    const startTime = performance.now();
    console.log(`🔍 [Performance Monitor] Starting monitoring for ${apiName}`);
    return startTime;
  }

  /**
   * 结束监控并记录结果
   */
  endMonitoring(
    apiName: string,
    startTime: number,
    success: boolean,
    data?: any,
    errorMessage?: string
  ): PerformanceMetric {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const metric: PerformanceMetric = {
      apiName,
      startTime,
      endTime,
      duration,
      success,
      errorMessage,
      dataSize: data ? JSON.stringify(data).length : undefined,
      recordCount: Array.isArray(data) ? data.length : (data?.data?.length || 1)
    };

    this.metrics.push(metric);
    
    console.log(`✅ [Performance Monitor] ${apiName} completed in ${duration.toFixed(2)}ms`, {
      success,
      recordCount: metric.recordCount,
      dataSize: metric.dataSize,
      errorMessage
    });

    return metric;
  }

  /**
   * 监控API调用的装饰器函数
   */
  async monitorApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<{ result: T; metric: PerformanceMetric }> {
    const startTime = this.startMonitoring(apiName);
    
    try {
      const result = await apiCall();
      const metric = this.endMonitoring(apiName, startTime, true, result);
      return { result, metric };
    } catch (error: any) {
      const metric = this.endMonitoring(apiName, startTime, false, null, error.message);
      throw error;
    }
  }

  /**
   * 对比两个API的性能
   */
  compareApis(
    originalApiName: string,
    viewApiName: string
  ): PerformanceComparison | null {
    const originalMetric = this.metrics
      .filter(m => m.apiName === originalApiName && m.success)
      .slice(-1)[0]; // 获取最新的成功记录

    const viewMetric = this.metrics
      .filter(m => m.apiName === viewApiName && m.success)
      .slice(-1)[0]; // 获取最新的成功记录

    if (!originalMetric || !viewMetric) {
      console.warn(`⚠️ [Performance Monitor] Cannot compare ${originalApiName} vs ${viewApiName}: missing metrics`);
      return null;
    }

    const durationImprovement = originalMetric.duration - viewMetric.duration;
    const percentageImprovement = ((durationImprovement / originalMetric.duration) * 100);
    
    const comparison: PerformanceComparison = {
      originalApi: originalMetric,
      viewApi: viewMetric,
      improvement: {
        durationImprovement,
        percentageImprovement,
        dataSizeComparison: originalMetric.dataSize && viewMetric.dataSize 
          ? viewMetric.dataSize - originalMetric.dataSize 
          : undefined
      }
    };

    this.comparisons.push(comparison);

    console.log(`📊 [Performance Comparison] ${originalApiName} vs ${viewApiName}:`, {
      originalDuration: `${originalMetric.duration.toFixed(2)}ms`,
      viewDuration: `${viewMetric.duration.toFixed(2)}ms`,
      improvement: `${durationImprovement.toFixed(2)}ms (${percentageImprovement.toFixed(1)}%)`,
      betterPerformance: durationImprovement > 0 ? 'View API' : 'Original API'
    });

    return comparison;
  }

  /**
   * 获取API性能统计
   */
  getApiStats(apiName: string): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  } {
    const apiMetrics = this.metrics.filter(m => m.apiName === apiName);
    const successfulMetrics = apiMetrics.filter(m => m.success);
    
    if (apiMetrics.length === 0) {
      return {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0
      };
    }

    const durations = successfulMetrics.map(m => m.duration);
    
    return {
      totalCalls: apiMetrics.length,
      successfulCalls: successfulMetrics.length,
      failedCalls: apiMetrics.length - successfulMetrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
      minDuration: Math.min(...durations) || 0,
      maxDuration: Math.max(...durations) || 0,
      successRate: (successfulMetrics.length / apiMetrics.length) * 100
    };
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(): {
    summary: Record<string, any>;
    comparisons: PerformanceComparison[];
    recommendations: string[];
  } {
    const apiNames = [...new Set(this.metrics.map(m => m.apiName))];
    const summary: Record<string, any> = {};
    
    apiNames.forEach(apiName => {
      summary[apiName] = this.getApiStats(apiName);
    });

    // 生成建议
    const recommendations: string[] = [];
    
    this.comparisons.forEach(comparison => {
      const { originalApi, viewApi, improvement } = comparison;
      
      if (improvement.percentageImprovement > 20) {
        recommendations.push(
          `🚀 ${viewApi.apiName} 比 ${originalApi.apiName} 性能提升 ${improvement.percentageImprovement.toFixed(1)}%，建议优先使用视图API`
        );
      } else if (improvement.percentageImprovement < -10) {
        recommendations.push(
          `⚠️ ${viewApi.apiName} 比 ${originalApi.apiName} 性能下降 ${Math.abs(improvement.percentageImprovement).toFixed(1)}%，需要优化视图查询`
        );
      } else {
        recommendations.push(
          `✅ ${viewApi.apiName} 与 ${originalApi.apiName} 性能相近，可以安全切换`
        );
      }
    });

    // 添加通用建议
    if (recommendations.length === 0) {
      recommendations.push('📝 建议进行更多的API性能对比测试以获得准确的性能数据');
    }

    return {
      summary,
      comparisons: this.comparisons,
      recommendations
    };
  }

  /**
   * 清除所有监控数据
   */
  clearMetrics(): void {
    this.metrics = [];
    this.comparisons = [];
    console.log('🧹 [Performance Monitor] All metrics cleared');
  }

  /**
   * 导出监控数据
   */
  exportMetrics(): {
    timestamp: string;
    metrics: PerformanceMetric[];
    comparisons: PerformanceComparison[];
  } {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      comparisons: this.comparisons
    };
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PayrollPerformanceMonitor();

// 便捷的监控装饰器
export const withPerformanceMonitoring = <T extends any[], R>(
  apiName: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const { result } = await performanceMonitor.monitorApiCall(apiName, () => fn(...args));
    return result;
  };
};

// 性能对比工具函数
export const compareApiPerformance = async <T>(
  originalApiName: string,
  viewApiName: string,
  originalApiCall: () => Promise<T>,
  viewApiCall: () => Promise<T>,
  iterations: number = 1
): Promise<{
  originalResults: T[];
  viewResults: T[];
  comparison: PerformanceComparison | null;
}> => {
  console.log(`🔄 [Performance Comparison] Starting ${iterations} iterations of ${originalApiName} vs ${viewApiName}`);
  
  const originalResults: T[] = [];
  const viewResults: T[] = [];

  // 执行多次测试
  for (let i = 0; i < iterations; i++) {
    console.log(`📊 [Performance Comparison] Iteration ${i + 1}/${iterations}`);
    
    // 测试原始API
    const { result: originalResult } = await performanceMonitor.monitorApiCall(
      originalApiName,
      originalApiCall
    );
    originalResults.push(originalResult);

    // 等待一小段时间避免缓存影响
    await new Promise(resolve => setTimeout(resolve, 100));

    // 测试视图API
    const { result: viewResult } = await performanceMonitor.monitorApiCall(
      viewApiName,
      viewApiCall
    );
    viewResults.push(viewResult);

    // 等待一小段时间
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 生成对比报告
  const comparison = performanceMonitor.compareApis(originalApiName, viewApiName);

  return {
    originalResults,
    viewResults,
    comparison
  };
};

export default performanceMonitor; 