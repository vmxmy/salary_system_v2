import { useRef, useEffect } from 'react';

export interface RenderCountOptions {
  /** 组件名称，用于日志标识 */
  componentName: string;
  /** 触发警告的渲染次数阈值，默认10次 */
  warningThreshold?: number;
  /** 是否启用控制台日志，默认开发环境启用 */
  enableLogging?: boolean;
  /** 是否启用性能监控，默认开发环境启用 */
  enableProfiling?: boolean;
}

export interface RenderCountResult {
  /** 当前渲染次数 */
  renderCount: number;
  /** 是否超过警告阈值 */
  isExcessive: boolean;
  /** 重置渲染计数器 */
  resetCount: () => void;
  /** 获取渲染统计信息 */
  getStats: () => RenderStats;
}

export interface RenderStats {
  componentName: string;
  totalRenders: number;
  averageRenderTime: number;
  lastRenderTime: number;
  isExcessive: boolean;
  warningThreshold: number;
}

/**
 * React组件渲染次数追踪钩子
 * 用于检测潜在的无限循环渲染问题
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { renderCount, isExcessive } = useRenderCount({
 *     componentName: 'MyComponent',
 *     warningThreshold: 5
 *   });
 * 
 *   if (isExcessive) {
 *     console.warn(`⚠️ ${componentName} 渲染次数过多: ${renderCount}`);
 *   }
 * 
 *   return <div>Render count: {renderCount}</div>;
 * }
 * ```
 */
export const useRenderCount = (options: RenderCountOptions): RenderCountResult => {
  const {
    componentName,
    warningThreshold = 10,
    enableLogging = process.env.NODE_ENV === 'development',
    enableProfiling = process.env.NODE_ENV === 'development'
  } = options;

  // 渲染次数计数器
  const renderCountRef = useRef(0);
  
  // 渲染时间记录
  const renderTimesRef = useRef<number[]>([]);
  
  // 上次警告时间，避免频繁警告
  const lastWarningTimeRef = useRef(0);
  
  // 组件挂载时间
  const mountTimeRef = useRef(Date.now());

  // 每次渲染时递增计数器
  renderCountRef.current += 1;
  const currentRenderCount = renderCountRef.current;

  // 记录渲染时间
  if (enableProfiling) {
    const renderTime = Date.now();
    renderTimesRef.current.push(renderTime);
    
    // 只保留最近20次渲染时间，避免内存泄漏
    if (renderTimesRef.current.length > 20) {
      renderTimesRef.current = renderTimesRef.current.slice(-20);
    }
  }

  // 检查是否超过阈值
  const isExcessive = currentRenderCount > warningThreshold;

  // 使用useEffect来处理副作用，避免在渲染过程中执行
  useEffect(() => {
    if (enableLogging && isExcessive) {
      const now = Date.now();
      // 每秒最多警告一次
      if (now - lastWarningTimeRef.current > 1000) {
        lastWarningTimeRef.current = now;
        
        const renderTimeSpan = now - mountTimeRef.current;
        const avgRenderInterval = renderTimeSpan / currentRenderCount;
        
        console.warn(
          `🔄 [RenderCount] 组件 "${componentName}" 渲染次数异常`,
          {
            renderCount: currentRenderCount,
            threshold: warningThreshold,
            timeSpan: `${renderTimeSpan}ms`,
            avgInterval: `${avgRenderInterval.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          }
        );

        // 如果渲染频率太高（每100ms一次），发出更严重的警告
        if (avgRenderInterval < 100) {
          console.error(
            `💥 [RenderCount] 检测到可能的无限循环! 组件 "${componentName}" 渲染频率过高`,
            {
              avgInterval: `${avgRenderInterval.toFixed(2)}ms`,
              suggestion: '请检查 useEffect、useMemo、useCallback 的依赖数组'
            }
          );
        }
      }
    }
  }, [componentName, currentRenderCount, isExcessive, warningThreshold, enableLogging]);

  // 重置计数器
  const resetCount = (): void => {
    renderCountRef.current = 0;
    renderTimesRef.current = [];
    mountTimeRef.current = Date.now();
    lastWarningTimeRef.current = 0;
  };

  // 获取统计信息
  const getStats = (): RenderStats => {
    const now = Date.now();
    const totalTime = now - mountTimeRef.current;
    const avgRenderTime = renderTimesRef.current.length > 1 
      ? renderTimesRef.current.reduce((sum, time, index) => {
          if (index === 0) return 0;
          return sum + (time - renderTimesRef.current[index - 1]);
        }, 0) / (renderTimesRef.current.length - 1)
      : 0;

    return {
      componentName,
      totalRenders: currentRenderCount,
      averageRenderTime: avgRenderTime,
      lastRenderTime: renderTimesRef.current[renderTimesRef.current.length - 1] || mountTimeRef.current,
      isExcessive,
      warningThreshold
    };
  };

  return {
    renderCount: currentRenderCount,
    isExcessive,
    resetCount,
    getStats
  };
};

/**
 * 全局渲染监控管理器
 * 用于收集和管理多个组件的渲染统计信息
 */
class RenderMonitor {
  private static instance: RenderMonitor;
  private stats: Map<string, RenderStats> = new Map();

  static getInstance(): RenderMonitor {
    if (!RenderMonitor.instance) {
      RenderMonitor.instance = new RenderMonitor();
    }
    return RenderMonitor.instance;
  }

  registerComponent(stats: RenderStats): void {
    this.stats.set(stats.componentName, stats);
  }

  getComponentStats(componentName: string): RenderStats | undefined {
    return this.stats.get(componentName);
  }

  getAllStats(): RenderStats[] {
    return Array.from(this.stats.values());
  }

  getExcessiveComponents(): RenderStats[] {
    return this.getAllStats().filter(stat => stat.isExcessive);
  }

  clearStats(): void {
    this.stats.clear();
  }

  generateReport(): string {
    const allStats = this.getAllStats();
    const excessiveComponents = this.getExcessiveComponents();
    
    let report = '📊 渲染性能报告\n';
    report += `总计监控组件: ${allStats.length}\n`;
    report += `异常渲染组件: ${excessiveComponents.length}\n\n`;
    
    if (excessiveComponents.length > 0) {
      report += '⚠️ 异常渲染组件详情:\n';
      excessiveComponents.forEach(stat => {
        report += `  • ${stat.componentName}: ${stat.totalRenders} 次渲染 (阈值: ${stat.warningThreshold})\n`;
        report += `    平均渲染间隔: ${stat.averageRenderTime.toFixed(2)}ms\n`;
      });
    } else {
      report += '✅ 所有组件渲染正常\n';
    }
    
    return report;
  }
}

export const renderMonitor = RenderMonitor.getInstance();

/**
 * 在组件中使用渲染监控的便捷钩子
 * 自动注册到全局监控器
 */
export const useRenderMonitor = (options: RenderCountOptions): RenderCountResult => {
  const result = useRenderCount(options);
  
  // 定期更新全局监控器 - 修复无限循环：移除result依赖
  const getStatsRef = useRef(result.getStats);
  getStatsRef.current = result.getStats;

  useEffect(() => {
    const interval = setInterval(() => {
      renderMonitor.registerComponent(getStatsRef.current());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []); // 移除result依赖，使用ref保存最新函数引用
  
  return result;
};

// 开发工具：在控制台暴露全局渲染监控器
if (process.env.NODE_ENV === 'development') {
  (window as any).__RENDER_MONITOR__ = renderMonitor;
  console.log('🔧 [DevTools] 全局渲染监控器已挂载到 window.__RENDER_MONITOR__');
}