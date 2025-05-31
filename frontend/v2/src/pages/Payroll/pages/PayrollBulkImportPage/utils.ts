// 数据处理与校验相关工具函数
// 由 PayrollBulkImportPage 拆分

import type { RawPayrollEntryData, ValidatedPayrollEntryData } from '../../types/payrollTypes';

// ... 这里将 processPayrollRecord、validateRecord、validateRegularSpecifics、validateHiredSpecifics 及其辅助函数全部迁移 ...

// 注意：如有依赖的常量、类型、工具函数，也一并迁移或导入 

// 迁移自主页面，需将 t、getComponentName、defaultPayrollEntryStatusId 作为参数传入

export function processPayrollRecord(
  record: Record<string, any>,
  getComponentName: (key: string, type: 'earnings' | 'deductions') => string,
  defaultPayrollEntryStatusId: number | null,
  t: (key: string) => string
) {
  // ...原始实现内容，去除页面依赖，参数化外部依赖...
}

export function validateRecord(
  record: RawPayrollEntryData,
  index: number,
  t: (key: string, params?: any) => string,
  validateRegularSpecifics: (
    record: RawPayrollEntryData,
    errors: string[],
    recordDescription: string,
    standardDeductionsSum: number,
    allDeductionsSum: number,
    t: (key: string, params?: any) => string
  ) => void,
  validateHiredSpecifics: (
    record: RawPayrollEntryData,
    errors: string[],
    recordDescription: string,
    standardDeductionsSum: number,
    allDeductionsSum: number,
    t: (key: string, params?: any) => string
  ) => void
): string[] {
  // ...原始实现内容，参数化依赖 ...
  return [];
}

export function validateRegularSpecifics(
  record: RawPayrollEntryData,
  errors: string[],
  recordDescription: string,
  standardDeductionsSum: number,
  allDeductionsSum: number,
  t: (key: string, params?: any) => string
) {
  // ...原始实现内容 ...
}

export function validateHiredSpecifics(
  record: RawPayrollEntryData,
  errors: string[],
  recordDescription: string,
  standardDeductionsSum: number,
  allDeductionsSum: number,
  t: (key: string, params?: any) => string
) {
  // ...原始实现内容 ...
} 