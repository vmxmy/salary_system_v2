import React from 'react';
import { type ProColumns } from '@ant-design/pro-components';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { 
  formatNumber, 
  renderNumber, 
  formatDate, 
  formatDateToChinese,
  safeStringify,
  matchesPattern,
  formatObjectForDisplay
} from '../../utils/payrollDataUtils';
import type { ComprehensivePayrollDataView } from '../../pages/Payroll/services/payrollViewsApi';
import type { ColumnFilterConfig } from '../../hooks/usePayrollDataProcessing';

// 工资数据类型定义
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number;
}

// 字段组定义
export interface FieldGroup {
  name: string;
  priority: number;
  patterns: string[];
}

// 默认字段组配置
export const defaultFieldGroups: FieldGroup[] = [
  { name: 'basic', priority: 1, patterns: ['姓名', '身份证号', '部门', '岗位', '职务', '账号', '人员编号'] },
  { name: 'salary', priority: 2, patterns: ['*工资*', '*薪酬*', '*基本*', '*岗位*', '*职务*', '*津贴*', '*补贴*'] },
  { name: 'bonus', priority: 3, patterns: ['*奖金*', '*绩效*', '*考核*', '*年终*'] },
  { name: 'allowance', priority: 4, patterns: ['*补助*', '*费用*', '*交通*', '*通讯*', '*住房*'] },
  { name: 'deduction', priority: 5, patterns: ['*扣除*', '*扣*', '*代扣*', '*个税*', '*社保*', '*公积金*'] },
  { name: 'insurance', priority: 6, patterns: ['*保险*', '*医疗*', '*养老*', '*失业*', '*工伤*', '*生育*'] },
  { name: 'fund', priority: 7, patterns: ['*公积金*', '*住房*基金*'] },
  { name: 'other', priority: 8, patterns: ['*其他*', '*备注*', '*说明*'] },
  { name: 'period', priority: 9, patterns: ['*期间*', '*月份*', '*年月*'] },
  { name: 'total', priority: 10, patterns: ['*合计*', '*总计*', '*应发*', '*实发*', '*净额*'] }
];

/**
 * 获取字段所属组
 */
export const getFieldGroup = (fieldName: string, fieldGroups: FieldGroup[] = defaultFieldGroups): FieldGroup => {
  for (const group of fieldGroups) {
    for (const pattern of group.patterns) {
      if (matchesPattern(fieldName, pattern)) {
        return group;
      }
    }
  }
  return { name: 'unknown', priority: 999, patterns: [] };
};

/**
 * 判断字段是否应该显示
 */
export const shouldShowField = (
  fieldName: string, 
  fieldValue: any, 
  allData: PayrollData[], 
  filterConfig: ColumnFilterConfig
): boolean => {
  // 检查包含模式
  if (filterConfig.includePatterns.length > 0) {
    const shouldInclude = filterConfig.includePatterns.some(pattern => 
      matchesPattern(fieldName, pattern)
    );
    if (!shouldInclude) return false;
  }

  // 检查排除模式
  if (filterConfig.excludePatterns.length > 0) {
    const shouldExclude = filterConfig.excludePatterns.some(pattern => 
      matchesPattern(fieldName, pattern)
    );
    if (shouldExclude) return false;
  }

  // 隐藏JSONB列 - 检查是否整个字段都是对象类型
  if (filterConfig.hideJsonbColumns) {
    const hasOnlyObjects = allData.every(item => {
      const value = (item as any)[fieldName];
      return typeof value === 'object' && value !== null;
    });
    if (hasOnlyObjects && typeof fieldValue === 'object' && fieldValue !== null) {
      return false;
    }
  }

  // 隐藏空列
  if (filterConfig.hideEmptyColumns) {
    const hasNonEmptyValue = allData.some(item => {
      const value = (item as any)[fieldName];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });
    if (!hasNonEmptyValue) return false;
  }

  // 隐藏零值列
  if (filterConfig.hideZeroColumns) {
    const hasNonZeroValue = allData.some(item => {
      const value = (item as any)[fieldName];
      if (typeof value === 'number') {
        return value !== 0;
      }
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        return !isNaN(numValue) && numValue !== 0;
      }
      return true;
    });
    if (!hasNonZeroValue) return false;
  }

  // 只显示数值列
  if (filterConfig.showOnlyNumericColumns) {
    const isNumericColumn = allData.some(item => {
      const value = (item as any)[fieldName];
      return typeof value === 'number' || 
             (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value)));
    });
    if (!isNumericColumn) return false;
  }

  // 数值范围检查
  if (filterConfig.minValueThreshold > 0 || filterConfig.maxValueThreshold < Infinity) {
    const maxValue = Math.max(...allData.map(item => {
      const value = (item as any)[fieldName];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        return !isNaN(numValue) ? numValue : 0;
      }
      return 0;
    }));

    if (maxValue < filterConfig.minValueThreshold || maxValue > filterConfig.maxValueThreshold) {
      return false;
    }
  }

  return true;
};

/**
 * 检查字段中是否包含对象类型数据
 */
const hasObjectData = (fieldName: string, allData: PayrollData[]): boolean => {
  return allData.some(item => {
    const value = (item as any)[fieldName];
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  });
};

/**
 * 检查字段的混合数据类型
 */
const analyzeFieldDataTypes = (fieldName: string, allData: PayrollData[]) => {
  const types = new Set<string>();
  let hasObjects = false;
  let hasNumbers = false;
  let hasStrings = false;
  let hasBooleans = false;
  let hasNulls = false;
  
  allData.slice(0, 100).forEach(item => { // 检查前100个样本
    const value = (item as any)[fieldName];
    const type = typeof value;
    
    // 特殊处理 null 值
    if (value === null) {
      hasNulls = true;
      types.add('null');
    } else {
      types.add(type);
      
      if (type === 'object' && !Array.isArray(value)) {
        hasObjects = true;
      } else if (type === 'number' || (type === 'string' && !isNaN(parseFloat(value)))) {
        hasNumbers = true;
      } else if (type === 'string') {
        hasStrings = true;
      } else if (type === 'boolean') {
        hasBooleans = true;
      }
    }
  });
  
  return { types, hasObjects, hasNumbers, hasStrings, hasBooleans, hasNulls };
};

/**
 * 创建单个列配置
 */
// 文件: ColumnConfig.tsx

// ... (文件顶部的所有 import 和其他函数保持不变) ...

/**
 * 创建单个列配置 (最终调试版)
 */
// 文件: ColumnConfig.tsx

// ... (import 和其他辅助函数保持不变) ...

/**
 * 创建单个列配置 (生产环境最终版)
 */
// 文件: ColumnConfig.tsx

// ... (文件顶部的所有 import 和其他函数保持不变) ...

/**
 * 创建单个列配置 (最终调试版)
 */
export const createColumnConfig = (
  fieldName: string,
  sampleValue: any,
  allData: PayrollData[]
): ProColumns<PayrollData> => {
  
  const column: ProColumns<PayrollData> = {
    title: fieldName,
    dataIndex: fieldName,
    key: fieldName,
    // ... 其他基础配置
  };

  // ======================[ 最终核心修改 ]======================
  // 这是我们最终的 render 函数，它将捕获到副本
  column.render = (value: any, record: any, index: number) => {
    
    // **决定性检查**：检查传入的 record 是否还是被冻结的状态
    // 如果不是，说明它是一个副本，我们在这里立即抛出错误来捕获堆栈！
    if (!Object.isFrozen(record)) {
      console.error(`🚨🚨🚨 [污染源头已锁定!] 字段 "${fieldName}" 在渲染时收到了一个未被冻结的“副本”数据。这意味着在 ProTable 内部的某个地方数据被复制并污染了。`, {
        fieldName,
        record,
      });
      // 抛出一个自定义的、明确的错误，以便我们捕获其堆栈跟踪
      throw new Error(`[Data Contamination] Unfrozen record copy detected for field: "${fieldName}"`);
    }

    // --- 以下是正常的渲染逻辑 ---

    // 检查已知的污染 (作为第二道防线)
    if (typeof value === 'object' && value !== null && (value.$$typeof || (value.type && value.props))) {
      console.error(`🚨 [CRITICAL] 字段 "${fieldName}" 接收到React元素作为输入值，数据已被污染!`, value);
      return '❌数据错误';
    }

    // null 或 undefined 值处理
    if (value === null || value === undefined) {
      return '-';
    }
    
    // 根据数据类型进行渲染
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    if (typeof value === 'number') {
      return renderNumber(value); 
    }
    if (typeof value === 'object' && value !== null) {
      return formatObjectForDisplay(value);
    }
    
    // 默认作为字符串处理
    return String(value);
  };
  // ======================[ 修改结束 ]======================

  // ... (函数剩余的 sorter, filter, width 等配置逻辑可以保持原样) ...

  return column;
};

// ... (文件底部的其他函数 generateColumns, updateColumnConfig 等保持不变) ...

// ... (文件底部的其他函数 generateColumns, updateColumnConfig 等保持不变) ...
/**
 * 获取列的统计信息
 */
export const getColumnStats = (data: PayrollData[], fieldName: string) => {
  const values = data.map(item => (item as any)[fieldName]).filter(v => v !== null && v !== undefined);
  
  return {
    total: values.length,
    unique: new Set(values).size,
    empty: data.length - values.length,
    numeric: values.filter(v => typeof v === 'number' || !isNaN(parseFloat(String(v)))).length,
    maxLength: Math.max(...values.map(v => String(v).length)),
    minLength: Math.min(...values.map(v => String(v).length))
  };
};

/**
 * 生成动态列配置
 */
export const generateColumns = (
  data: PayrollData[], 
  filterConfig: ColumnFilterConfig
): ProColumns<PayrollData>[] => {
  if (!data || data.length === 0) return [];

  const columns = data[0] ? Object.keys(data[0]).map(field => 
    createColumnConfig(field, data[0][field as keyof PayrollData], data)
  ) : [];

  return columns;
};