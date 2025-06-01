// 环境配置和业务规则
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const ENABLE_PRODUCTION_RESTRICTIONS = IS_PRODUCTION; // 可以通过环境变量控制

// 薪资周期状态常量
export const PAYROLL_PERIOD_STATUS = {
  ACTIVE: 'ACTIVE',     // 活动状态 - 允许导入
  CLOSED: 'CLOSED',     // 已关闭 - 生产环境禁止导入
  ARCHIVED: 'ARCHIVED'  // 已归档 - 生产环境禁止导入
} as const;

// 类型定义
export interface EarningDetailItem {
  amount: number;
  name: string;
}

export interface DeductionDetailItem {
  amount: number;
  name: string;
}

export interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: { record: any; error: string }[];
  createdEntries?: any[]; 
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

// PayrollComponentDefinition is now imported from '../../types/payrollTypes' in files that need it.
// Removing the local definition here to ensure a single source of truth.

// 确保 RawPayrollEntryData 和 ValidatedPayrollEntryData 中的嵌套类型也已定义或导入
// 如果它们也纯粹是类型，并且不依赖于运行时，可以考虑移到这里
// 但由于它们可能比较复杂，并且在 dataProcessing.ts 中紧密使用，暂时保留在原处或移至 dataProcessing.ts 的类型部分