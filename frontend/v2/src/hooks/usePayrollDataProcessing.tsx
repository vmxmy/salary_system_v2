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
import { createColumnConfig, generateColumns as generateColumnsFromConfig, shouldShowField } from '../components/PayrollDataModal/ColumnConfig';

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
    console.log('🔄 [usePayrollDataProcessing] 开始数据过滤', {
      originalDataCount: data?.length || 0,
      hasSearchResults: !!(searchResults && searchResults.size > 0),
      searchResultsSize: searchResults?.size || 0,
      hasTableFilters: !!(tableFilterState.filters && Object.keys(tableFilterState.filters).length > 0)
    });
    
    let filtered = data || [];

    // 应用搜索筛选
    if (searchResults && searchResults.size > 0) {
      console.log('🔍 [usePayrollDataProcessing] 应用搜索过滤', {
        originalCount: filtered.length,
        searchIndices: Array.from(searchResults).slice(0, 10)
      });
      
      filtered = filtered.filter((item, index) => {
        const included = searchResults.has(index);
        if (included && index < 3) {
          console.log(`✅ [搜索过滤] 索引${index}包含:`, {
            员工姓名: (item as any)['员工姓名'],
            员工编号: (item as any)['员工编号']
          });
        }
        return included;
      });
      
      console.log('✅ [usePayrollDataProcessing] 搜索过滤完成', {
        filteredCount: filtered.length,
        sampleFiltered: filtered.slice(0, 2).map(item => ({
          员工姓名: (item as any)['员工姓名'],
          员工编号: (item as any)['员工编号']
        }))
      });
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

    console.log('✅ [usePayrollDataProcessing] 数据过滤完成', {
      finalCount: filtered.length,
      originalCount: data?.length || 0
    });

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

  // 直接使用 ColumnConfig.tsx 中的 shouldShowField 和 generateColumns 函数

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

  // 生成列配置（当数据或筛选配置变化时）
  useEffect(() => {
    if (data && data.length > 0) {
      console.log('🔄 [usePayrollDataProcessing] 重新生成列配置', {
        dataLength: data.length,
        filterConfig: {
          includePatterns: filterConfig.includePatterns,
          excludePatterns: filterConfig.excludePatterns,
          hideJsonbColumns: filterConfig.hideJsonbColumns,
          hideZeroColumns: filterConfig.hideZeroColumns,
          hideEmptyColumns: filterConfig.hideEmptyColumns,
          showOnlyNumericColumns: filterConfig.showOnlyNumericColumns
        }
      });
      
      const columns = generateColumnsFromConfig(data, filterConfig);
      setCurrentColumnsState(columns);
      
      console.log('✅ [usePayrollDataProcessing] 列配置生成完成，列数:', columns.length);
    } else {
      console.log('⚠️ [usePayrollDataProcessing] 数据为空，清空列配置');
      setCurrentColumnsState([]);
    }
  }, [
    data.length, 
    // 监听所有筛选配置的变化
    filterConfig.includePatterns?.join(','),
    filterConfig.excludePatterns?.join(','),
    filterConfig.hideJsonbColumns, 
    filterConfig.hideZeroColumns, 
    filterConfig.hideEmptyColumns,
    filterConfig.showOnlyNumericColumns,
    filterConfig.minValueThreshold,
    filterConfig.maxValueThreshold
  ]);

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
    generateColumns: generateColumnsFromConfig,
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