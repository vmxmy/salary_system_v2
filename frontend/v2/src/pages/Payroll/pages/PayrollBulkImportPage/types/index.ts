import type {
  PayrollComponentDefinition,
  PayrollPeriod,
  RawPayrollEntryData,
  ValidatedPayrollEntryData,
  BulkCreatePayrollEntriesPayload,
  CreatePayrollEntryPayload
} from '../../../types/payrollTypes';

import type {
  BulkImportValidationResult,
  FieldMappingRule
} from '../../../services/payrollBulkImportApi';

// 导入数据结构
export interface ImportData {
  headers: string[];
  rows: any[][];
  totalRecords: number;
}

// 字段映射规则类型
export type MappingRule = FieldMappingRule;

// 验证结果接口（兼容原有）
export interface ValidationResult {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  errors: string[];
}

// 输入方式类型
export type InputMethod = 'upload' | 'paste';

// 导入设置
export interface ImportSettings {
  skipInvalidRecords: boolean;
  overwriteExisting: boolean;
  sendNotification: boolean;
}

// 导入结果
export interface ImportResult {
  success_count: number;
  error_count: number;
  errors?: Array<{
    index: number;
    employee_id?: number;
    error: string;
  }>;
}

// 步骤配置
export interface StepConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: string;
}

// 字段映射置信度级别
export enum ConfidenceLevel {
  HIGH = 0.8,
  MEDIUM = 0.6,
  LOW = 0.4
}

// 字段类别
export enum FieldCategory {
  BASE = 'base',
  EARNING = 'earning',
  DEDUCTION = 'deduction',
  CALCULATED = 'calculated',
  IGNORE = 'ignore',
  STAT = 'stat',
  OTHER = 'other'
}

// 导出所有外部依赖的类型
export type {
  PayrollComponentDefinition,
  PayrollPeriod,
  RawPayrollEntryData,
  ValidatedPayrollEntryData,
  BulkCreatePayrollEntriesPayload,
  CreatePayrollEntryPayload,
  BulkImportValidationResult,
  FieldMappingRule
}; 