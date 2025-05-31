import { lookupService } from '../../../services/lookupService';

// 动态状态选项接口
export interface DynamicStatusOption {
  id: number;
  code: string;
  name: string;
  color: string;
}

// 状态颜色映射 - 根据状态代码确定颜色
const getStatusColor = (code: string): string => {
  switch (code.toUpperCase()) {
    // 薪资周期状态颜色
    case 'PLANNED':
      return 'default';
    case 'ACTIVE':
      return 'green';
    case 'CLOSED':
      return 'blue';
    case 'ARCHIVED':
      return 'gray';
    
    // 薪资审核状态颜色
    case 'DRAFT':
      return 'default';
    case 'PROCESSING':
      return 'blue';
    case 'PENDING_REVIEW':
      return 'orange';
    case 'APPROVED':
      return 'cyan';
    case 'PAID':
      return 'green';
    case 'CANCELLED':
      return 'red';
    case 'ERROR':
      return 'red';
    
    // 薪资条目状态颜色
    case 'PENDING_CALCULATION':
      return 'default';
    case 'CALCULATED':
      return 'blue';
    case 'PENDING_CONFIRMATION':
      return 'orange';
    case 'CONFIRMED':
      return 'green';
    case 'ADJUSTED':
      return 'purple';
    
    default:
      return 'default';
  }
};

// 缓存状态选项
let payrollPeriodStatusCache: DynamicStatusOption[] | null = null;
let payrollRunStatusCache: DynamicStatusOption[] | null = null;
let payrollEntryStatusCache: DynamicStatusOption[] | null = null;

/**
 * 获取薪资周期状态选项
 */
export const getPayrollPeriodStatusOptions = async (): Promise<DynamicStatusOption[]> => {
  if (payrollPeriodStatusCache) {
    return payrollPeriodStatusCache;
  }
  
  try {
    const lookupItems = await lookupService.getPayrollPeriodStatusOptions();
    payrollPeriodStatusCache = lookupItems
      .filter(item => item.id && item.code && item.name) // 过滤掉无效数据
      .map(item => ({
        id: item.id!,
        code: item.code!,
        name: item.name!,
        color: getStatusColor(item.code!)
      }));
    return payrollPeriodStatusCache;
  } catch (error) {
    console.error('Failed to fetch payroll period status options:', error);
    return [];
  }
};

/**
 * 获取薪资审核状态选项
 */
export const getPayrollRunStatusOptions = async (): Promise<DynamicStatusOption[]> => {
  if (payrollRunStatusCache) {
    return payrollRunStatusCache;
  }
  
  try {
    const lookupItems = await lookupService.getPayrollRunStatusOptions();
    payrollRunStatusCache = lookupItems
      .filter(item => item.id && item.code && item.name) // 过滤掉无效数据
      .map(item => ({
        id: item.id!,
        code: item.code!,
        name: item.name!,
        color: getStatusColor(item.code!)
      }));
    return payrollRunStatusCache;
  } catch (error) {
    console.error('Failed to fetch payroll run status options:', error);
    return [];
  }
};

/**
 * 获取薪资条目状态选项
 */
export const getPayrollEntryStatusOptions = async (): Promise<DynamicStatusOption[]> => {
  if (payrollEntryStatusCache) {
    return payrollEntryStatusCache;
  }
  
  try {
    const lookupItems = await lookupService.getPayrollEntryStatusOptions();
    payrollEntryStatusCache = lookupItems
      .filter(item => item.id && item.code && item.name) // 过滤掉无效数据
      .map(item => ({
        id: item.id!,
        code: item.code!,
        name: item.name!,
        color: getStatusColor(item.code!)
      }));
    return payrollEntryStatusCache;
  } catch (error) {
    console.error('Failed to fetch payroll entry status options:', error);
    return [];
  }
};

/**
 * 根据状态ID获取薪资周期状态信息
 */
export const getPayrollPeriodStatusInfo = async (statusId?: number): Promise<{ name: string; color: string }> => {
  if (statusId === undefined || statusId === null) {
    return { name: {t('payroll:auto_text_e69caa')}, color: 'default' };
  }
  
  const options = await getPayrollPeriodStatusOptions();
  const status = options.find(opt => opt.id === statusId);
  return status 
    ? { name: status.name, color: status.color }
    : { name: {t('payroll:auto__statusid__e69caa')}, color: 'default' };
};

/**
 * 根据状态ID获取薪资审核状态信息
 */
export const getPayrollRunStatusInfo = async (statusId?: number): Promise<{ name: string; color: string }> => {
  if (statusId === undefined || statusId === null) {
    return { name: {t('payroll:auto_text_e69caa')}, color: 'default' };
  }
  
  const options = await getPayrollRunStatusOptions();
  const status = options.find(opt => opt.id === statusId);
  return status 
    ? { name: status.name, color: status.color }
    : { name: {t('payroll:auto__statusid__e69caa')}, color: 'default' };
};

/**
 * 根据状态ID获取薪资条目状态信息
 */
export const getPayrollEntryStatusInfo = async (statusId?: number): Promise<{ name: string; color: string }> => {
  if (statusId === undefined || statusId === null) {
    return { name: {t('payroll:auto_text_e69caa')}, color: 'default' };
  }
  
  const options = await getPayrollEntryStatusOptions();
  const status = options.find(opt => opt.id === statusId);
  return status 
    ? { name: status.name, color: status.color }
    : { name: {t('payroll:auto__statusid__e69caa')}, color: 'default' };
};

/**
 * 清除状态缓存（用于强制刷新）
 */
export const clearStatusCache = () => {
  payrollPeriodStatusCache = null;
  payrollRunStatusCache = null;
  payrollEntryStatusCache = null;
};

/**
 * 根据状态代码获取薪资周期状态ID
 */
export const getPayrollPeriodStatusIdByCode = async (code: string): Promise<number | null> => {
  const options = await getPayrollPeriodStatusOptions();
  const status = options.find(opt => opt.code === code);
  return status ? status.id : null;
}; 