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
  { name: 'basic', priority: 1, patterns: ['*姓名*', '*身份证号*', '*部门*', '*岗位*', '*职务*', '*账号*', '*人员编号*', '*员工编号*', '*人员类别*', '*编制*'] },
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
  // 移除重要字段保护机制，所有字段都按照筛选规则处理
  
  // 防御性检查：如果filterConfig为undefined，返回true显示所有列
  if (!filterConfig) {
    console.warn('⚠️ [shouldShowField] filterConfig为undefined，默认显示所有列');
    return true;
  }
  
  // 1. 检查包含模式（白名单机制 - 优先级最高）
  if (filterConfig.includePatterns && filterConfig.includePatterns.length > 0) {
    let matched = false;
    for (const pattern of filterConfig.includePatterns) {
      if (matchesPattern(fieldName, pattern)) {
        console.log(`✅ [shouldShowField] 字段 "${fieldName}" 匹配包含模式 "${pattern}"`);
        matched = true;
        break;
      }
    }
    
    // 如果没有匹配任何包含模式，则排除该字段（严格白名单机制）
    if (!matched) {
      console.log(`❌ [shouldShowField] 字段 "${fieldName}" 不匹配任何包含模式，被排除`, filterConfig.includePatterns);
      return false;
    }
  }

  // 2. 检查排除模式（黑名单机制）
  if (filterConfig.excludePatterns && filterConfig.excludePatterns.length > 0) {
    for (const pattern of filterConfig.excludePatterns) {
      if (matchesPattern(fieldName, pattern)) {
        console.log(`❌ [shouldShowField] 字段 "${fieldName}" 匹配排除模式 "${pattern}"，被排除`);
        return false;
      }
    }
  }

  // 隐藏JSONB列 - 检查是否整个字段都是对象类型
  if (filterConfig.hideJsonbColumns === true) {
    const hasOnlyObjects = allData.some(item => {
      const value = (item as any)[fieldName];
      return typeof value === 'object' && value !== null;
    });
    if (hasOnlyObjects && typeof fieldValue === 'object' && fieldValue !== null) {
      console.log(`❌ [shouldShowField] 字段 "${fieldName}" 被隐藏（JSONB列）`);
      return false;
    }
  }

  // 隐藏空列
  if (filterConfig.hideEmptyColumns === true) {
    const hasNonEmptyValue = allData.some(item => {
      const value = (item as any)[fieldName];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });
    if (!hasNonEmptyValue) {
      console.log(`❌ [shouldShowField] 字段 "${fieldName}" 被隐藏（空列）`);
      return false;
    }
  }

  // 隐藏零值列（仅对数值类型字段有效）
  if (filterConfig.hideZeroColumns === true) {
    // 首先检查是否是数值类型的列
    const isNumericColumn = allData.some(item => {
      const value = (item as any)[fieldName];
      return typeof value === 'number' || 
             (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value)));
    });
    
    // 只对数值类型的列进行零值检查
    if (isNumericColumn) {
      const hasNonZeroValue = allData.some(item => {
        const value = (item as any)[fieldName];
        if (typeof value === 'number') {
          return value !== 0;
        }
        if (typeof value === 'string') {
          const numValue = parseFloat(value);
          return !isNaN(numValue) && numValue !== 0;
        }
        return false; // 对于数值列，非数值类型视为0
      });
      
      if (!hasNonZeroValue) {
        console.log(`❌ [shouldShowField] 数值字段 "${fieldName}" 被隐藏（零值列）`);
        return false;
      }
    }
    // 非数值列不受零值列隐藏规则影响
  }

  // 只显示数值列
  if (filterConfig.showOnlyNumericColumns === true) {
    const isNumericColumn = allData.some(item => {
      const value = (item as any)[fieldName];
      return typeof value === 'number' || 
             (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value)));
    });
    if (!isNumericColumn) {
      console.log(`❌ [shouldShowField] 字段 "${fieldName}" 被隐藏（非数值列）`);
      return false;
    }
  }

  // 数值范围检查
  if ((filterConfig.minValueThreshold && filterConfig.minValueThreshold > 0) || 
      (filterConfig.maxValueThreshold && filterConfig.maxValueThreshold < Infinity)) {
    const maxValue = Math.max(...allData.map(item => {
      const value = (item as any)[fieldName];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        return !isNaN(numValue) ? numValue : 0;
      }
      return 0;
    }));

    if ((filterConfig.minValueThreshold && maxValue < filterConfig.minValueThreshold) || 
        (filterConfig.maxValueThreshold && maxValue > filterConfig.maxValueThreshold)) {
      console.log(`❌ [shouldShowField] 字段 "${fieldName}" 被隐藏（数值范围）`);
      return false;
    }
  }

  // 通过所有过滤条件
  console.log(`✅ [shouldShowField] 字段 "${fieldName}" 通过所有筛选条件，将显示`);
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
// 文件: ColumnConfig.tsx

// ... (文件顶部的所有 import 和 payrollDataUtils 等函数保持不变) ...

/**
 * 创建单个列配置 (生产环境最终版)
 */
export const createColumnConfig = (
  fieldName: string,
  sampleValue: any,
  allData: PayrollData[]
): ProColumns<PayrollData> => {
  
  const column: ProColumns<PayrollData> = {
    title: fieldName, // 这里使用原始字段名作为标题
    dataIndex: fieldName,
    key: fieldName,
    ellipsis: true,
    width: 150, // 可以设置一个默认宽度
  };

  // 渲染函数 - 处理React元素污染和数据显示
  column.render = (cellValue: any, record: any, index: number) => {
    // React元素检测函数
    const isReactElement = (val: any): boolean => {
      return val && (
        val.$$typeof === Symbol.for('react.element') ||
        val.$$typeof === Symbol.for('react.portal') ||
        val.$$typeof === Symbol.for('react.fragment') ||
        (typeof val === 'object' && val !== null && (
          val.$$typeof || 
          val.$typeof || 
          (val.type && val.props) ||
          (val._owner !== undefined)
        ))
      );
    };

    // 1. React元素检测和数据提取
    if (isReactElement(cellValue)) {
      try {
        if (cellValue.props && cellValue.props.children !== undefined) {
          const extractedValue = cellValue.props.children;
          if (typeof extractedValue === 'number') {
            return extractedValue.toLocaleString();
          }
          return String(extractedValue);
        }
        if (cellValue.props && cellValue.props.value !== undefined) {
          const extractedValue = cellValue.props.value;
          if (typeof extractedValue === 'number') {
            return extractedValue.toLocaleString();
          }
          return String(extractedValue);
        }
        if (cellValue.props) {
          const propsKeys = Object.keys(cellValue.props);
          for (const key of propsKeys) {
            const value = cellValue.props[key];
            if (typeof value === 'string' || typeof value === 'number') {
              if (typeof value === 'number') {
                return value.toLocaleString();
              }
              return String(value);
            }
          }
        }
      } catch (e) {
        // 提取失败，降级处理
      }
      
      return '[无法提取数据]';
    }
    
    // 2. null/undefined 检查
    if (cellValue === null || cellValue === undefined) {
      return '-';
    }

    // 3. 对象类型处理
    if (typeof cellValue === 'object' && cellValue !== null) {
      // 数组处理
      if (Array.isArray(cellValue)) {
        return `[数组:${cellValue.length}项]`;
      }
      
      // 普通对象 - 尝试找到值属性
      const possibleValueKeys = ['value', 'text', 'label', 'name', 'title', 'content', 'data'];
      for (const key of possibleValueKeys) {
        if (key in cellValue && cellValue[key] !== null && cellValue[key] !== undefined) {
          const extractedValue = cellValue[key];
          if (typeof extractedValue === 'number') {
            return extractedValue.toLocaleString();
          }
          return String(extractedValue);
        }
      }
      
      // 使用第一个有效属性
      const objKeys = Object.keys(cellValue);
      for (const key of objKeys) {
        const value = cellValue[key];
        if (typeof value !== 'function' && value !== null && value !== undefined) {
          if (typeof value === 'number') {
            return value.toLocaleString();
          }
          return String(value);
        }
      }
      
      // 最后尝试JSON序列化（简化版）
      try {
        const jsonStr = JSON.stringify(cellValue);
        if (jsonStr.length > 50) {
          return `[对象: ${objKeys.slice(0, 3).join(', ')}]`;
        }
        return jsonStr;
      } catch (e) {
        return '[复杂对象]';
      }
    }

    // 3. 原始类型直接显示
    if (typeof cellValue === 'boolean') {
      return cellValue ? '是' : '否';
    }
    
    if (typeof cellValue === 'number') {
      return cellValue.toLocaleString();
    }
    
    // 4. 字符串类型
    if (typeof cellValue === 'string') {
      return cellValue || '-';
    }
    
    // 5. 其他情况
    return String(cellValue);
  };


  // --- 根据数据类型配置 sorter, filter 等 ---
  // 注意：这里的排序和筛选逻辑也需要从对象中提取 .value
  const hasNumericValue = sampleValue && typeof sampleValue.value === 'number';

  if (hasNumericValue) {
    column.sorter = (a: any, b: any) => {
      // 安全地从对象中提取值进行比较
      const aField = a[fieldName];
      const bField = b[fieldName];
      const aVal = (aField && typeof aField === 'object' && 'value' in aField) ? aField.value || 0 : (aField || 0);
      const bVal = (bField && typeof bField === 'object' && 'value' in bField) ? bField.value || 0 : (bField || 0);
      return aVal - bVal;
    };
  } else {
    // 字符串排序
    column.sorter = (a: any, b: any) => {
      // 安全地从对象中提取值进行比较
      const aField = a[fieldName];
      const bField = b[fieldName];
      const aVal = String((aField && typeof aField === 'object' && 'value' in aField) ? aField.value || '' : (aField || ''));
      const bVal = String((bField && typeof bField === 'object' && 'value' in bField) ? bField.value || '' : (bField || ''));
      return aVal.localeCompare(bVal, 'zh-CN');
    }
  }

  return column;
};

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

  console.log('🔍 [generateColumns] 开始生成列配置', {
    dataLength: data.length,
    hasEmployeeName: data[0] ? '员工姓名' in data[0] : false,
    allFields: data[0] ? Object.keys(data[0]) : [],
    filterConfig: {
      includePatterns: filterConfig.includePatterns,
      excludePatterns: filterConfig.excludePatterns,
      hideEmptyColumns: filterConfig.hideEmptyColumns,
      hideZeroColumns: filterConfig.hideZeroColumns,
      showOnlyNumericColumns: filterConfig.showOnlyNumericColumns
    }
  });

  // 1. 先获取所有可能的列
  const allColumns = data[0] ? Object.keys(data[0]).map(field => 
    createColumnConfig(field, data[0][field as keyof PayrollData], data)
  ) : [];

  console.log('🔍 [generateColumns] 所有可能的列:', allColumns.map(col => col.title));

  // 2. 检查可用的列
  
  // 3. 应用过滤条件
  
  // 直接应用筛选规则，不设置特殊字段
  
  const filteredColumns = allColumns.filter(col => {
    const fieldName = col.title as string;
    
    console.log(`🔍 [generateColumns] 检查字段 "${fieldName}"`);
    
    // 应用筛选规则
    const shouldShow = shouldShowField(
      fieldName, 
      data[0][fieldName as keyof PayrollData], 
      data, 
      filterConfig
    );
    
    // 记录筛选结果
    if (!shouldShow) {
      console.log(`❌ [generateColumns] 字段 "${fieldName}" 被筛选规则过滤掉`);
    } else {
      console.log(`✅ [generateColumns] 字段 "${fieldName}" 通过筛选规则`);
    }
    
    return shouldShow;
  });

  console.log(`🔍 [generateColumns] 过滤后剩余 ${filteredColumns.length} 列，原始 ${allColumns.length} 列`);
  console.log('🔍 [generateColumns] 过滤后的列:', filteredColumns.map(col => col.title));

  // 4. 按字段组重新排序列
  const sortedColumns = filteredColumns.sort((a, b) => {
    const aGroup = getFieldGroup(a.title as string);
    const bGroup = getFieldGroup(b.title as string);
    
    if (aGroup.priority !== bGroup.priority) {
      return aGroup.priority - bGroup.priority;
    }
    
    return (a.title as string).localeCompare(b.title as string, 'zh-CN');
  });

  console.log('✅ [generateColumns] 列配置完成:', sortedColumns.length, '列');

  return sortedColumns;
};