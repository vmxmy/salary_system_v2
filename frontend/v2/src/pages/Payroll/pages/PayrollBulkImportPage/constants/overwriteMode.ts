import type { OverwriteModeOption } from '../types/universal';

/**
 * 覆写模式选项配置
 * 用户友好的命名和说明，避免技术术语
 */
export const OVERWRITE_MODE_OPTIONS: OverwriteModeOption[] = [
  {
    value: 'append',
    label: '仅添加新员工',
    description: '只导入系统中不存在的员工，已存在的员工将被跳过',
    icon: '➕',
    risk: 'low'
  },
  {
    value: 'replace', 
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
export const getBackendOverwriteMode = (mode: 'append' | 'replace'): string => {
  switch (mode) {
    case 'append':
      return 'none';     // 后端的 'none' 对应前端的 'append'
    case 'replace':
      return 'partial';  // 后端的 'partial' 对应前端的 'replace'
    default:
      return 'none';
  }
};

/**
 * 默认导入设置
 */
export const DEFAULT_IMPORT_SETTINGS = {
  overwriteMode: 'append' as const,
  showPreview: true,
  confirmBeforeExecute: true
}; 