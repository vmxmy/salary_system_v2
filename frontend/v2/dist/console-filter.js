/**
 * 控制台过滤脚本 - 外部文件版本
 * 用于避免 CSP 内联脚本限制
 */
(function() {
  'use strict';
  
  // 只在开发环境和本地主机上启用
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.includes('dev'))) {
    
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // 要过滤的警告模式
    const WARNING_PATTERNS = [
      'findDOMNode is deprecated',
      'Warning: findDOMNode is deprecated',
      'componentWillReceiveProps has been renamed',
      'componentWillMount has been renamed'
    ];
    
    // 检查消息是否应该被过滤
    function shouldFilter(message) {
      return WARNING_PATTERNS.some(pattern => 
        message.includes(pattern)
      );
    }
    
    // 重写 console.warn
    console.warn = function(...args) {
      const message = args.join(' ');
      if (!shouldFilter(message)) {
        originalWarn.apply(console, args);
      }
    };

    // 重写 console.error
    console.error = function(...args) {
      const message = args.join(' ');
      if (!shouldFilter(message)) {
        originalError.apply(console, args);
      }
    };
    
    console.log('🔇 控制台过滤器已启用（外部脚本版本）');
  }
})(); 