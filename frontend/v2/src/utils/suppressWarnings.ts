/**
 * 抑制特定的 React 和第三方库警告
 */

// 保存原始的控制台方法
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// 要过滤的警告模式列表
const WARNING_PATTERNS = [
  /findDOMNode is deprecated/i,
  /Warning: findDOMNode is deprecated/i,
  /componentWillReceiveProps has been renamed/i,
  /componentWillMount has been renamed/i,
  // 抑制第三方库的非被动事件监听器警告（如 @stagewise/toolbar-react）
  /Added non-passive event listener to a scroll-blocking/i,
  /addEventListener.*passive.*false/i,
  /wheel.*event.*listener.*passive/i,
  // 抑制 useDraggable 相关警告
  /initialSnapArea.*container.*width.*height.*zero/i,
  /useDraggable.*warning/i,
];

/**
 * 检查消息是否应该被过滤
 */
function shouldSuppressMessage(message: string): boolean {
  return WARNING_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * 初始化警告抑制
 */
export function initWarningSuppress() {
  // 重写 console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppressMessage(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };

  // 重写 console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppressMessage(message)) {
      originalConsoleError.apply(console, args);
    }
  };

}

/**
 * 恢复原始的控制台方法
 */
export function restoreConsole() {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
} 