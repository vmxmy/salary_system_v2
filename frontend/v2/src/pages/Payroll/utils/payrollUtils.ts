// import i18n from '../../../i18n'; // 移除此导入
import type { LookupValue } from '../types/payrollTypes'; // Assuming LookupValue might be used or extended
import type { TFunction } from 'i18next';
import type { PayrollPeriod } from '../types/payrollTypes';
import dayjs from 'dayjs';

// 预定义的状态类型 (从StatusTag.tsx复制，确保一致性)
export type StatusType = 
  | 'active'
  | 'inactive' 
  | 'pending'
  | 'processing'
  | 'success'
  | 'error'
  | 'warning'
  | 'draft'
  | 'closed'
  | 'archived'
  | 'planned'
  | 'cancelled'
  | 'expired'
  | 'terminated'
  | 'probation'
  | 'leave'
  | 'custom';

export interface StatusOption {
  id: number;
  display_name_key: string; // Changed from display_name to display_name_key
  color: string;
  type: StatusType; // 新增属性
}

// --- PayrollRun Statuses ---
export const PAYROLL_RUN_STATUS_OPTIONS: StatusOption[] = [
  { id: 60, display_name_key: 'payroll_run_status.pending_calculation', color: 'default', type: 'pending' }, // 待计算
  { id: 61, display_name_key: 'payroll_run_status.calculated', color: 'blue', type: 'processing' }, // 已计算
  { id: 62, display_name_key: 'payroll_run_status.approved_for_payment', color: 'purple', type: 'active' }, // 批准支付
  { id: 63, display_name_key: 'payroll_run_status.paid', color: 'success', type: 'success' }, // 已支付
];

// 创建一个接受翻译函数的版本
export const getPayrollRunStatusInfo = (statusId?: number): { key: string; params?: Record<string, any>; color: string; type: StatusType } => {
  if (statusId === undefined || statusId === null) return { key: 'run.common.status_na', color: 'default', type: 'custom' };
  const status = PAYROLL_RUN_STATUS_OPTIONS.find(opt => opt.id === statusId);
  return status 
    ? { key: status.display_name_key, color: status.color, type: status.type } 
    : { key: 'run.common.unknown_status_param', params: { statusId }, color: 'default', type: 'custom' };
};

// 组件示例用法:
// const { t } = useTranslation(['common', 'payroll']);
// const statusInfo = getPayrollRunStatusInfo(run.status_id);
// const statusText = t(statusInfo.key, statusInfo.params);

// --- PayrollEntry Statuses ---
export const PAYROLL_ENTRY_STATUS_OPTIONS: StatusOption[] = [
  { id: 301, display_name_key: 'payroll_entry_status.pending_calculation', color: 'default', type: 'pending' },
  { id: 302, display_name_key: 'payroll_entry_status.calculated', color: 'blue', type: 'processing' },
  { id: 303, display_name_key: 'payroll_entry_status.pending_confirmation', color: 'orange', type: 'pending' },
  { id: 304, display_name_key: 'payroll_entry_status.confirmed', color: 'green', type: 'success' },
  { id: 305, display_name_key: 'payroll_entry_status.adjusted', color: 'purple', type: 'custom' },
  { id: 306, display_name_key: 'payroll_entry_status.archived', color: 'cyan', type: 'archived' },
  { id: 307, display_name_key: 'payroll_entry_status.error', color: 'error', type: 'error' },
  { id: 64, display_name_key: 'payroll_entry_status.draft', color: 'default', type: 'draft' },
];

// 创建一个接受翻译函数的版本
export const getPayrollEntryStatusInfo = (statusId?: number): { key: string; params?: Record<string, any>; color: string; type: StatusType } => {
  if (statusId === undefined || statusId === null) return { key: 'status.na', color: 'default', type: 'custom' };
  
  // 处理旧的状态ID值，映射到新的状态ID
  let mappedStatusId = statusId;
  if (statusId === 1) mappedStatusId = 301; // 旧版草稿 -> 待计算
  if (statusId === 2) mappedStatusId = 302; // 旧版已提交 -> 已计算
  if (statusId === 3) mappedStatusId = 304; // 旧版已审核 -> 已确认
  
  const status = PAYROLL_ENTRY_STATUS_OPTIONS.find(opt => opt.id === mappedStatusId);
  return status 
    ? { key: status.display_name_key, color: status.color, type: status.type } 
    : { key: 'status.unknown_status_param', params: { statusId }, color: 'default', type: 'custom' };
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
  { id: 137, display_name_key: 'payroll_period_status.planned', color: 'default', type: 'planned' },    // 计划中
  { id: 134, display_name_key: 'payroll_period_status.active', color: 'green', type: 'active' },       // 活动
  { id: 135, display_name_key: 'payroll_period_status.closed', color: 'blue', type: 'closed' },        // 已关闭
  { id: 136, display_name_key: 'payroll_period_status.archived', color: 'gray', type: 'archived' },      // 已归档
];

/**
 * 获取薪资周期状态信息对象
 * @param statusId 状态ID
 * @returns 包含翻译键、参数和颜色的对象
 */
export const getPayrollPeriodStatusInfo = (statusId?: number): { key: string; params?: Record<string, any>; color: string; type: StatusType } => {
  if (statusId === undefined || statusId === null) return { key: 'status.na', color: 'default', type: 'custom' };
  
  const status = PAYROLL_PERIOD_STATUS_OPTIONS.find(opt => opt.id === statusId);
  return status 
    ? { key: status.display_name_key, color: status.color, type: status.type } 
    : { key: 'status.unknown_status_param', params: { statusId }, color: 'default', type: 'custom' };
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

// 新增：生成薪资审核名称的函数
export const getPayrollRunNameTranslation = (period: PayrollPeriod, t: TFunction): string => {
  const periodName = period?.name || t('payroll:auto_id_run_payroll_period_id__e591a8');
  const runDate = dayjs(period?.pay_date).format('YYYY-MM-DD'); // Using pay_date for run date
  return `${periodName} - ${runDate}`;
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