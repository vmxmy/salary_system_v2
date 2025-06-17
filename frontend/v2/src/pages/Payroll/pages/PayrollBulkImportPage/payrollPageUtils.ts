/**
 * 薪资页面工具函数
 */
import type { PayrollComponentDefinition } from '../../types/payrollTypes';

/**
 * 获取组件名称
 * @param code 组件代码
 * @param type 组件类型（'earnings' 或 'deductions'）
 * @param componentDefinitions 组件定义列表
 * @returns 组件名称
 */
export const getComponentName = (
  code: string, 
  type: 'earnings' | 'deductions', 
  componentDefinitions: PayrollComponentDefinition[]
): string => {
  if (!componentDefinitions || componentDefinitions.length === 0) {
    return code; // 如果没有组件定义，返回原始代码
  }

  const component = componentDefinitions.find(comp => comp.code === code);
  if (component) {
    return component.name;
  }

  // 如果找不到对应的组件定义，返回格式化的代码
  return code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * 格式化货币
 * @param value 数值
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '¥0.00';
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(num)) {
    return '¥0.00';
  }

  return `¥${num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * 解析数值
 * @param value 输入值
 * @returns 解析后的数值
 */
export const parseNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // 移除逗号、空格和其他非数字字符（保留小数点和负号）
    const cleanValue = value.replace(/[,\s¥]/g, '').trim();
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

/**
 * 验证身份证号
 * @param idNumber 身份证号
 * @returns 是否有效
 */
export const validateIdNumber = (idNumber: string): boolean => {
  if (!idNumber || typeof idNumber !== 'string') return false;
  
  // 18位身份证号验证
  const pattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  return pattern.test(idNumber);
};

/**
 * 验证员工编号
 * @param employeeCode 员工编号
 * @returns 是否有效
 */
export const validateEmployeeCode = (employeeCode: string): boolean => {
  if (!employeeCode || typeof employeeCode !== 'string') return false;
  
  // 员工编号应该是字母数字组合，长度在3-20之间
  const pattern = /^[A-Za-z0-9]{3,20}$/;
  return pattern.test(employeeCode);
};

/**
 * 生成客户端ID
 * @returns 唯一的客户端ID
 */
export const generateClientId = (): string => {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}; 