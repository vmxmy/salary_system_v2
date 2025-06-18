import type { OverwriteModeOption } from '../types/universal';
import { OverwriteMode } from '../../../types/payrollTypes';

/**
 * 覆写模式选项配置
 * 简化为智能导入策略，减少用户决策负担
 */
export const OVERWRITE_MODE_OPTIONS: OverwriteModeOption[] = [
  {
    value: OverwriteMode.SMART_MERGE,
    label: '智能导入（推荐）',
    description: '新员工直接添加，已存在员工智能合并更新（只更新Excel中有数据的字段）',
    icon: '🧠',
    risk: 'low',
    isDefault: true
  },
  {
    value: OverwriteMode.NONE,
    label: '仅添加新员工',
    description: '只导入系统中不存在的员工，已存在的员工将被跳过',
    icon: '➕',
    risk: 'low'
  },
  {
    value: OverwriteMode.PARTIAL, 
    label: '强制覆盖',
    description: '新员工直接添加，已存在员工完全替换整条记录',
    icon: '🔄',
    risk: 'high',
    warning: '将完全替换已存在员工的所有薪资数据，请谨慎使用'
  }
];

/**
 * 获取覆写模式的后端API值映射
 */
export const getBackendOverwriteMode = (mode: OverwriteMode): string => {
  switch (mode) {
    case OverwriteMode.NONE:
      return 'none';        // 后端的 'none' 对应前端的 'none'
    case OverwriteMode.SMART_MERGE:
      return 'smart_merge'; // 后端的 'smart_merge' 对应前端的 'smart_merge'
    case OverwriteMode.PARTIAL:
      return 'partial';     // 后端的 'partial' 对应前端的 'partial'
    default:
      return 'smart_merge'; // 默认使用智能合并模式
  }
};

/**
 * 默认导入设置
 */
export const DEFAULT_IMPORT_SETTINGS = {
  overwriteMode: OverwriteMode.SMART_MERGE, // 默认使用智能合并模式
  showPreview: true,
  confirmBeforeExecute: true
}; 