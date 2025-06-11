import React from 'react';
import {
  CloudUploadOutlined,
  SettingOutlined,
  EyeOutlined,
  RocketOutlined
} from '@ant-design/icons';
import type { StepConfig } from './index';
import { OverwriteMode } from '../../../types/payrollTypes';

// 步骤配置
export const STEPS_CONFIG: StepConfig[] = [
  {
    title: '数据准备',
    description: '上传或输入薪资数据',
    icon: <CloudUploadOutlined />,
    content: 'upload'
  },
  {
    title: '智能映射',
    description: '自动匹配字段映射',
    icon: <SettingOutlined />,
    content: 'mapping'
  },
  {
    title: '数据预览',
    description: '预览和验证数据',
    icon: <EyeOutlined />,
    content: 'preview'
  },
  {
    title: '执行导入',
    description: '完成数据导入',
    icon: <RocketOutlined />,
    content: 'execute'
  }
];

// 文件类型配置
export const VALID_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv' // .csv
];

// 默认导入设置
export const DEFAULT_IMPORT_SETTINGS = {
  skipInvalidRecords: true,
  overwriteMode: OverwriteMode.NONE,
  sendNotification: true
};

// 字段类型配置 - 现在使用国际化
export const FIELD_TYPE_CONFIG = {
  base: { color: 'blue', text: 'base' },
  earning: { color: 'green', text: 'earning' },
  deduction: { color: 'orange', text: 'deduction' },
  calculated: { color: 'purple', text: 'calculated' },
  ignore: { color: 'default', text: 'ignore' },
  stat: { color: '#1890ff', text: 'stat' },
  other: { color: '#fa8c16', text: 'other' }
} as const;

// 验证结果摘要接口
export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  errors: string[];
  // 兼容旧版本的字段名
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

// 上传结果接口
export interface UploadResult {
  success_count: number;
  error_count: number;
  errors?: Array<{
    index: number;
    employee_id?: number;
    error: string;
  }>;
  // 兼容旧版本的字段名
  successCount: number;
  errorCount: number;
  createdEntries?: any[];
} 