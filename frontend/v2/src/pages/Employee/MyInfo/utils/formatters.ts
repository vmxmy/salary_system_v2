/**
 * 员工信息数据格式化工具函数
 */
import dayjs from 'dayjs';
import { SENSITIVE_FIELDS } from '../constants/employeeConstants.tsx';

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模板，默认'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date?: string | Date | null, format = 'YYYY-MM-DD'): string => {
  if (!date) return '--';
  return dayjs(date).isValid() ? dayjs(date).format(format) : '--';
};

/**
 * 格式化员工姓名
 * @param firstName 名
 * @param lastName 姓
 * @returns 完整姓名
 */
export const formatEmployeeName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return '--';
  return `${lastName || ''}${firstName || ''}`.trim();
};

/**
 * 脱敏显示敏感信息
 * @param value 原始值
 * @param fieldName 字段名
 * @returns 脱敏后的值
 */
export const maskSensitiveData = (value?: string, fieldName?: string): string => {
  if (!value) return '--';
  
  // 检查是否为敏感字段
  if (fieldName && Object.values(SENSITIVE_FIELDS).includes(fieldName as any)) {
    if (fieldName === SENSITIVE_FIELDS.ID_NUMBER) {
      // 身份证号脱敏：显示前4位和后4位
      if (value.length >= 8) {
        return `${value.substring(0, 4)}****${value.substring(value.length - 4)}`;
      }
    } else if (fieldName === SENSITIVE_FIELDS.SOCIAL_SECURITY_CLIENT_NUMBER) {
      // 社保号脱敏：显示前3位和后3位
      if (value.length >= 6) {
        return `${value.substring(0, 3)}****${value.substring(value.length - 3)}`;
      }
    } else if (fieldName === SENSITIVE_FIELDS.PHONE_NUMBER) {
      // 电话号码脱敏：显示前3位和后4位
      if (value.length >= 7) {
        return `${value.substring(0, 3)}****${value.substring(value.length - 4)}`;
      }
    }
  }
  
  return value;
};

/**
 * 格式化电话号码
 * @param phone 电话号码
 * @returns 格式化后的电话号码
 */
export const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return '--';
  
  // 简单的电话号码格式化（11位手机号）
  if (phone.length === 11 && /^1[3-9]\d{9}$/.test(phone)) {
    return `${phone.substring(0, 3)} ${phone.substring(3, 7)} ${phone.substring(7)}`;
  }
  
  return phone;
};

/**
 * 格式化工作年限
 * @param startDate 开始日期
 * @param endDate 结束日期，默认为当前日期
 * @returns 工作年限描述
 */
export const formatWorkYears = (startDate?: string | Date, endDate?: string | Date): string => {
  if (!startDate) return '--';
  
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs();
  
  if (!start.isValid()) return '--';
  
  const years = end.diff(start, 'year');
  const months = end.diff(start, 'month') % 12;
  
  if (years === 0 && months === 0) {
    return '不足1个月';
  } else if (years === 0) {
    return `${months}个月`;
  } else if (months === 0) {
    return `${years}年`;
  } else {
    return `${years}年${months}个月`;
  }
};

/**
 * 格式化状态标签
 * @param statusName 状态名称
 * @returns 状态标签配置
 */
export const formatStatusTag = (statusName?: string) => {
  const defaultConfig = { color: 'default', text: statusName || '--' };
  
  if (!statusName) return defaultConfig;
  
  // 根据状态名称返回不同的标签配色
  const statusMap: Record<string, { color: string; text: string }> = {
    '在职': { color: 'success', text: '在职' },
    '离职': { color: 'error', text: '离职' },
    '试用期': { color: 'warning', text: '试用期' },
    '实习': { color: 'processing', text: '实习' },
    '退休': { color: 'default', text: '退休' },
  };
  
  return statusMap[statusName] || { color: 'default', text: statusName };
};

/**
 * 格式化数字
 * @param value 数字值
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的数字字符串
 */
export const formatNumber = (value?: number | string, decimals = 2): string => {
  if (value === null || value === undefined || value === '') return '--';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '--';
  
  return num.toFixed(decimals);
};

/**
 * 格式化地址
 * @param address 地址字符串
 * @param maxLength 最大显示长度，超出部分省略
 * @returns 格式化后的地址
 */
export const formatAddress = (address?: string, maxLength = 50): string => {
  if (!address) return '--';
  
  if (address.length <= maxLength) {
    return address;
  }
  
  return `${address.substring(0, maxLength)}...`;
};

/**
 * 格式化百分比
 * @param value 数值（0-1之间）
 * @param decimals 小数位数，默认1位
 * @returns 百分比字符串
 */
export const formatPercentage = (value?: number, decimals = 1): string => {
  if (value === null || value === undefined) return '--';
  
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * 检查值是否为空
 * @param value 要检查的值
 * @returns 是否为空
 */
export const isEmpty = (value: any): boolean => {
  return value === null || value === undefined || value === '' || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && Object.keys(value).length === 0);
};

/**
 * 安全获取嵌套对象属性
 * @param obj 对象
 * @param path 属性路径，如 'a.b.c'
 * @param defaultValue 默认值
 * @returns 属性值或默认值
 */
export const safeGet = <T = any>(obj: any, path: string, defaultValue?: T): T => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as T;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue as T;
}; 