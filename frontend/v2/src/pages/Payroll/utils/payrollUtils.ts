// import i18n from '../../../i18n'; // 移除此导入
import type { LookupValue } from '../types/payrollTypes'; // Assuming LookupValue might be used or extended
import type { TFunction } from 'i18next';

export interface StatusOption {
  id: number;
  display_name_key: string; // Changed from display_name to display_name_key
  color: string;
}

// --- PayrollRun Statuses ---
export const PAYROLL_RUN_STATUS_OPTIONS: StatusOption[] = [
  { id: 201, display_name_key: 'payroll_run_status.draft', color: 'default' },
  { id: 202, display_name_key: 'payroll_run_status.processing', color: 'blue' },
  { id: 203, display_name_key: 'payroll_run_status.pending_review', color: 'orange' },
  { id: 204, display_name_key: 'payroll_run_status.approved', color: 'cyan' },
  { id: 62, display_name_key: 'payroll_run_status.approved_for_payment', color: 'purple' }, // ID 62 seems specific
  { id: 205, display_name_key: 'payroll_run_status.paid', color: 'success' },
  { id: 206, display_name_key: 'payroll_run_status.cancelled', color: 'red' },
  { id: 207, display_name_key: 'payroll_run_status.error', color: 'error' },
];

// 创建一个接受翻译函数的版本
export const getPayrollRunStatusInfo = (statusId?: number): { key: string; params?: Record<string, any>; color: string } => {
  if (statusId === undefined || statusId === null) return { key: 'status.na', color: 'default' };
  const status = PAYROLL_RUN_STATUS_OPTIONS.find(opt => opt.id === statusId);
  return status 
    ? { key: status.display_name_key, color: status.color } 
    : { key: 'status.unknown_status_param', params: { statusId }, color: 'default' };
};

// 组件示例用法:
// const { t } = useTranslation(['common', 'payroll']);
// const statusInfo = getPayrollRunStatusInfo(run.status_id);
// const statusText = t(statusInfo.key, statusInfo.params);

// --- PayrollEntry Statuses ---
export const PAYROLL_ENTRY_STATUS_OPTIONS: StatusOption[] = [
  { id: 301, display_name_key: 'payroll_entry_status.pending_calculation', color: 'default' },
  { id: 302, display_name_key: 'payroll_entry_status.calculated', color: 'blue' },
  { id: 303, display_name_key: 'payroll_entry_status.pending_confirmation', color: 'orange' },
  { id: 304, display_name_key: 'payroll_entry_status.confirmed', color: 'green' },
  { id: 305, display_name_key: 'payroll_entry_status.adjusted', color: 'purple' },
  { id: 306, display_name_key: 'payroll_entry_status.archived', color: 'cyan' },
  { id: 307, display_name_key: 'payroll_entry_status.error', color: 'error' },
  { id: 64, display_name_key: 'payroll_entry_status.draft', color: 'default' },
];

// 创建一个接受翻译函数的版本
export const getPayrollEntryStatusInfo = (statusId?: number): { key: string; params?: Record<string, any>; color: string } => {
  if (statusId === undefined || statusId === null) return { key: 'status.na', color: 'default' };
  
  // 处理旧的状态ID值，映射到新的状态ID
  let mappedStatusId = statusId;
  if (statusId === 1) mappedStatusId = 301; // 旧版草稿 -> 待计算
  if (statusId === 2) mappedStatusId = 302; // 旧版已提交 -> 已计算
  if (statusId === 3) mappedStatusId = 304; // 旧版已审核 -> 已确认
  
  const status = PAYROLL_ENTRY_STATUS_OPTIONS.find(opt => opt.id === mappedStatusId);
  return status 
    ? { key: status.display_name_key, color: status.color } 
    : { key: 'status.unknown_status_param', params: { statusId }, color: 'default' };
};

// 为了向后兼容，保留原来的函数但添加 @deprecated 标记
/**
 * @deprecated 使用 getPayrollRunStatusInfo 替代
 */
export const getPayrollRunStatusDisplay = (statusId: number, t: TFunction): string => {
  switch (statusId) {
    case 1:
      return t('payroll:run_status.draft');
    case 2:
      return t('payroll:run_status.processing');
    case 3:
      return t('payroll:run_status.completed');
    case 4:
      return t('payroll:run_status.paid');
    default:
      return t('common:unknown');
  }
};

/**
 * @deprecated 使用 getPayrollEntryStatusInfo 替代
 */
export const getPayrollEntryStatusDisplay = (statusId: number, t: TFunction): string => {
  switch (statusId) {
    case 1:
      return t('payroll:entry_status.draft');
    case 2:
      return t('payroll:entry_status.submitted');
    case 3:
      return t('payroll:entry_status.approved');
    default:
      return t('common:unknown');
  }
};

// --- PayrollPeriod Statuses ---
export const PAYROLL_PERIOD_STATUS_OPTIONS: StatusOption[] = [
  { id: 101, display_name_key: 'payroll_period_status.planned', color: 'default' },
  { id: 102, display_name_key: 'payroll_period_status.active', color: 'blue' },
  { id: 103, display_name_key: 'payroll_period_status.closed', color: 'red' },
  { id: 104, display_name_key: 'payroll_period_status.archived', color: 'cyan' },
];

/**
 * 获取薪资周期状态信息对象
 * @param statusId 状态ID
 * @returns 包含翻译键、参数和颜色的对象
 */
export const getPayrollPeriodStatusInfo = (statusId?: number): { key: string; params?: Record<string, any>; color: string } => {
  if (statusId === undefined || statusId === null) return { key: 'status.na', color: 'default' };
  
  // 处理旧的状态ID值，映射到新的状态ID
  let mappedStatusId = statusId;
  if (statusId === 1) mappedStatusId = 102; // 旧版活动 -> 新版活动(102)
  if (statusId === 2) mappedStatusId = 103; // 旧版关闭 -> 新版关闭(103)
  if (statusId === 3) mappedStatusId = 104; // 旧版归档 -> 新版归档(104)
  
  const status = PAYROLL_PERIOD_STATUS_OPTIONS.find(opt => opt.id === mappedStatusId);
  return status 
    ? { key: status.display_name_key, color: status.color } 
    : { key: 'status.unknown_status_param', params: { statusId }, color: 'default' };
};

/**
 * 获取薪资周期状态的显示文本
 * @param statusId 状态ID
 * @param t 翻译函数
 * @returns 状态显示文本
 * @deprecated 使用 getPayrollPeriodStatusInfo 替代
 */
export const getPayrollPeriodStatusDisplay = (statusId: number, t: TFunction): string => {
  // 旧的映射逻辑保持不变，确保向后兼容
  switch (statusId) {
    case 1:
    case 102: // 支持新ID
      return t('payroll:period_status.active');
    case 2:
    case 103: // 支持新ID
      return t('payroll:period_status.closed');
    case 3:
    case 104: // 支持新ID
      return t('payroll:period_status.archived');
    case 101: // 新增计划状态
      return t('payroll:period_status.planned');
    default:
      return t('common:unknown');
  }
};

/**
 * 格式化金额为带两位小数的字符串
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
export const formatAmount = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) {
    return '0.00';
  }
  
  return amount.toFixed(2);
};

/**
 * 计算总收入
 * @param items 收入项目数组
 * @returns 总收入
 */
export const calculateTotalEarnings = (items: Array<{amount: number}>): number => {
  if (!items || !Array.isArray(items)) {
    return 0;
  }
  
  return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
};

/**
 * 计算总扣缴
 * @param items 扣缴项目数组
 * @returns 总扣缴
 */
export const calculateTotalDeductions = (items: Array<{amount: number}>): number => {
  if (!items || !Array.isArray(items)) {
    return 0;
  }
  
  return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}; 