import React from 'react';

/**
 * 检查字段是否应该作为字符串处理（不格式化为数字）
 */
export const isStringOnlyField = (fieldName: string): boolean => {
  const stringFieldPatterns = [
    /电话/i, /手机/i, /联系方式/i, /phone/i, /mobile/i,
    /账号/i, /账户/i, /account/i, /卡号/i, /银行/i,
    /身份证/i, /证件/i, /id.*card/i, /identity/i,
    /客户号/i, /编号/i, /工号/i, /员工号/i, /人员编号/i,
    /邮编/i, /postal/i, /zip/i, /code/i,
    /qq/i, /微信/i, /wechat/i, /email/i, /邮箱/i
  ];
  
  return stringFieldPatterns.some(pattern => pattern.test(fieldName));
};

/**
 * 数字格式化函数：只返回格式化的字符串，保持原始数据类型用于Excel导出
 * @param value 需要格式化的值
 * @param fieldName 字段名称，用于判断是否为字符串字段
 * @returns 格式化后的字符串
 */
export const formatNumber = (value: any, fieldName?: string): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  // 如果是字符串字段，直接返回字符串
  if (fieldName && isStringOnlyField(fieldName)) {
    return String(value);
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString('zh-CN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  
  if (typeof value === 'string') {
    // 如果是字符串字段，不尝试转换为数字
    if (fieldName && isStringOnlyField(fieldName)) {
      return value;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue.toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  }
  
  return value.toString();
};

/**
 * 数字渲染函数：用于表格显示，返回React元素
 * @param value 需要渲染的值
 * @param fieldName 字段名称，用于判断是否为字符串字段
 * @returns React元素
 */
export const renderNumber = (value: any, fieldName?: string) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  // 如果是字符串字段，直接返回字符串
  if (fieldName && isStringOnlyField(fieldName)) {
    return String(value);
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString('zh-CN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  
  if (typeof value === 'string') {
    // 如果是字符串字段，不尝试转换为数字
    if (fieldName && isStringOnlyField(fieldName)) {
      return value;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue.toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  }
  
  return value.toString();
};

/**
 * 日期格式化函数：格式化薪资期间名称
 * @param value 需要格式化的日期值
 * @returns 格式化后的字符串
 */
export const formatDate = (value: any) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  const dateStr = String(value);
  
  // 尝试解析各种日期格式
  let date: Date | null = null;
  
  // 格式1: YYYY年MM月 (如: 2024年06月)
  const yearMonthMatch = dateStr.match(/(\d{4})年(\d{1,2})月/);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1]);
    const month = parseInt(yearMonthMatch[2]) - 1; // JavaScript月份从0开始
    date = new Date(year, month);
  }
  
  // 格式2: YYYY-MM (如: 2024-06)
  if (!date) {
    const dashMatch = dateStr.match(/^(\d{4})-(\d{1,2})$/);
    if (dashMatch) {
      const year = parseInt(dashMatch[1]);
      const month = parseInt(dashMatch[2]) - 1;
      date = new Date(year, month);
    }
  }
  
  // 格式3: 标准日期字符串
  if (!date) {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate;
    }
  }
  
  if (date && !isNaN(date.getTime())) {
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
  }
  
  // 如果无法解析为日期，返回原值
  return dateStr;
};

/**
 * 日期格式化函数：将日期格式化为中文年月格式 (YYYY年MM月)
 * @param value 需要格式化的日期值
 * @returns 格式化后的字符串
 */
export const formatDateToChinese = (value: any) => {
  if (value === null || value === undefined) {
    return 'N/A';  // ✅ 返回字符串而不是React元素
  }
  
  const dateStr = String(value);
  
  // 尝试解析各种日期格式
  let date: Date | null = null;
  
  // 格式1: 标准日期字符串 (YYYY-MM-DD)
  const standardMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (standardMatch) {
    const year = parseInt(standardMatch[1]);
    const month = parseInt(standardMatch[2]) - 1;
    const day = parseInt(standardMatch[3]);
    date = new Date(year, month, day);
  }
  
  // 格式2: 已经是中文格式 (YYYY年MM月)
  if (!date) {
    const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月/);
    if (chineseMatch) {
      const year = parseInt(chineseMatch[1]);
      const month = parseInt(chineseMatch[2]) - 1;
      date = new Date(year, month);
    }
  }
  
  // 格式3: 其他标准日期格式
  if (!date) {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate;
    }
  }
  
  if (date && !isNaN(date.getTime())) {
    // ✅ 修复：返回字符串而不是React元素
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
  }
  
  // 如果无法解析为日期，返回原值
  return dateStr;
};

/**
 * 安全的 JSON 序列化函数，避免循环引用
 * @param obj 需要序列化的对象
 * @returns 序列化后的字符串
 */
export const safeStringify = (obj: any): string => {
  try {
    // 如果是基本类型，直接返回字符串形式
    if (obj === null || obj === undefined) {
      return String(obj);
    }
    
    if (typeof obj !== 'object') {
      return String(obj);
    }
    
    // 如果是数组，简单显示
    if (Array.isArray(obj)) {
      return `[${obj.length} 项]`;
    }
    
    // 如果是普通对象但toString()返回[object Object]，尝试提取有用信息
    if (obj.toString() === '[object Object]') {
      // 尝试提取对象的关键属性
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return '{}'; // 空对象
      }
      
      // 提取前几个属性值作为字符串表示
      const preview = keys.slice(0, 3).map(key => {
        const val = obj[key];
        if (val === null || val === undefined) {
          return `${key}: -`;
        }
        if (typeof val === 'object') {
          return `${key}: ${val === null ? '-' : (Array.isArray(val) ? `[${val.length}项]` : '{...}')}`;
        }
        return `${key}: ${String(val).substring(0, 15)}${String(val).length > 15 ? '...' : ''}`;
      }).join(', ');
      
      return `{${preview}${keys.length > 3 ? ', ...' : ''}}`;
    }
    
    // 对于对象，尝试提取有意义的信息
    const seen = new WeakSet();
    
    const replacer = (key: string, val: any) => {
      // 跳过函数和符号
      if (typeof val === 'function' || typeof val === 'symbol') {
        return '[Function]';
      }
      
      // 处理循环引用
      if (val != null && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
        
        // 限制嵌套深度
        if (key && key.split('.').length > 3) {
          return '[Deep Object]';
        }
      }
      
      return val;
    };
    
    const result = JSON.stringify(obj, replacer, 2);
    
    // 如果结果太长，截断
    if (result && result.length > 500) {
      const preview = result.substring(0, 497) + '...';
      return preview;
    }
    
    return result || String(obj);
    
  } catch (error) {
    console.warn('JSON序列化失败:', error);
    
    // 尝试提取对象的基本信息
    try {
      if (obj && typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length > 0) {
          const preview = keys.slice(0, 3).map(key => {
            try {
              const val = obj[key];
              if (typeof val === 'object') {
                return `${key}: [Object]`;
              }
              return `${key}: ${String(val).substring(0, 20)}`;
            } catch {
              return `${key}: [Error]`;
            }
          }).join(', ');
          return `{${preview}${keys.length > 3 ? '...' : ''}}`;
        }
      }
      return String(obj);
    } catch {
      return '[不可序列化对象]';
    }
  }
};

/**
 * 通配符匹配函数 - 支持 * 和 ? 通配符
 * @param text 需要匹配的文本
 * @param pattern 匹配模式
 * @returns 是否匹配
 */
export const matchesPattern = (text: string, pattern: string): boolean => {
  // 确保输入是字符串
  if (text === null || text === undefined) {
    return false;
  }
  
  // 精确匹配（区分大小写）
  if (text === pattern) {
    console.log(`✅ [matchesPattern] 精确匹配成功: "${text}" === "${pattern}"`);
    return true;
  }
  
  // 将字符串转换为小写以进行不区分大小写的匹配
  const textStr = String(text).toLowerCase();
  const patternStr = String(pattern).toLowerCase();
  
  // 不区分大小写的精确匹配
  if (textStr === patternStr) {
    console.log(`✅ [matchesPattern] 不区分大小写的精确匹配成功: "${textStr}" === "${patternStr}"`);
    return true;
  }
  
  // 特殊情况：如果模式是 * 或 **，匹配所有内容
  if (patternStr === '*' || patternStr === '**') {
    return true;
  }
  
  // 特殊处理：*text* 模式 (包含匹配)
  if (patternStr.startsWith('*') && patternStr.endsWith('*') && patternStr.length > 2) {
    const innerText = patternStr.substring(1, patternStr.length - 1);
    return textStr.includes(innerText);
  }
  
  // 特殊处理：text* 模式 (前缀匹配)
  if (patternStr.endsWith('*') && !patternStr.startsWith('*')) {
    const prefix = patternStr.substring(0, patternStr.length - 1);
    return textStr.startsWith(prefix);
  }
  
  // 特殊处理：*text 模式 (后缀匹配)
  if (patternStr.startsWith('*') && !patternStr.endsWith('*')) {
    const suffix = patternStr.substring(1);
    return textStr.endsWith(suffix);
  }
  
  // 如果包含通配符，使用正则表达式匹配
  if (patternStr.includes('*') || patternStr.includes('?')) {
    // 转义正则表达式特殊字符，但保留 * 和 ?
    const regexPattern = patternStr
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/\*/g, '.*')  // * 转换为 .*
      .replace(/\?/g, '.'); // ? 转换为 .
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(textStr);
  }
  
  // 如果没有通配符，执行精确匹配
  return textStr === patternStr;
};

/**
 * 检查是否为React元素
 * @param value 需要检查的值
 * @returns 是否为React元素
 */
export const isReactElement = (value: any): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  // 检查React元素的标识符
  return !!(value.$$typeof || value.$typeof || (value.type && value.props));
};

/**
 * 从React渲染结果中提取文本内容
 * @param renderResult React渲染结果
 * @returns 提取的文本内容
 */
export const extractTextFromRender = (renderResult: any): string => {
  if (renderResult === null || renderResult === undefined) {
    return '';
  }
  
  // 如果是React元素
  if (React.isValidElement(renderResult) || isReactElement(renderResult)) {
    const props = renderResult.props as any;
    
    // 处理span元素（如格式化的数字、日期）
    if (renderResult.type === 'span') {
      if (props.children !== undefined) {
        return String(props.children);
      }
      if (props.style?.color === '#999' && props.children === 'N/A') {
        return 'N/A';
      }
    }
    
    // 处理pre元素（JSON数据）
    if (renderResult.type === 'pre') {
      return props.children || '';
    }
    
    // 处理图标元素（布尔值）
    if (typeof renderResult.type === 'function' && (renderResult.type as any).displayName) {
      const displayName = (renderResult.type as any).displayName;
      if (displayName === 'CheckCircleOutlined') return '是';
      if (displayName === 'CloseCircleOutlined') return '否';
    }
    
    // 尝试获取children
    if (props && props.children !== undefined) {
      return extractTextFromRender(props.children);
    }
    
    return '';
  }
  
  // 如果是数组，递归处理
  if (Array.isArray(renderResult)) {
    return renderResult.map(item => extractTextFromRender(item)).join('');
  }
  
  // 基本类型直接返回
  return String(renderResult);
};

/**
 * 深度清理数据，确保没有React元素残留
 * @param value 需要清理的值
 * @returns 清理后的原始值
 */
export const deepCleanValue = (value: any): any => {
  if (value === null || value === undefined) {
    return null;
  }
  
  // 检查是否为React元素
  if (isReactElement(value)) {
    console.warn('[数据清理] 发现React元素，尝试提取原始值:', value);
    
    // 尝试从props中提取原始值
    if (value.props) {
      if (value.props.children !== undefined) {
        return deepCleanValue(value.props.children);
      }
      
      // 对于数字格式化的span元素，尝试提取数字
      if (typeof value.props.children === 'string') {
        const numMatch = value.props.children.match(/[\d,.-]+/);
        if (numMatch) {
          const num = parseFloat(numMatch[0].replace(/,/g, ''));
          if (!isNaN(num)) {
            return num;
          }
        }
      }
    }
    
    return '[React元素]';
  }
  
  // 处理数组
  if (Array.isArray(value)) {
    return value.map(item => deepCleanValue(item));
  }
  
  // 处理对象
  if (typeof value === 'object' && value !== null) {
    // 检查是否是普通对象
    if (value.constructor === Object) {
      // 检查对象是否为空
      if (Object.keys(value).length === 0) {
        return '{}';
      }
      
      // 对于普通对象，尝试提取关键属性
      // 但不要递归处理，避免循环引用和过深嵌套
      const keys = Object.keys(value).slice(0, 3);
      if (keys.length > 0) {
        const preview = keys.map(key => {
          const val = value[key];
          if (val === null || val === undefined) {
            return `${key}: -`;
          }
          if (typeof val === 'object') {
            return `${key}: ${val === null ? '-' : (Array.isArray(val) ? `[${val.length}项]` : '{...}')}`;
          }
          return `${key}: ${String(val).substring(0, 15)}${String(val).length > 15 ? '...' : ''}`;
        }).join(', ');
        
        return `{${preview}${Object.keys(value).length > 3 ? ', ...' : ''}}`;
      }
      
      // 如果需要完整处理对象的所有属性，使用下面的代码
      // 但这可能导致循环引用问题
      /*
      const cleaned: any = {};
      Object.keys(value).forEach(key => {
        cleaned[key] = deepCleanValue(value[key]);
      });
      return cleaned;
      */
    }
    
    // 其他对象类型转换为字符串表示
    return safeStringify(value);
  }
  
  // 基本类型直接返回
  return value;
};

/**
 * 数据清理函数
 * @param value 需要清理的值
 * @returns 清理后的值
 */
export const cleanValue = (value: any, fieldName?: string): any => {
  // 首先进行深度清理
  const deepCleaned = deepCleanValue(value);
  
  if (deepCleaned === null || deepCleaned === undefined) {
    return '';
  }
  
  if (typeof deepCleaned === 'boolean') {
    return deepCleaned ? '是' : '否';
  }
  
  if (typeof deepCleaned === 'number') {
    // 检查是否为有效数字
    if (isNaN(deepCleaned) || !isFinite(deepCleaned)) {
      return '';
    }
    // 保持原始数字类型
    return deepCleaned;
  }
  
  if (typeof deepCleaned === 'string') {
    const cleanedString = deepCleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // 如果是字符串字段，不尝试转换为数字
    if (fieldName && isStringOnlyField(fieldName)) {
      return cleanedString;
    }
    
    const numValue = parseFloat(cleanedString);
    if (!isNaN(numValue) && isFinite(numValue) && !cleanedString.includes('{') && !cleanedString.includes('[')) {
      return numValue;
    }
    return cleanedString;
  }
  
  // 如果还是对象，确保转换为可读的字符串
  if (typeof deepCleaned === 'object' && deepCleaned !== null) {
    return safeStringify(deepCleaned);
  }
  
  // 其他类型转换为字符串并清理特殊字符
  return String(deepCleaned).replace(/[\x00-\x1F\x7F-\x9F]/g, '');
};

/**
 * 处理单元格值，应用与表格相同的渲染逻辑
 * @param rawValue 原始值
 * @param column 列配置
 * @param record 记录对象
 * @param index 索引
 * @returns 处理后的值
 */
export const processValue = <T extends Record<string, any>>(
  rawValue: any, 
  column: any, 
  record: T, 
  index: number
): any => {
  const fieldName = column.dataIndex || column.key;
  
  // 如果列有自定义渲染函数，使用它
  if (column.render) {
    try {
      const renderResult = column.render(rawValue, record, index, {} as any, {} as any);
      const textContent = extractTextFromRender(renderResult);
      
      // 如果是字符串字段，不尝试转换为数字
      if (fieldName && isStringOnlyField(fieldName)) {
        return textContent;
      }
      
      // 尝试转换为数字（保持Excel中的数字格式）
      const numValue = parseFloat(textContent);
      if (!isNaN(numValue) && isFinite(numValue) && textContent !== 'N/A') {
        return numValue;
      }
      
      return textContent;
    } catch (error) {
      console.warn('渲染函数执行失败:', error);
      return cleanValue(rawValue, fieldName);
    }
  }
  
  // 没有渲染函数，直接清理原始值
  return cleanValue(rawValue, fieldName);
};

/**
 * 格式化对象为可读字符串，专门用于表格显示
 * @param obj 需要格式化的对象
 * @returns 格式化后的字符串
 */
export const formatObjectForDisplay = (obj: any): string => {
  // 处理null和undefined
  if (obj === null || obj === undefined) {
    return '-';
  }
  
  // 处理基本类型
  if (typeof obj !== 'object') {
    return String(obj);
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return `[${obj.length} 项]`;
  }
  
  try {
    // 检查是否为空对象
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '{}';
    }
    
    // 检查是否为JSON字符串对象
    if (obj.toString() === '[object Object]') {
      // 提取对象的关键属性
      const preview = keys.slice(0, 3).map(key => {
        const val = obj[key];
        if (val === null || val === undefined) {
          return `${key}: -`;
        }
        if (typeof val === 'object') {
          return `${key}: ${val === null ? '-' : (Array.isArray(val) ? `[${val.length}项]` : '{...}')}`;
        }
        return `${key}: ${String(val).substring(0, 15)}${String(val).length > 15 ? '...' : ''}`;
      }).join(', ');
      
      return `{${preview}${keys.length > 3 ? ', ...' : ''}}`;
    } else {
      // 对于其他对象类型，尝试使用toString()方法
      const stringValue = obj.toString();
      if (stringValue !== '[object Object]') {
        return stringValue;
      }
    }
    
    // 如果没有有意义的字符串表示，回退到JSON序列化
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('对象格式化失败:', error);
    try {
      // 最后的尝试：直接转为字符串
      return String(obj);
    } catch {
      return '[不可序列化对象]';
    }
  }
};