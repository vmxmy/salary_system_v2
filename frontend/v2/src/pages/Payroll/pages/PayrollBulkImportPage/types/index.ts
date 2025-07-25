import type {
  PayrollComponentDefinition,
  PayrollPeriod,
  RawPayrollEntryData,
  ValidatedPayrollEntryData,
  BulkCreatePayrollEntriesPayload,
  CreatePayrollEntryPayload,
  OverwriteMode
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
  totalAmount?: number; // 总金额，用于统计显示
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
  overwriteMode: OverwriteMode;
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
  FieldMappingRule,
  OverwriteMode
};

/**
 * 通用导入系统类型定义入口
 * 统一导出所有类型定义
 */

// 从 universal.ts 重新导出所有类型（除了 OverwriteMode，避免冲突）
export type {
  ImportModeID,
  ImportModeConfig,
  FieldConfig,
  RawImportData,
  ProcessedRow,
  ValidationResult as UniversalValidationResult,
  ImportSettings as UniversalImportSettings,
  OverwriteModeOption
} from './universal'; 