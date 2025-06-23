import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { type ProColumns } from '@ant-design/pro-components';
import type { ColumnFilterConfig } from '../DataBrowser/AdvancedColumnManager';
import { SearchMode } from '../../../utils/searchUtils';

// Universal data processing configuration
export interface UniversalDataProcessingConfig {
  data: any[];
  searchResults?: Set<number>;
  searchMode?: SearchMode;
  filterConfig?: Partial<ColumnFilterConfig>;
  autoGenerateColumns?: boolean;
  columnCategories?: string[];
  defaultHiddenColumns?: string[];
  numericColumns?: string[];
}

// Column type detection
export type ColumnDataType = 'number' | 'date' | 'boolean' | 'text' | 'json';

// Column generation options
export interface ColumnGenerationOptions {
  includeActions?: boolean;
  maxColumnWidth?: number;
  ellipsis?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
}

// Default filter configuration
export const defaultUniversalFilterConfig: ColumnFilterConfig = {
  hideJsonbColumns: true,
  hideZeroColumns: true,
  hideEmptyColumns: true,
  includePatterns: [],
  excludePatterns: ['*id', '*ID', '*_id', '*时间', '*日期', '*Time', '*Date', 'createdAt', 'updatedAt'],
  minValueThreshold: 0,
  maxValueThreshold: Infinity,
  showOnlyNumericColumns: false,
  columnSortMode: 'byCategory',
  customColumnOrder: [],
};

// Utility functions
const matchesPattern = (text: string, pattern: string): boolean => {
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(text);
};

const detectColumnType = (data: any[], columnKey: string): ColumnDataType => {
  if (!data || data.length === 0) return 'text';
  
  const sample = data.slice(0, 100); // Sample first 100 rows
  const values = sample.map(row => row[columnKey]).filter(val => val != null && val !== '');
  
  if (values.length === 0) return 'text';
  
  // Check for JSON/Object
  const objectValues = values.filter(val => typeof val === 'object' && val !== null);
  if (objectValues.length > values.length * 0.5) return 'json';
  
  // Check for numbers
  const numericValues = values.filter(val => {
    const num = typeof val === 'number' ? val : Number(val);
    return !isNaN(num) && isFinite(num);
  });
  if (numericValues.length > values.length * 0.8) return 'number';
  
  // Check for dates
  const dateValues = values.filter(val => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date.getFullYear() > 1900;
  });
  if (dateValues.length > values.length * 0.8) return 'date';
  
  // Check for booleans
  const booleanValues = values.filter(val => 
    typeof val === 'boolean' || 
    (typeof val === 'string' && ['true', 'false', '是', '否', 'yes', 'no'].includes(val.toLowerCase()))
  );
  if (booleanValues.length > values.length * 0.8) return 'boolean';
  
  return 'text';
};

const formatValue = (value: any, type: ColumnDataType): any => {
  if (value == null) return '-';
  
  switch (type) {
    case 'number':
      const num = typeof value === 'number' ? value : Number(value);
      if (isNaN(num)) return value;
      return num.toLocaleString();
    
    case 'date':
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    
    case 'boolean':
      if (typeof value === 'boolean') {
        return value ? '是' : '否';
      }
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (['true', 'yes', '是', '1'].includes(lower)) return '是';
        if (['false', 'no', '否', '0'].includes(lower)) return '否';
      }
      return value;
    
    case 'json':
      if (typeof value === 'object') {
        return '[JSON Object]';
      }
      return value;
    
    default:
      return value;
  }
};

const categorizeColumn = (columnName: string): string => {
  const lower = columnName.toLowerCase();
  
  // Basic information
  if (lower.includes('name') || lower.includes('姓名') || 
      lower.includes('code') || lower.includes('编号') ||
      lower.includes('id') || lower.includes('num')) {
    return '基本信息';
  }
  
  // Contact information
  if (lower.includes('phone') || lower.includes('电话') ||
      lower.includes('email') || lower.includes('邮箱') ||
      lower.includes('address') || lower.includes('地址')) {
    return '联系信息';
  }
  
  // Position information
  if (lower.includes('department') || lower.includes('部门') ||
      lower.includes('position') || lower.includes('职位') ||
      lower.includes('job') || lower.includes('岗位')) {
    return '职位信息';
  }
  
  // Salary information
  if (lower.includes('salary') || lower.includes('工资') ||
      lower.includes('wage') || lower.includes('薪') ||
      lower.includes('bonus') || lower.includes('奖金') ||
      lower.includes('allowance') || lower.includes('津贴')) {
    return '薪资信息';
  }
  
  // Time information
  if (lower.includes('time') || lower.includes('时间') ||
      lower.includes('date') || lower.includes('日期') ||
      lower.includes('created') || lower.includes('updated')) {
    return '时间信息';
  }
  
  return '其他信息';
};

export const useUniversalDataProcessing = (config: UniversalDataProcessingConfig) => {
  const {
    data,
    searchResults,
    searchMode = SearchMode.AUTO,
    filterConfig: providedFilterConfig,
    autoGenerateColumns = true,
    columnCategories = [],
    defaultHiddenColumns = [],
    numericColumns = []
  } = config;
  // State management
  const [filterConfig, setFilterConfig] = useState<ColumnFilterConfig>({
    ...defaultUniversalFilterConfig,
    ...providedFilterConfig
  });
  
  const [currentColumnsState, setCurrentColumnsState] = useState<ProColumns<any>[]>([]);

  // Update filter config when provided config changes
  useEffect(() => {
    if (providedFilterConfig) {
      setFilterConfig(prev => ({
        ...prev,
        ...providedFilterConfig
      }));
    }
  }, [providedFilterConfig]);

  // Generate available columns from data
  const availableColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const columnSet = new Set<string>();
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => {
          if (!key.startsWith('_') && key !== 'key') {
            columnSet.add(key);
          }
        });
      }
    });
    
    return Array.from(columnSet).sort();
  }, [data]);

  // Analyze column statistics
  const columnStats = useMemo(() => {
    const stats: Record<string, {
      type: ColumnDataType;
      emptyCount: number;
      zeroCount: number;
      totalCount: number;
      hasValues: boolean;
      uniqueValues: number;
    }> = {};

    if (!data || data.length === 0) return stats;

    availableColumns.forEach(column => {
      const values = data.map(row => row[column]);
      const nonNullValues = values.filter(val => val != null && val !== '');
      const emptyCount = values.length - nonNullValues.length;
      const zeroCount = values.filter(val => val === 0 || val === '0').length;
      const uniqueValues = new Set(nonNullValues).size;
      
      stats[column] = {
        type: detectColumnType(data, column),
        emptyCount,
        zeroCount,
        totalCount: values.length,
        hasValues: nonNullValues.length > 0,
        uniqueValues
      };
    });

    return stats;
  }, [data, availableColumns]);

  // Filter columns based on configuration
  const visibleColumns = useMemo(() => {
    return availableColumns.filter(column => {
      const stats = columnStats[column];
      if (!stats) return true;
      
      // Hide empty columns
      if (filterConfig.hideEmptyColumns && !stats.hasValues) {
        return false;
      }
      
      // Hide zero columns
      if (filterConfig.hideZeroColumns && stats.zeroCount === stats.totalCount) {
        return false;
      }
      
      // Hide JSON columns
      if (filterConfig.hideJsonbColumns && stats.type === 'json') {
        return false;
      }
      
      // Show only numeric columns
      if (filterConfig.showOnlyNumericColumns && stats.type !== 'number') {
        return false;
      }
      
      // Check include patterns
      if (filterConfig.includePatterns.length > 0) {
        const matches = filterConfig.includePatterns.some(pattern => 
          matchesPattern(column, pattern)
        );
        if (!matches) return false;
      }
      
      // Check exclude patterns
      if (filterConfig.excludePatterns.length > 0) {
        const matches = filterConfig.excludePatterns.some(pattern => 
          matchesPattern(column, pattern)
        );
        if (matches) return false;
      }
      
      return true;
    });
  }, [availableColumns, columnStats, filterConfig]);

  // Sort columns by category and importance
  const sortedColumns = useMemo(() => {
    const categorized = visibleColumns.map(column => ({
      name: column,
      category: categorizeColumn(column),
      stats: columnStats[column],
      importance: getColumnImportance(column)
    }));

    switch (filterConfig.columnSortMode) {
      case 'byCategory':
        return categorized.sort((a, b) => {
          const categoryOrder = ['基本信息', '联系信息', '职位信息', '薪资信息', '时间信息', '其他信息'];
          const aCategoryIndex = categoryOrder.indexOf(a.category);
          const bCategoryIndex = categoryOrder.indexOf(b.category);
          
          if (aCategoryIndex !== bCategoryIndex) {
            return aCategoryIndex - bCategoryIndex;
          }
          
          return a.importance - b.importance;
        }).map(item => item.name);
      
      case 'byAlphabet':
        return categorized.sort((a, b) => a.name.localeCompare(b.name)).map(item => item.name);
      
      case 'byImportance':
        return categorized.sort((a, b) => a.importance - b.importance).map(item => item.name);
      
      case 'byDataType':
        return categorized.sort((a, b) => {
          const typeOrder = ['number', 'text', 'date', 'boolean', 'json'];
          return typeOrder.indexOf(a.stats.type) - typeOrder.indexOf(b.stats.type);
        }).map(item => item.name);
      
      case 'custom':
        if (filterConfig.customColumnOrder && filterConfig.customColumnOrder.length > 0) {
          const customOrder = filterConfig.customColumnOrder;
          const ordered = customOrder.filter(col => visibleColumns.includes(col));
          const remaining = visibleColumns.filter(col => !customOrder.includes(col));
          return [...ordered, ...remaining];
        }
        return visibleColumns;
      
      default:
        return visibleColumns;
    }
  }, [visibleColumns, columnStats, filterConfig]);

  // Generate ProColumns configuration - 使用稳定的函数引用避免循环
  const generateColumns = useCallback((
    dataSource: any[], 
    currentFilterConfig: ColumnFilterConfig,
    options: ColumnGenerationOptions = {},
    currentSearchResults?: Set<number>
  ): ProColumns<any>[] => {
    if (!dataSource || dataSource.length === 0) return [];
    
    const {
      maxColumnWidth = 200,
      ellipsis = true,
      sortable = true,
      filterable = false,
      searchable = false
    } = options;

    // 使用传入的搜索结果而不是闭包引用，避免依赖变化
    const searchResultsToUse = currentSearchResults || searchResults;

    return sortedColumns.map(column => {
      const stats = columnStats[column];
      const dataType = stats?.type || 'text';
      
      const columnConfig: ProColumns<any> = {
        title: column,
        dataIndex: column,
        key: column,
        width: Math.min(column.length * 12 + 40, maxColumnWidth),
        ellipsis,
        sorter: sortable,
        
        render: (value: any, record: any, index: number) => {
          const formattedValue = formatValue(value, dataType);
          
          // Highlight search results - 动态传入搜索结果，避免闭包依赖
          if (searchResultsToUse && searchResultsToUse.has(index)) {
            return (
              <span style={{ 
                backgroundColor: '#fff2b8', 
                padding: '2px 4px',
                borderRadius: '2px'
              }}>
                {formattedValue}
              </span>
            );
          }
          
          return formattedValue;
        }
      };

      // Add filtering if enabled
      if (filterable && dataType !== 'json') {
        columnConfig.filters = getColumnFilters(dataSource, column, dataType);
        columnConfig.onFilter = (value: any, record: any) => {
          const recordValue = record[column];
          return recordValue != null && recordValue.toString().includes(value);
        };
      }

      return columnConfig;
    });
  }, [sortedColumns, columnStats, searchResults]); // 包含完整依赖避免ESLint错误

  // Filter data based on search results
  const filteredDataSource = useMemo(() => {
    if (!data) return [];
    
    // Apply search filtering if search results are provided
    if (searchResults && searchResults.size > 0) {
      return data.filter((_, index) => searchResults.has(index));
    }
    
    return data;
  }, [data, searchResults]);

  // Update current columns when dependencies change - 使用稳定的列生成逻辑
  const generateColumnsRef = useRef(generateColumns);
  generateColumnsRef.current = generateColumns;

  useEffect(() => {
    if (autoGenerateColumns && data && data.length > 0) {
      const newColumns = generateColumnsRef.current(data, filterConfig, {}, searchResults);
      // 检查列是否真的有变化，避免不必要的状态更新
      setCurrentColumnsState(prevColumns => {
        if (prevColumns.length !== newColumns.length) return newColumns;
        
        const hasChanged = newColumns.some((col, index) => {
          const prevCol = prevColumns[index];
          return !prevCol || prevCol.dataIndex !== col.dataIndex || prevCol.title !== col.title;
        });
        
        return hasChanged ? newColumns : prevColumns;
      });
    }
  }, [autoGenerateColumns, data, filterConfig, searchResults]); // 使用ref保持函数稳定

  // Export functionality (simplified)
  const exportToExcel = useCallback(async (
    dataToExport: any[],
    columns: ProColumns<any>[],
    filename?: string
  ) => {
    console.log('📤 [UniversalDataProcessing] Export to Excel requested', {
      dataCount: dataToExport.length,
      columnsCount: columns.length,
      filename
    });
    
    // This would integrate with actual export service
    // For now, just log the export request
    return Promise.resolve();
  }, []);

  return {
    // Processed data
    filteredDataSource,
    
    // Column management
    availableColumns,
    visibleColumns,
    sortedColumns,
    currentColumnsState,
    
    // Column statistics
    columnStats,
    
    // Configuration
    filterConfiguration: filterConfig,
    setFilterConfiguration: setFilterConfig,
    
    // Functions
    generateColumns,
    exportToExcel,
    
    // Utilities
    detectColumnType: (column: string) => detectColumnType(data, column),
    categorizeColumn,
    formatValue
  };
};

// Helper function to determine column importance (lower = more important)
function getColumnImportance(columnName: string): number {
  const lower = columnName.toLowerCase();
  
  // Most important
  if (lower.includes('name') || lower.includes('姓名')) return 1;
  if (lower.includes('id') || lower.includes('编号')) return 2;
  if (lower.includes('code')) return 3;
  
  // Important
  if (lower.includes('department') || lower.includes('部门')) return 10;
  if (lower.includes('position') || lower.includes('职位')) return 11;
  if (lower.includes('phone') || lower.includes('电话')) return 12;
  if (lower.includes('email') || lower.includes('邮箱')) return 13;
  
  // Moderately important
  if (lower.includes('salary') || lower.includes('工资')) return 20;
  if (lower.includes('date') || lower.includes('时间')) return 30;
  
  // Less important
  return 100;
}

// Helper function to generate filters for a column
function getColumnFilters(dataSource: any[], column: string, dataType: ColumnDataType) {
  if (dataType === 'boolean') {
    return [
      { text: '是', value: 'true' },
      { text: '否', value: 'false' }
    ];
  }
  
  if (dataType === 'text') {
    const uniqueValues = Array.from(new Set(
      dataSource
        .map(item => item[column])
        .filter(val => val != null && val !== '')
        .slice(0, 50) // Limit to 50 unique values
    ));
    
    return uniqueValues.map(value => ({
      text: String(value),
      value: String(value)
    }));
  }
  
  return [];
}

// Types are already exported above where they are defined