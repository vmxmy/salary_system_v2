/**
 * React 警告抑制工具
 * 专门处理 React 内部的警告和错误
 */

// 保存原始方法
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

/**
 * 初始化 React 警告抑制
 */
export function initReactWarningSuppress() {
  // 拦截所有 console.warn 调用
  console.warn = function(message?: any, ...optionalParams: any[]) {
    const fullMessage = [message, ...optionalParams].join(' ');
    
    // 检查是否是需要抑制的警告
    if (typeof message === 'string' &&
        (message.includes('findDOMNode') ||
         fullMessage.includes('findDOMNode') ||
         message.includes('Warning: findDOMNode') ||
         // 抑制 destroyOnClose 弃用警告
         message.includes('destroyOnClose') ||
         message.includes('destroyOnHidden') ||
         fullMessage.includes('destroyOnClose') ||
         fullMessage.includes('destroyOnHidden') ||
         // 抑制 useForm 未连接到 Form 元素的警告
         message.includes('Instance created by `useForm` is not connected to any Form element') ||
         fullMessage.includes('Instance created by `useForm` is not connected to any Form element'))) {
      // 静默忽略
      return;
    }
    
    // 其他警告正常显示
    originalConsoleWarn.apply(console, [message, ...optionalParams]);
  };

  // 拦截所有 console.error 调用
  console.error = function(message?: any, ...optionalParams: any[]) {
    const fullMessage = [message, ...optionalParams].join(' ');
    
    // 检查是否是需要抑制的错误
    if (typeof message === 'string' && 
        (message.includes('findDOMNode') || 
         fullMessage.includes('findDOMNode') ||
         message.includes('Warning: findDOMNode') ||
         // 抑制 jsx 属性警告
         message.includes('Received `true` for a non-boolean attribute `jsx`') ||
         message.includes('non-boolean attribute `jsx`') ||
         fullMessage.includes('non-boolean attribute `jsx`') ||
         // 抑制 destroyOnClose 弃用警告
         message.includes('destroyOnClose') ||
         message.includes('destroyOnHidden') ||
         fullMessage.includes('destroyOnClose') ||
         fullMessage.includes('destroyOnHidden') ||
         // 抑制 useForm 未连接到 Form 元素的警告
         message.includes('Instance created by `useForm` is not connected to any Form element') ||
         fullMessage.includes('Instance created by `useForm` is not connected to any Form element'))) {
      // 静默忽略
      return;
    }
    
    // 其他错误正常显示
    originalConsoleError.apply(console, [message, ...optionalParams]);
  };

}

/**
 * 恢复原始控制台方法
 */
export function restoreReactConsole() {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
} 