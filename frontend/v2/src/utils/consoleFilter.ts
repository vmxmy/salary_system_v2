import i18n from '../i18n';

/**
 * 控制台过滤工具
 * 用于在开发环境中过滤特定的警告和错误信息
 */

interface ConsoleFilterConfig {
  /** 要过滤的警告关键词列表 */
  warningFilters: string[];
  /** 要过滤的错误关键词列表 */
  errorFilters: string[];
  /** 是否启用过滤（默认仅在开发环境启用） */
  enabled?: boolean;
}

const defaultConfig: ConsoleFilterConfig = {
  warningFilters: [
    'findDOMNode is deprecated',
    'componentWillReceiveProps has been renamed',
    'componentWillMount has been renamed',
  ],
  errorFilters: [],
  enabled: import.meta.env.DEV,
};

/**
 * 初始化控制台过滤器
 */
export function initConsoleFilter(config: Partial<ConsoleFilterConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.enabled) {
    return;
  }

  // 过滤 console.warn
  if (finalConfig.warningFilters.length > 0) {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      const shouldFilter = finalConfig.warningFilters.some(filter => 
        message.includes(filter)
      );
      
      if (!shouldFilter) {
        originalWarn.apply(console, args);
      }
    };
  }

  // 过滤 console.error
  if (finalConfig.errorFilters.length > 0) {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      const shouldFilter = finalConfig.errorFilters.some(filter => 
        message.includes(filter)
      );
      
      if (!shouldFilter) {
        originalError.apply(console, args);
      }
    };
  }
}

/**
 * 恢复原始的控制台方法
 */
export function restoreConsole() {
  // 注意：这个方法只是示例，实际使用中需要保存原始方法的引用
} 