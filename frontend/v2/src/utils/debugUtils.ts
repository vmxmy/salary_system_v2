/**
 * React Developer Tools 辅助调试工具
 * 配合React DevTools使用，提供更详细的渲染追踪信息
 */

import { useRef, useEffect } from 'react';

// 开发环境下的调试工具
export const isDev = process.env.NODE_ENV === 'development';

/**
 * 组件渲染追踪Hook
 * 在React DevTools Profiler中显示详细的渲染信息
 */
export const useRenderTrace = (
  componentName: string,
  props?: Record<string, any>,
  options: {
    logRenders?: boolean;
    logProps?: boolean;
    logTimings?: boolean;
  } = {}
) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const propsRef = useRef(props);
  
  const {
    logRenders = isDev,
    logProps = false,
    logTimings = false
  } = options;

  // 追踪渲染次数和时间
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (logRenders) {
      console.log(`🔄 [RenderTrace] ${componentName} render #${renderCount.current}`, {
        timeSinceLastRender: `${timeSinceLastRender}ms`
      });
    }

    if (logTimings && timeSinceLastRender < 100) {
      console.warn(`⚡ [RenderTrace] ${componentName} 快速重渲染! 间隔: ${timeSinceLastRender}ms`);
    }
  }, [componentName, logRenders, logTimings]);

  // 追踪Props变化
  useEffect(() => {
    if (logProps && props) {
      const prevProps = propsRef.current;
      const changedProps: Record<string, { prev: any; curr: any }> = {};
      
      if (prevProps) {
        Object.keys({ ...prevProps, ...props }).forEach(key => {
          if (prevProps[key] !== props[key]) {
            changedProps[key] = {
              prev: prevProps[key],
              curr: props[key]
            };
          }
        });

        if (Object.keys(changedProps).length > 0) {
          console.log(`📝 [RenderTrace] ${componentName} props changed:`, changedProps);
        }
      }
      
      propsRef.current = props;
    }
  }, [props, logProps, componentName]);

  return {
    renderCount: renderCount.current,
    componentName
  };
};

/**
 * Hook依赖追踪
 * 帮助识别导致Hook重复执行的依赖项
 */
export const useDependencyTrace = (
  hookName: string,
  dependencies: any[],
  options: {
    logChanges?: boolean;
    warnOnFrequentChanges?: boolean;
  } = {}
) => {
  const dependenciesRef = useRef<any[]>([]);
  const changeCountRef = useRef(0);
  const lastChangeTimeRef = useRef(Date.now());
  
  const {
    logChanges = isDev,
    warnOnFrequentChanges = true
  } = options;

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTimeRef.current;
    
    if (dependenciesRef.current.length > 0) {
      const changedIndices: number[] = [];
      dependencies.forEach((dep, index) => {
        if (dep !== dependenciesRef.current[index]) {
          changedIndices.push(index);
        }
      });

      if (changedIndices.length > 0) {
        changeCountRef.current += 1;
        lastChangeTimeRef.current = now;

        if (logChanges) {
          console.log(`🔗 [DependencyTrace] ${hookName} dependencies changed:`, {
            changedIndices,
            changeCount: changeCountRef.current,
            timeSinceLastChange: `${timeSinceLastChange}ms`
          });
        }

        if (warnOnFrequentChanges && timeSinceLastChange < 100) {
          console.warn(`⚠️ [DependencyTrace] ${hookName} 依赖项频繁变化! 间隔: ${timeSinceLastChange}ms`);
        }
      }
    }
    
    dependenciesRef.current = [...dependencies];
  }, dependencies);

  return {
    changeCount: changeCountRef.current,
    hookName
  };
};

/**
 * 性能监控Hook
 * 测量组件渲染性能
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef(0);
  const renderEndTime = useRef(0);
  
  // 渲染开始时间
  renderStartTime.current = performance.now();
  
  useEffect(() => {
    // 渲染结束时间
    renderEndTime.current = performance.now();
    const renderDuration = renderEndTime.current - renderStartTime.current;
    
    if (isDev) {
      // 在React DevTools Profiler中可见的性能标记
      performance.mark(`${componentName}-render-start`);
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
      
      if (renderDuration > 16) { // 超过一帧的时间
        console.warn(`🐌 [Performance] ${componentName} 渲染时间: ${renderDuration.toFixed(2)}ms`);
      }
    }
  }, [componentName]);

  return {
    componentName,
    getCurrentRenderDuration: () => performance.now() - renderStartTime.current
  };
};

/**
 * 全局调试状态管理
 * 在window对象上暴露调试信息
 */
class DebugManager {
  private readonly componentStats = new Map<string, {
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
    propsChanges: number;
  }>();

  updateComponentStats(componentName: string, renderTime: number) {
    const existing = this.componentStats.get(componentName) || {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      propsChanges: 0
    };

    const newStats = {
      ...existing,
      renderCount: existing.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime: (existing.averageRenderTime * existing.renderCount + renderTime) / (existing.renderCount + 1)
    };

    this.componentStats.set(componentName, newStats);
  }

  getStats() {
    return Object.fromEntries(this.componentStats.entries());
  }

  getTopSlowComponents(limit = 5) {
    return Array.from(this.componentStats.entries())
      .sort(([,a], [,b]) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, limit);
  }

  getMostActiveComponents(limit = 5) {
    return Array.from(this.componentStats.entries())
      .sort(([,a], [,b]) => b.renderCount - a.renderCount)
      .slice(0, limit);
  }

  reset() {
    this.componentStats.clear();
  }
}

export const debugManager = new DebugManager();

// 在开发环境下暴露到全局
if (isDev && typeof window !== 'undefined') {
  (window as any).__RENDER_DEBUG__ = {
    getStats: () => debugManager.getStats(),
    getTopSlow: (limit?: number) => debugManager.getTopSlowComponents(limit),


    // 辅助函数
    highlightComponent: (componentName: string) => {
      console.log(`🎯 [Debug] 正在监控组件: ${componentName}`);
      // 这里可以添加实际的高亮逻辑
    },
    
    monitorProps: (componentName: string) => {
      console.log(`👀 [Debug] 开始监控 ${componentName} 的 Props 变化`);
      // 实际的Props监控逻辑
    }
  };
  
  console.log('🔧 [DevTools] 调试工具已加载到 window.__RENDER_DEBUG__');
  console.log('可用命令:', {
    'window.__RENDER_DEBUG__.getStats()': '获取所有组件统计',
    'window.__RENDER_DEBUG__.getTopSlow()': '获取最慢的组件',
    'window.__RENDER_DEBUG__.getMostActive()': '获取渲染最频繁的组件'
  });
}

/**
 * React DevTools 集成辅助函数
 */
export const enableReactDevToolsIntegration = () => {
  if (isDev && typeof window !== 'undefined') {
    // 启用详细的Profiler信息
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook) {
      hook.settings = {
        ...hook.settings,
        recordWhy: true,
        recordTimings: true,
        recordInteractions: true
      };
      console.log('✅ [DevTools] React DevTools 详细模式已启用');
    }
  }
};

// 在开发环境下自动启用React DevTools集成
if (isDev) {
  enableReactDevToolsIntegration();
}