import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { type ProColumns } from '@ant-design/pro-components';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// 导入工具函数
import { 
  formatNumber, 
  renderNumber, 
  formatDate, 
  formatDateToChinese,
  safeStringify,
  matchesPattern,
  extractTextFromRender,
  cleanValue,
  processValue
} from '../utils/payrollDataUtils';
import { SearchMode } from '../utils/searchUtils';

import type { ComprehensivePayrollDataView } from '../pages/Payroll/services/payrollViewsApi';

// 筛选配置接口
export interface ColumnFilterConfig {
  hideJsonbColumns: boolean;
  hideZeroColumns: boolean;
  hideEmptyColumns: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  minValueThreshold: number;
  maxValueThreshold: number;
  showOnlyNumericColumns: boolean;
}

// 默认筛选配置
export const defaultFilterConfig: ColumnFilterConfig = {
  hideJsonbColumns: true,
  hideZeroColumns: true,
  hideEmptyColumns: true,
  includePatterns: [],
  excludePatterns: ['*id', '*时间', '*日期'],
  minValueThreshold: 0,
  maxValueThreshold: Infinity,
  showOnlyNumericColumns: false,
};

// 表格筛选状态
export interface TableFilterState {
  current?: number;
  pageSize?: number;
  sorter?: any;
  filters?: Record<string, any>;
}

// 工资数据类型定义
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number;
}

// Hook 参数接口
interface UsePayrollDataProcessingParams {
  data: PayrollData[];
  periodName?: string;
  searchResults?: Set<number>;
  searchMode?: SearchMode;
}

export const usePayrollDataProcessing = ({
  data,
  periodName,
  searchResults,
  searchMode = SearchMode.AUTO
}: UsePayrollDataProcessingParams) => {
  // 状态管理
  const [filterConfig, setFilterConfig] = useState<ColumnFilterConfig>(defaultFilterConfig);
  const [tableFilterState, setTableFilterState] = useState<TableFilterState>({});
  const [currentColumnsState, setCurrentColumnsState] = useState<ProColumns<PayrollData>[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // 过滤后的数据源
  const filteredDataSource = useMemo(() => {
    const TRACE_FIELD = '职位等级';
    let filtered = data || [];

    // 🔍 追踪目标字段在处理前的状态
    if (filtered[0] && filtered[0][TRACE_FIELD] !== undefined) {
      console.log(`🔍 [Processing开始] ${TRACE_FIELD}:`, filtered[0][TRACE_FIELD], `(类型: ${typeof filtered[0][TRACE_FIELD]})`);
    }

    // 应用搜索筛选
    if (searchResults && searchResults.size > 0) {
      filtered = filtered.filter((item, index) => searchResults.has(index));
    }

    // 应用表格筛选
    if (tableFilterState.filters) {
      Object.entries(tableFilterState.filters).forEach(([key, value]) => {
        if (value && value.length > 0) {
          filtered = filtered.filter(item => {
            const fieldValue = (item as any)[key];
            return value.includes(fieldValue);
          });
        }
      });
    }

    // 🔍 追踪目标字段在筛选后的状态
    if (filtered[0] && filtered[0][TRACE_FIELD] !== undefined) {
      console.log(`🔍 [Processing筛选后] ${TRACE_FIELD}:`, filtered[0][TRACE_FIELD], `(类型: ${typeof filtered[0][TRACE_FIELD]})`);
    }

    return filtered;
  }, [data, searchResults, tableFilterState.filters]);

  // 字段组定义
  const fieldGroups = useMemo(() => [
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
  ], []);

  // 获取字段所属组
  const getFieldGroup = useCallback((fieldName: string) => {
    for (const group of fieldGroups) {
      for (const pattern of group.patterns) {
        if (matchesPattern(fieldName, pattern)) {
          return group;
        }
      }
    }
    return { name: 'unknown', priority: 999, patterns: [] };
  }, [fieldGroups]);

  // 判断字段是否应该显示
  const shouldShowField = useCallback((fieldName: string, fieldValue: any, allData: PayrollData[]) => {
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

    // 隐藏JSONB列
    if (filterConfig.hideJsonbColumns && typeof fieldValue === 'object' && fieldValue !== null) {
      return false;
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

    return true;
  }, [filterConfig]);

  // 生成动态列配置
  const generateColumns = useCallback((data: PayrollData[]): ProColumns<PayrollData>[] => {
    const TRACE_FIELD = '职位等级';
    if (!data || data.length === 0) return [];

    const firstRecord = data[0];
    const fields = Object.keys(firstRecord);
    
    // 🔍 追踪目标字段在列生成时的状态
    if (firstRecord[TRACE_FIELD] !== undefined) {
      console.log(`🔍 [列生成] ${TRACE_FIELD}:`, firstRecord[TRACE_FIELD], `(类型: ${typeof firstRecord[TRACE_FIELD]})`);
    }
    
    // 生成列配置
    const columns: ProColumns<PayrollData>[] = fields
      .filter(field => shouldShowField(field, firstRecord[field as keyof PayrollData], data))
      .map((field): ProColumns<PayrollData> => {
        // 获取字段的示例值以确定数据类型 - 修正null值处理
        const sampleValue = firstRecord[field as keyof PayrollData];
        const isNull = sampleValue === null;
        const isNumeric = typeof sampleValue === 'number' || 
                         (typeof sampleValue === 'string' && !isNaN(parseFloat(sampleValue as string)));
        const isDate = field.includes('期间') || field.includes('时间') || field.includes('日期');
        const isBoolean = typeof sampleValue === 'boolean';

        // 基础列配置
        const column: ProColumns<PayrollData> = {
          title: field,
          dataIndex: field,
          key: field,
          width: 120,
          ellipsis: true,
          sorter: true,
          fixed: false,
        };

        // 设置渲染函数 - 确保渲染函数不会污染数据
        if (isBoolean) {
          column.render = (value: any, record: any, index: number) => {
            // 确保只在表格渲染时创建React元素
            if (value === true) {
              return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            } else if (value === false) {
              return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
            }
            return <span style={{ color: '#999' }}>-</span>;
          };
          column.filters = [
            { text: '是', value: true },
            { text: '否', value: false }
          ];
          column.onFilter = (value, record) => (record as any)[field] === value;
        } else if (isNumeric) {
          column.render = (value: any, record: any, index: number) => {
            // 确保只返回React元素用于显示
            return renderNumber(value);
          };
          column.sorter = (a, b) => {
            const aVal = parseFloat(String((a as any)[field])) || 0;
            const bVal = parseFloat(String((b as any)[field])) || 0;
            return aVal - bVal;
          };
        } else if (isDate && !isNull) {
          column.render = (value: any, record: any, index: number) => {
            // 确保只返回React元素用于显示
            return field.includes('期间') ? formatDate(value) : formatDateToChinese(value);
          };
          column.width = 100;
        } else if (typeof sampleValue === 'object' && sampleValue !== null) {
          column.render = (value: any, record: any, index: number) => (
            <pre style={{ margin: 0, fontSize: '12px', maxWidth: '200px', overflow: 'auto' }}>
              {safeStringify(value)}
            </pre>
          );
          column.width = 200;
        } else {
          // 字符串类型，添加筛选功能
          const uniqueValues = Array.from(new Set(
            data.map(item => (item as any)[field])
              .filter(value => value !== null && value !== undefined && value !== '')
              .slice(0, 50) // 限制筛选选项数量
          ));
          
          if (uniqueValues.length > 1 && uniqueValues.length <= 20) {
            column.filters = uniqueValues.map(value => ({
              text: String(value),
              value: value
            }));
            column.onFilter = (value, record) => (record as any)[field] === value;
          }
        }

        return column;
      });

    // 按字段组重新排序列
    const sortedColumns = columns.sort((a, b) => {
      const aGroup = getFieldGroup(a.title as string);
      const bGroup = getFieldGroup(b.title as string);
      
      if (aGroup.priority !== bGroup.priority) {
        return aGroup.priority - bGroup.priority;
      }
      
      return (a.title as string).localeCompare(b.title as string, 'zh-CN');
    });

    return sortedColumns;
  }, [shouldShowField, getFieldGroup]);

  // 导出到Excel
  const exportToExcel = useCallback(async (exportData: PayrollData[], columns: ProColumns<PayrollData>[]) => {
    try {
      message.loading({ content: '正在生成Excel文件...', key: 'export' });

      // 获取可见列并排序
      const visibleColumns = columns
        .filter(col => !col.hideInTable)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      // 生成表头
      const headers = visibleColumns.map(col => col.title as string);

      // 处理数据
      const processedData = exportData.map((record, index) => {
        const row: any = {};
        
        visibleColumns.forEach(col => {
          const fieldName = col.dataIndex as string;
          const rawValue = (record as any)[fieldName];
          
          // 使用与表格相同的处理逻辑
          const processedValue = processValue(rawValue, col, record, index);
          row[col.title as string] = processedValue;
        });
        
        return row;
      });

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(processedData, { header: headers });

      // 设置列宽
      const colWidths = visibleColumns.map(col => {
        const title = col.title as string;
        const maxLength = Math.max(
          title.length,
          ...processedData.slice(0, 100).map(row => 
            String(row[title] || '').length
          )
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      ws['!cols'] = colWidths;

      // 添加工作表到工作簿
      const sheetName = `工资数据_${periodName || '未知期间'}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // 生成文件名
      const fileName = `工资数据_${periodName || '导出'}_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.xlsx`;

      // 导出文件
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, fileName);

      message.success({ content: `导出完成！文件：${fileName}`, key: 'export' });
      
      return true;
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error({ content: '导出失败，请重试', key: 'export' });
      return false;
    }
  }, [periodName]);

  // 生成列配置（当数据变化时）
  useEffect(() => {
    if (data && data.length > 0) {
      const columns = generateColumns(data);
      setCurrentColumnsState(columns);
    }
  }, [data, generateColumns]);

  return {
    // 数据
    filteredDataSource,
    currentColumnsState,
    
    // 状态
    filterConfig,
    tableFilterState,
    pagination,
    
    // 状态更新函数
    setFilterConfig,
    setTableFilterState,
    setPagination,
    setCurrentColumnsState,
    
    // 功能函数
    generateColumns,
    exportToExcel,
    shouldShowField,
    getFieldGroup,
    
    // 工具函数
    formatNumber,
    renderNumber,
    formatDate,
    formatDateToChinese,
    safeStringify,
    matchesPattern,
    extractTextFromRender,
    cleanValue,
    processValue
  };
};