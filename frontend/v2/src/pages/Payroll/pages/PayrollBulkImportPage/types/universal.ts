/**
 * 通用批量导入工具 - 类型定义
 * 支持多种导入模式：薪资数据、员工信息等
 */

import React from 'react';

// ================================
// 导入模式配置相关类型
// ================================

/**
 * 字段配置接口
 */
export interface FieldConfig {
  key: string;                    // 字段标识符
  name: string;                   // 显示名称
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  category: 'base' | 'earning' | 'deduction' | 'lookup' | 'calculated' | 'employee' | 'salary_base' | 'other';
  required: boolean;              // 是否必填
  lookupType?: string;           // 对于select类型字段的查找类型
  description?: string;          // 字段描述
  validation?: {
    min?: number;
    max?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  };
  defaultValue?: any;            // 默认值
}

/**
 * 映射提示配置
 */
export interface MappingHint {
  sourcePattern: RegExp;         // 源字段匹配模式
  targetField: string;           // 目标字段
  confidence: number;            // 置信度 (0-1)
  description?: string;          // 提示说明
}

/**
 * 验证规则配置
 */
export interface ValidationRule {
  type: 'required' | 'format' | 'range' | 'custom';
  fields: string[];              // 应用的字段
  rule: any;                     // 具体规则配置
  message: string;               // 错误消息
}

/**
 * 导入模式配置接口
 */
export interface ImportModeConfig {
  clientId?: string;            // 运行时分配的唯一ID，用于React的key
  id: string;                    // 模式唯一标识
  name: string;                  // 模式名称
  description: string;           // 模式描述
  icon: string;                  // 显示图标
  
  // 字段配置
  fields: FieldConfig[];         // 所有字段配置
  requiredFields: FieldConfig[]; // 必填字段
  optionalFields: FieldConfig[]; // 可选字段
  
  // 验证配置
  validationRules: ValidationRule[];
  
  // API配置
  apiEndpoints: {
    validate: string;            // 验证API
    execute: string;             // 执行API
    getRefData: string[];        // 获取参考数据API列表
  };
  
  // 映射配置
  fieldMappingHints: MappingHint[];
  
  // 样例和帮助
  sampleTemplate?: {
    headers: string[];
    sampleRows: any[][];
  };
  helpDocUrl?: string;
  
  // 导入设置
  importSettings?: {
    supportsBatch: boolean;      // 支持批量导入
    maxBatchSize: number;        // 最大批次大小
    requiresPeriodSelection: boolean; // 需要选择期间
    supportsOverwrite: boolean;  // 支持覆盖模式
    defaultOverwriteMode: boolean; // 默认覆盖模式
  };
}

// ================================
// 通用导入流程相关类型
// ================================

/**
 * 导入数据接口 (通用)
 */
export interface UniversalImportData {
  [key: string]: any;            // 动态字段
  clientId?: string;            // 客户端ID
  employee_id?: number;          // 员工ID
  employee_name?: string;        // 员工姓名
  id_number?: string;            // 身份证号
  social_insurance_base?: number; // 社保缴费基数
  housing_fund_base?: number;    // 公积金缴费基数
}

/**
 * 原始导入数据接口
 */
export interface RawImportData {
  headers: string[];
  rows: any[][];
  totalRecords: number;
  mode?: string;                 // 导入模式
}

/**
 * 通用映射规则
 */
export interface UniversalMappingRule {
  sourceField: string;           // 源字段名
  targetField: string;           // 目标字段名
  confidence: number;            // 映射置信度
  category: string;              // 字段类别
  required: boolean;             // 是否必填
  transform?: {                  // 数据转换配置
    type: 'none' | 'lookup' | 'format' | 'calculate';
    config?: any;
  };
}

/**
 * 通用验证结果
 */
export interface UniversalValidationResult {
  isValid: boolean;              // 整体是否有效
  totalRecords: number;          // 总记录数
  validRecords: number;          // 有效记录数
  invalidRecords: number;        // 无效记录数
  warnings: number;              // 警告数量
  errors: string[];              // 错误列表
  validatedData: any[];          // 验证后的数据
  summary?: Record<string, any>; // 额外的统计信息
}

/**
 * 通用导入设置
 */
export interface UniversalImportSettings {
  skipInvalidRecords: boolean;   // 跳过无效记录
  overwriteMode: 'none' | 'update' | 'replace';
  sendNotification: boolean;     // 发送通知
  batchSize?: number;           // 批次大小
  [key: string]: any;           // 模式特定的设置
}

/**
 * 通用导入结果
 */
export interface UniversalImportResult {
  success_count: number;
  error_count: number;
  warning_count?: number;
  errors?: Array<{
    index: number;
    record: any;
    error: string;
  }>;
  warnings?: Array<{
    index: number;
    record: any;
    warning: string;
  }>;
  summary?: Record<string, any>; // 额外的结果信息
}

// ================================
// 策略模式相关类型
// ================================

/**
 * 导入策略接口
 */
export interface ImportStrategy {
  /**
   * 获取模式配置
   */
  getModeConfig(): ImportModeConfig;
  
  /**
   * 获取必需的参考数据
   */
  getRequiredRefData(): Promise<Record<string, any[]>>;
  
  /**
   * 处理原始数据
   */
  processRawData(
    headers: string[], 
    rows: any[][], 
    mappingRules: UniversalMappingRule[]
  ): any[];
  
  /**
   * 验证数据
   */
  validateData(
    data: any[], 
    settings: UniversalImportSettings
  ): Promise<UniversalValidationResult>;
  
  /**
   * 执行导入
   */
  executeImport(
    data: any[], 
    settings: UniversalImportSettings
  ): Promise<UniversalImportResult>;
  
  /**
   * 生成样例模板
   */
  generateSampleTemplate(): {
    headers: string[];
    sampleRows: any[][];
  };
  
  /**
   * 验证设置
   */
  validateSettings?(settings: UniversalImportSettings): string[];
}

// ================================
// 组件Props相关类型
// ================================

/**
 * 模式选择器Props
 */
export interface ImportModeSelectorProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
  availableModes: ImportModeConfig[];
  loading?: boolean;
}

/**
 * 通用上传组件Props
 */
export interface UniversalDataUploadProps {
  mode: string;
  modeConfig: ImportModeConfig;
  loading: boolean;
  onDataParsed: (data: UniversalImportData) => void;
  onLoadingChange: (loading: boolean) => void;
}

/**
 * 通用映射组件Props
 */
export interface UniversalSmartMappingProps {
  mode: string;
  modeConfig: ImportModeConfig;
  importData: UniversalImportData;
  mappingRules: UniversalMappingRule[];
  settings: UniversalImportSettings;
  refData: Record<string, any[]>;
  loading: boolean;
  onMappingRulesChange: (rules: UniversalMappingRule[]) => void;
  onSettingsChange: (settings: UniversalImportSettings) => void;
  onValidateData: () => void;
  onBackToUpload: () => void;
}

/**
 * 通用预览组件Props
 */
export interface UniversalDataPreviewProps {
  mode: string;
  modeConfig: ImportModeConfig;
  validationResult: UniversalValidationResult;
  importData: UniversalImportData;
  settings: UniversalImportSettings;
  onSettingsChange: (settings: UniversalImportSettings) => void;
  onExecuteImport: () => void;
  onBackToMapping: () => void;
  loading: boolean;
  progress?: {
    current: number;
    total: number;
    message: string;
    stage: string;
  };
}

/**
 * 通用执行组件Props
 */
export interface UniversalImportExecutionProps {
  mode: string;
  modeConfig: ImportModeConfig;
  loading: boolean;
  importResult: UniversalImportResult | null;
  onContinueImport: () => void;
  onViewResults: () => void;
}

// ================================
// 步骤配置
// ================================

/**
 * 通用步骤配置
 */
export interface UniversalStepConfig {
  title: string;
  description: string;
  icon: string;
}

 