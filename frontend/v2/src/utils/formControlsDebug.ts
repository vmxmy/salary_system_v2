/**
 * 表单控件高度调试工具
 */

export interface ElementInfo {
  element: HTMLElement;
  tagName: string;
  className: string;
  height: number;
  computedHeight: string;
  lineHeight: string;
  padding: string;
  border: string;
  boxSizing: string;
}

/**
 * 获取元素的详细样式信息
 */
export function getElementInfo(element: HTMLElement): ElementInfo {
  const computedStyle = window.getComputedStyle(element);
  
  return {
    element,
    tagName: element.tagName,
    className: element.className,
    height: element.offsetHeight,
    computedHeight: computedStyle.height,
    lineHeight: computedStyle.lineHeight,
    padding: computedStyle.padding,
    border: computedStyle.border,
    boxSizing: computedStyle.boxSizing,
  };
}

/**
 * 检查搜索组件中所有表单控件的高度
 */
export function debugSearchFormControls(): void {
  console.group('🔍 搜索表单控件高度调试');
  
  // 查找所有相关的表单控件
  const selectors = [
    '.ant-input',
    '.ant-input-affix-wrapper',
    '.ant-select-selector',
    '.ant-btn',
    '.ant-form-item-control-input',
    '.search-form-controls .ant-input',
    '.search-form-controls .ant-select-selector',
    '.search-form-controls .ant-btn',
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
    
    if (elements.length > 0) {
      console.group(`📋 ${selector} (${elements.length} 个元素)`);
      
      elements.forEach((element, index) => {
        const info = getElementInfo(element);
        console.log(`元素 ${index + 1}:`, {
          高度: `${info.height}px`,
          计算高度: info.computedHeight,
          行高: info.lineHeight,
          内边距: info.padding,
          边框: info.border,
          盒模型: info.boxSizing,
          类名: info.className,
          元素: info.element
        });
      });
      
      console.groupEnd();
    }
  });
  
  console.groupEnd();
}

/**
 * 启用表单控件调试模式
 */
export function enableFormControlsDebug(): void {
  document.body.classList.add('debug-form-controls');
  console.log('🐛 表单控件调试模式已启用');
  debugSearchFormControls();
}

/**
 * 禁用表单控件调试模式
 */
export function disableFormControlsDebug(): void {
  document.body.classList.remove('debug-form-controls');
  console.log('✅ 表单控件调试模式已禁用');
}

/**
 * 监听DOM变化，自动检查新添加的表单控件
 */
export function startFormControlsMonitoring(): void {
  const observer = new MutationObserver((mutations) => {
    let hasFormControls = false;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.matches && (
            element.matches('.ant-input') ||
            element.matches('.ant-select-selector') ||
            element.matches('.ant-btn')
          )) {
            hasFormControls = true;
          }
        }
      });
    });
    
    if (hasFormControls) {
      setTimeout(() => {
        console.log('🔄 检测到新的表单控件，重新检查高度...');
        debugSearchFormControls();
      }, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('👀 表单控件监听已启动');
  
  return observer;
}

// 在开发环境中暴露调试函数到全局
if (import.meta.env.DEV) {
  (window as any).debugFormControls = {
    debug: debugSearchFormControls,
    enable: enableFormControlsDebug,
    disable: disableFormControlsDebug,
    monitor: startFormControlsMonitoring,
  };
  
  console.log('🛠️ 表单控件调试工具已加载，使用 window.debugFormControls 访问');
} 