import type { OverwriteModeOption } from '../types/universal';
import { OverwriteMode } from '../../../types/payrollTypes';

/**
 * 覆写模式选项配置
 * 用户友好的命名和说明，避免技术术语
 */
export const OVERWRITE_MODE_OPTIONS: OverwriteModeOption[] = [
  {
    value: OverwriteMode.NONE,
    label: '仅添加新员工',
    description: '只导入系统中不存在的员工，已存在的员工将被跳过',
    icon: '➕',
    risk: 'low'
  },
  {
    value: OverwriteMode.PARTIAL, 
    label: '更新并添加',
    description: '更新已存在员工的薪资数据，同时添加新员工',
    icon: '🔄',
    risk: 'medium',
    warning: '将覆盖已存在员工的薪资数据'
  }
];

/**
 * 获取覆写模式的后端API值映射
 */
export const getBackendOverwriteMode = (mode: OverwriteMode): string => {
  switch (mode) {
    case OverwriteMode.NONE:
      return 'none';     // 后端的 'none' 对应前端的 'none'
    case OverwriteMode.PARTIAL:
      return 'partial';  // 后端的 'partial' 对应前端的 'partial'
    default:
      return 'none';
  }
};

/**
 * 默认导入设置
 */
export const DEFAULT_IMPORT_SETTINGS = {
  overwriteMode: OverwriteMode.NONE,
  showPreview: true,
  confirmBeforeExecute: true
}; 