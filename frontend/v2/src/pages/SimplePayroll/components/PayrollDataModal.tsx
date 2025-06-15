import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal, message, Button, Space, Input, Card, Collapse, Switch, Tag, Select, InputNumber, Divider, Row, Col } from 'antd';
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { ReloadOutlined, DownloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, FilterOutlined, SettingOutlined, DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { payrollViewsApi, type ComprehensivePayrollDataView } from '../../Payroll/services/payrollViewsApi';
import PayrollEntryDetailModal from '../../Payroll/components/PayrollEntryDetailModal';
import PayrollEntryFormModal from '../../Payroll/components/PayrollEntryFormModal';
import { getPayrollEntries, getPayrollEntryById } from '../../Payroll/services/payrollApi';
import type { PayrollEntry } from '../../Payroll/types/payrollTypes';
import TableActionButton from '../../../components/common/TableActionButton';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';

// React Query 相关导入
import { 
  usePayrollDataQuery, 
  useRefreshPayrollData, 
  usePayrollDataCacheStatus,
  usePayrollDataMutations,
  type PayrollDataFilters 
} from '../../../hooks/usePayrollDataQuery';

// 调试组件
import { ReactQueryDebugger } from '../../../components/ReactQueryDebugger';
import { ReactQueryCleaner } from '../../../components/ReactQueryCleaner';

// 搜索功能导入
import { usePayrollSearch } from '../../../hooks/usePayrollSearch';
import { SearchMode } from '../../../utils/searchUtils';
import { ProFormGlobalSearch } from '../../../components/PayrollDataModal/ProFormGlobalSearch';
import { AdvancedSearchForm } from '../../../components/PayrollDataModal/AdvancedSearchForm';
import { TableCellHighlight } from '../../../components/PayrollDataModal/HighlightText';

const { Panel } = Collapse;
const { Option } = Select;

// 筛选配置接口
interface ColumnFilterConfig {
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
const defaultFilterConfig: ColumnFilterConfig = {
  hideJsonbColumns: true,
  hideZeroColumns: true,
  hideEmptyColumns: true,
  includePatterns: [],
  excludePatterns: ['*id', '*时间', '*日期'],
  minValueThreshold: 0,
  maxValueThreshold: Infinity,
  showOnlyNumericColumns: false,
};

// 工资数据类型定义 - 使用核心视图API返回的类型
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number; // 用于表格的key
}

interface PayrollDataModalProps {
  visible: boolean;
  onClose: () => void;
  periodId: number;
  periodName?: string;
}

export const PayrollDataModal: React.FC<PayrollDataModalProps> = ({
  visible,
  onClose,
  periodId,
  periodName
}) => {
  const { t } = useTranslation(['payroll', 'common', 'employee']);
  const actionRef = useRef<ActionType>(null);
  
  // 🚀 React Query 集成
  const queryFilters = useMemo<PayrollDataFilters>(() => {
    // 确保 periodId 是有效的（不为 0 或 null）
    const validPeriodId = periodId && periodId > 0 ? periodId.toString() : undefined;
    
    return {
      periodId: validPeriodId,
      size: 100,
      page: 1,
    };
  }, [periodId]);
  
  // 使用 useMemo 缓存查询配置，避免每次渲染都创建新对象
  const queryOptions = useMemo(() => ({
    enabled: visible && !!periodId && periodId > 0 && !!queryFilters.periodId,
    onSuccess: (data: any) => {
      console.log('✅ [PayrollDataModal] React Query 数据获取成功', {
        total: data.total,
        dataLength: data.data.length
      });
    },
    onError: (error: any) => {
      console.error('❌ [PayrollDataModal] React Query 数据获取失败', error);
    },
  }), [visible, periodId, queryFilters.periodId]);

  const {
    data: queryData,
    isLoading,
    error,
    refetch,
    isFetching,
    status,
    fetchStatus,
  } = usePayrollDataQuery(queryFilters, queryOptions);

  // 🔍 调试日志
  console.log('🔍 [PayrollDataModal] React Query 状态:', {
    visible,
    periodId,
    enabled: visible && !!periodId,
    status,
    fetchStatus,
    isLoading,
    isFetching,
    hasData: !!queryData,
    dataLength: queryData?.data?.length || 0,
    queryFilters,
    error: error?.message
  });
  
  // 从 React Query 数据中提取状态
  const dataSource = queryData?.data || [];
  const loading = isLoading || isFetching;

  // 🔍 调试：检查数据源结构
  useEffect(() => {
    if (dataSource.length > 0) {
      console.log('🔍 [PayrollDataModal] 数据源调试信息:', {
        dataLength: dataSource.length,
        sampleRecord: dataSource[0],
        availableKeys: Object.keys(dataSource[0]),
        searchKeys: ['员工姓名', '员工编号', '部门名称', '职位名称', '人员类别', '编制', '薪资期间名称'],
        keyExists: {
          '员工姓名': '员工姓名' in dataSource[0],
          '员工编号': '员工编号' in dataSource[0],
          '部门名称': '部门名称' in dataSource[0],
          '职位名称': '职位名称' in dataSource[0],
          '人员类别': '人员类别' in dataSource[0],
          '编制': '编制' in dataSource[0],
          '薪资期间名称': '薪资期间名称' in dataSource[0]
        }
      });
    }
  }, [dataSource]);

  // 🔍 搜索功能集成
  const {
    query: searchQuery,
    results: searchResults,
    isSearching,
    searchMode,
    suggestions,
    totalResults,
    searchTime,
    search,
    clearSearch,
    setSearchMode,
    isEmptyQuery,
    hasResults,
    performance,
  } = usePayrollSearch(dataSource, {
    keys: [
      '员工姓名',
      '员工编号', 
      '部门名称',
      '职位名称',
      '人员类别',
      '编制',
      '薪资期间名称'
    ],
    threshold: 0.3,
    debounceDelay: 300,
    enableSuggestions: true,
    maxSuggestions: 5,
  });

  // 使用搜索结果作为表格数据源
  const filteredDataSource = isEmptyQuery ? dataSource : searchResults.map(result => result.item);
  
  // React Query 相关 Hooks
  const { refreshFiltered, clearCache } = useRefreshPayrollData();
  const { getCacheSize, getQueryStatus } = usePayrollDataCacheStatus();
  const { onDeleteSuccess, onBatchOperationSuccess } = usePayrollDataMutations();
  const [dynamicColumns, setDynamicColumns] = useState<ProColumns<PayrollData>[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [searchCardCollapsed, setSearchCardCollapsed] = useState(false);
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);

  // 数字格式化函数：统一显示2位小数
  const formatNumber = (value: any) => {
    if (value === null || value === undefined) {
      return <span style={{ color: '#999' }}>N/A</span>;
    }
    
    if (typeof value === 'number') {
      return (
        <span style={{ textAlign: 'right', display: 'block' }}>
          {value.toLocaleString('zh-CN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </span>
      );
    }
    
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && isFinite(numValue)) {
        return (
          <span style={{ textAlign: 'right', display: 'block' }}>
            {numValue.toLocaleString('zh-CN', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </span>
        );
      }
    }
    
    return value.toString();
  };

  // 日期格式化函数：格式化薪资期间名称
  const formatDate = (value: any) => {
    if (value === null || value === undefined) {
      return <span style={{ color: '#999' }}>N/A</span>;
    }
    
    const dateStr = String(value);
    
    // 尝试解析各种日期格式
    let date: Date | null = null;
    
    // 格式1: YYYY年MM月 (如: 2024年06月)
    const yearMonthMatch = dateStr.match(/(\d{4})年(\d{1,2})月/);
    if (yearMonthMatch) {
      const year = parseInt(yearMonthMatch[1]);
      const month = parseInt(yearMonthMatch[2]) - 1; // JavaScript月份从0开始
      date = new Date(year, month);
    }
    
    // 格式2: YYYY-MM (如: 2024-06)
    if (!date) {
      const dashMatch = dateStr.match(/^(\d{4})-(\d{1,2})$/);
      if (dashMatch) {
        const year = parseInt(dashMatch[1]);
        const month = parseInt(dashMatch[2]) - 1;
        date = new Date(year, month);
      }
    }
    
    // 格式3: 标准日期字符串
    if (!date) {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate;
      }
    }
    
    if (date && !isNaN(date.getTime())) {
      return (
        <span style={{ textAlign: 'center', display: 'block' }}>
          {date.getFullYear()}年{String(date.getMonth() + 1).padStart(2, '0')}月
        </span>
      );
    }
    
    // 如果无法解析为日期，返回原值
    return dateStr;
  };
  
  // 分页状态管理
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 筛选配置状态
  const [filterConfig, setFilterConfig] = useState<ColumnFilterConfig>(defaultFilterConfig);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [allAvailableKeys, setAllAvailableKeys] = useState<string[]>([]);
  
  // 🎯 ProTable列状态管理
  const [currentColumnsState, setCurrentColumnsState] = useState<Record<string, any>>({});
  
  // 🎯 详情和编辑功能状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [payrollRunId, setPayrollRunId] = useState<number | null>(null);

  // 通配符匹配函数 - 使用 useCallback 避免无限循环
  const matchesPattern = useCallback((text: string, pattern: string): boolean => {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(text);
  }, []); // 无依赖项，纯函数



  // 🚀 React Query 数据处理逻辑 - 使用搜索功能管理过滤数据源
  // filteredDataSource 现在由搜索功能管理

  // 🚀 React Query 会自动处理数据获取，无需手动调用

  // 当筛选配置改变时重新生成列 - 避免重复生成
  useEffect(() => {
    if (dataSource.length > 0) {
      const allKeys = Object.keys(dataSource[0]);
      setAllAvailableKeys(allKeys); // 更新可用列名
      
      // 直接在 useEffect 内部实现筛选逻辑，避免函数依赖
      const filteredKeys = allKeys.filter(key => {
        // 1. 检查包含模式
        if (filterConfig.includePatterns.length > 0) {
          const matchesInclude = filterConfig.includePatterns.some(pattern => 
            matchesPattern(key, pattern)
          );
          if (!matchesInclude) return false;
        }

        // 2. 检查排除模式
        if (filterConfig.excludePatterns.length > 0) {
          const matchesExclude = filterConfig.excludePatterns.some(pattern => 
            matchesPattern(key, pattern)
          );
          if (matchesExclude) return false;
        }

        // 3. 过滤 JSONB 列
        if (filterConfig.hideJsonbColumns) {
          if (key.includes('原始')) return false;
          const sampleValue = dataSource[0]?.[key as keyof PayrollData];
          if (sampleValue !== null && typeof sampleValue === 'object' && !Array.isArray(sampleValue)) {
            return false;
          }
        }

        // 4. 过滤全零列
        if (filterConfig.hideZeroColumns) {
          const hasNonZeroValue = dataSource.some(item => {
            const value = item[key as keyof PayrollData];
            return value !== null && 
                   value !== undefined && 
                   value !== 0 && 
                   value !== '' &&
                   value !== '0' &&
                   value !== '0.00';
          });
          if (!hasNonZeroValue) return false;
        }

        // 5. 过滤空列（但保留重要的基础信息字段）
        if (filterConfig.hideEmptyColumns) {
          // 重要的基础信息字段，即使为空也要显示
          const importantFields = ['根人员类别', '编制', '人员类别', '员工编号', '员工姓名', '部门名称', '职位名称'];
          const isImportantField = importantFields.includes(key);
          
          if (!isImportantField) {
            const hasValue = dataSource.some(item => {
              const value = item[key as keyof PayrollData];
              return value !== null && value !== undefined && value !== '';
            });
            if (!hasValue) return false;
          }
        }

        // 6. 只显示数值列
        if (filterConfig.showOnlyNumericColumns) {
          const sampleValue = dataSource[0]?.[key as keyof PayrollData];
          if (typeof sampleValue !== 'number') return false;
        }

        // 7. 数值范围筛选
        if (typeof dataSource[0]?.[key as keyof PayrollData] === 'number') {
          const values = dataSource.map(item => item[key as keyof PayrollData] as number).filter(v => v != null);
          const maxValue = Math.max(...values);
          const minValue = Math.min(...values);
          
          if (maxValue < filterConfig.minValueThreshold || minValue > filterConfig.maxValueThreshold) {
            return false;
          }
        }

        return true;
      });
      
      const generatedColumns = filteredKeys.map(key => {
        const column: ProColumns<PayrollData> = {
          title: t(`comprehensive_payroll_data.columns.${key}`, {
            defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          }),
          dataIndex: key,
          key: key,
          render: (text: any, record: PayrollData) => {
            if (text === null || typeof text === 'undefined') {
              return <span style={{ color: '#999' }}>N/A</span>;
            }
            
            if (typeof text === 'object') {
              return (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px' }}>
                  {JSON.stringify(text, null, 2)}
                </pre>
              );
            }
        
            if (typeof text === 'boolean') {
              return text ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: 'red' }} />;
            }
            
            // 特殊处理：薪资期间名称使用日期格式
            if (key === '薪资期间名称') {
              return formatDate(text);
            }
            
            // 尝试数字格式化
            const formattedNumber = formatNumber(text);
            if (formattedNumber !== text.toString()) {
              // 对于数字类型，也支持搜索高亮
              if (!isEmptyQuery && typeof text === 'number') {
                return (
                  <TableCellHighlight
                    text={text.toString()}
                    searchQuery={searchQuery}
                    type="number"
                  />
                );
              }
              return formattedNumber;
            }

            // 对于文本类型，添加搜索高亮
            const textFields = ['员工姓名', '员工编号', '部门名称', '职位名称', '人员类别', '编制'];
            if (!isEmptyQuery && textFields.includes(key)) {
              return (
                <TableCellHighlight
                  text={text}
                  searchQuery={searchQuery}
                  type="text"
                />
              );
            }
        
            return text.toString();
          },
        };
        
        const filterableKeys = ['部门名称', '职位名称', '人员类别', '编制'];
        const sampleValue = dataSource.length > 0 ? dataSource[0]?.[key as keyof PayrollData] : undefined;

        // 为非对象、非布尔值类型添加排序功能
        if (sampleValue !== null && sampleValue !== undefined && typeof sampleValue !== 'object' && typeof sampleValue !== 'boolean') {
          column.sorter = (a, b) => {
            const valA = a[key as keyof PayrollData] as any;
            const valB = b[key as keyof PayrollData] as any;
            if (valA === null || valA === undefined) return -1;
            if (valB === null || valB === undefined) return 1;

            if (typeof valA === 'number' && typeof valB === 'number') {
              return valA - valB;
            }
            return String(valA).localeCompare(String(valB));
          };
        }

        // 为指定的类别列添加筛选功能
        if (filterableKeys.includes(key)) {
          const uniqueValues = [...new Set(dataSource.map(item => item[key as keyof PayrollData]))].filter(v => v !== null && v !== undefined && v !== '');
          if (uniqueValues.length > 1) {
            column.filters = uniqueValues.map(value => ({
              text: String(value),
              value: value as string | number,
            }));
            column.onFilter = (value, record) => record[key as keyof PayrollData] === value;
          }
        }

        // 为员工姓名添加文本搜索功能
        if (key === '员工姓名') {
          column.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="搜索员工姓名"
                value={selectedKeys[0]}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => confirm()}
                style={{ marginBottom: 8, display: 'block' }}
              />
              <Space>
                <Button
                  type="primary"
                  onClick={() => confirm()}
                  icon={<SearchOutlined />}
                  size="small"
                  style={{ width: 90 }}
                >
                  搜索
                </Button>
                <Button onClick={() => {
                  console.log('🔄 [重置按钮2] 点击重置，当前selectedKeys:', selectedKeys);
                  
                  // 1. 清空输入框
                  setSelectedKeys([]);
                  console.log('🔄 [重置按钮2] 已清空selectedKeys');
                  
                  // 2. 调用clearFilters（如果存在）
                  if (clearFilters) {
                    clearFilters();
                    console.log('🔄 [重置按钮2] 已调用clearFilters');
                  } else {
                    console.warn('⚠️ [重置按钮2] clearFilters函数不存在');
                  }
                  
                  // 3. 强制确认以刷新表格
                  confirm();
                  console.log('🔄 [重置按钮2] 已调用confirm刷新表格');
                }} size="small" style={{ width: 90 }}>
                  重置
                </Button>
              </Space>
            </div>
          );
          column.filterIcon = (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
          );
          column.onFilter = (value, record) => {
            const recordValue = record[key as keyof PayrollData];
            return recordValue ? String(recordValue).toLowerCase().includes(String(value).toLowerCase()) : false;
          };
        }
        
        return column;
      });

              // 添加操作列
        generatedColumns.push({
          title: t('common:table.actions'),
          key: 'action',
          width: 160,
          fixed: 'right',
          render: (_, record) => (
            <Space>
              <TableActionButton
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
                tooltipTitle={t('common:tooltip.view_details')}
                actionType="view"
              />
              <TableActionButton
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                tooltipTitle={t('common:button.edit')}
                actionType="edit"
              />
              <TableActionButton
                icon={<DeleteOutlined />}
                onClick={() => {
                  console.log('删除记录:', record);
                  message.warning('删除功能开发中...');
                }}
                tooltipTitle={t('common:button.delete')}
                actionType="delete"
              />
            </Space>
          ),
        });
      
      setDynamicColumns(generatedColumns);
    }
  }, [dataSource, t, filterConfig, matchesPattern]); // 添加 matchesPattern 依赖

  // 🎯 查看详情
  const handleViewDetail = async (record: PayrollData) => {
    console.log('📋 [PayrollDataModal] 查看详情:', record);
    
    // 使用薪资条目ID
    if (record.薪资条目id) {
      setSelectedEntryId(String(record.薪资条目id));
      setDetailModalVisible(true);
    } else {
      message.warning(t('payroll:entry_form.message.update_success_no_data'));
    }
  };

  // 🎯 编辑记录
  const handleEdit = async (record: PayrollData) => {
    console.log('✏️ [PayrollDataModal] 编辑记录:', record);
    
    if (!record.薪资条目id) {
      message.warning(t('payroll:runs_page.form.placeholder.payroll_period'));
      return;
    }

    try {
      // 根据薪资条目ID获取完整的薪资条目数据
      const response = await getPayrollEntryById(record.薪资条目id);
      
      if (response.data) {
        const payrollEntry = response.data;
        setSelectedEntry(payrollEntry);
        setPayrollRunId(payrollEntry.payroll_run_id);
        setEditModalVisible(true);
        console.log('✅ [PayrollDataModal] 获取薪资条目数据成功:', payrollEntry);
      } else {
        message.error(t('payroll:entry_detail_modal.not_found'));
      }
    } catch (error: any) {
      console.error('❌ [PayrollDataModal] 获取薪资条目数据失败:', error);
      message.error(`${t('payroll:entry_form.error_fetch_employee')}: ${error.message || t('common:unknown_error')}`);
    }
  };

  // 🎯 编辑成功回调
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setSelectedEntry(null);
    setPayrollRunId(null);
    refetch(); // 🚀 使用 React Query 刷新数据
    message.success(t('payroll:entry_form.message.update_success'));
  };

  // 从React渲染结果中提取文本内容
  const extractTextFromRender = (renderResult: any): string => {
    if (renderResult === null || renderResult === undefined) {
      return '';
    }
    
    // 如果是React元素
    if (React.isValidElement(renderResult)) {
      const props = renderResult.props as any;
      
      // 处理span元素（如格式化的数字、日期）
      if (renderResult.type === 'span') {
        if (props.children !== undefined) {
          return String(props.children);
        }
        if (props.style?.color === '#999' && props.children === 'N/A') {
          return 'N/A';
        }
      }
      
      // 处理pre元素（JSON数据）
      if (renderResult.type === 'pre') {
        return props.children || '';
      }
      
      // 处理图标元素（布尔值）
      if (typeof renderResult.type === 'function' && (renderResult.type as any).displayName) {
        const displayName = (renderResult.type as any).displayName;
        if (displayName === 'CheckCircleOutlined') return '是';
        if (displayName === 'CloseCircleOutlined') return '否';
      }
      
      // 尝试获取children
      if (props && props.children !== undefined) {
        return extractTextFromRender(props.children);
      }
      
      return '';
    }
    
    // 如果是数组，递归处理
    if (Array.isArray(renderResult)) {
      return renderResult.map(item => extractTextFromRender(item)).join('');
    }
    
    // 基本类型直接返回
    return String(renderResult);
  };

  // 处理单元格值，应用与表格相同的渲染逻辑
  const processValue = (rawValue: any, column: ProColumns<PayrollData>, record: PayrollData, index: number): any => {
    // 如果列有自定义渲染函数，使用它
    if (column.render) {
      try {
        const renderResult = column.render(rawValue, record, index, {} as any, {} as any);
        const textContent = extractTextFromRender(renderResult);
        
        // 尝试转换为数字（保持Excel中的数字格式）
        const numValue = parseFloat(textContent);
        if (!isNaN(numValue) && isFinite(numValue) && textContent !== 'N/A') {
          return numValue;
        }
        
        return textContent;
      } catch (error) {
        console.warn('渲染函数执行失败:', error);
        return cleanValue(rawValue);
      }
    }
    
    // 没有渲染函数，直接清理原始值
    return cleanValue(rawValue);
  };

  // 数据清理函数
  const cleanValue = (value: any): any => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    if (typeof value === 'number') {
      // 检查是否为有效数字
      if (isNaN(value) || !isFinite(value)) {
        return '';
      }
      // 保持原始数字类型，不要转换为字符串
      return value;
    }
    // 尝试将字符串转换为数字（如果可能）
    if (typeof value === 'string') {
      const cleanedString = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      const numValue = parseFloat(cleanedString);
      if (!isNaN(numValue) && isFinite(numValue)) {
        return numValue;
      }
      return cleanedString;
    }
    // 清理字符串中的特殊字符
    return String(value).replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  };

  // 导出数据为Excel
  const handleExportExcel = () => {
    // 导出当前筛选后的数据
    if (filteredDataSource.length === 0) {
      message.warning(t('payroll:batch_import.result.no_result'));
      return;
    }

    try {
      // 🎯 方案一：使用实时跟踪的ProTable列状态
      console.log('📊 [导出Excel] 当前列状态:', currentColumnsState);
      console.log('📊 [导出Excel] 动态列配置:', dynamicColumns.map(col => ({ key: col.key, title: col.title })));

      // 🎯 确定可见列及其顺序（排除操作列）
      const visibleColumns = dynamicColumns
        .filter(col => col.key !== 'action') // 排除操作列
        .filter(col => {
          // 检查列是否可见（默认可见，除非明确设置为隐藏）
          const columnKey = String(col.key || '');
          const columnState = currentColumnsState[columnKey];
          const isVisible = columnState?.show !== false; // 默认显示，除非明确隐藏
          console.log(`📋 [列筛选] ${columnKey}: show=${columnState?.show}, visible=${isVisible}`);
          return isVisible;
        })
        .sort((a, b) => {
          // 按照用户调整后的列顺序排序
          const keyA = String(a.key || '');
          const keyB = String(b.key || '');
          const stateA = currentColumnsState[keyA];
          const stateB = currentColumnsState[keyB];
          const orderA = typeof stateA?.order === 'number' ? stateA.order : 999;
          const orderB = typeof stateB?.order === 'number' ? stateB.order : 999;
          console.log(`📋 [列排序] ${keyA}: order=${orderA}, ${keyB}: order=${orderB}`);
          return orderA - orderB;
        });

      console.log('📋 [导出Excel] 可见列:', visibleColumns.map(col => ({ 
        key: col.key, 
        title: col.title,
        order: currentColumnsState[String(col.key || '')]?.order 
      })));

      // 🎯 生成导出数据，应用与表格相同的渲染逻辑
      const exportData = filteredDataSource.map((item, index) => {
        const row: { [key: string]: any } = { '序号': index + 1 };
        
        visibleColumns.forEach(col => {
          if (col.dataIndex) {
            const dataIndex = col.dataIndex as keyof PayrollData;
            const columnTitle = String(col.title || col.dataIndex);
            const rawValue = item[dataIndex];
            
            // 应用与表格相同的处理逻辑
            row[columnTitle] = processValue(rawValue, col, item, index);
          }
        });
        
        return row;
      });

      if (exportData.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }

      console.log('📤 [导出Excel] 导出数据预览:', {
        总行数: exportData.length,
        列数: Object.keys(exportData[0]).length,
        列名: Object.keys(exportData[0]),
        首行数据: exportData[0]
      });

      // 创建工作表
      import('xlsx').then((XLSX) => {
        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // 获取工作表范围
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        
        // 为所有数字列设置统一的数字格式（2位小数）
        const headers = Object.keys(exportData[0]);
        
        // 遍历所有单元格，设置数字格式
        for (let row = 0; row <= range.e.r; row++) { // 从第1行开始（包括表头）
          for (let col = 0; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = ws[cellAddress];
            
            if (cell) {
              // 跳过表头行（第0行）
              if (row === 0) {
                // 表头使用文本格式
                cell.t = 's';
                continue;
              }
              
              // 数据行：检查是否为数字
              const cellValue = cell.v;
              
              // 如果是数字类型，或者是可以转换为数字的字符串
              if (typeof cellValue === 'number' || 
                  (typeof cellValue === 'string' && !isNaN(parseFloat(cellValue)) && isFinite(parseFloat(cellValue)))) {
                
                // 转换为数字
                if (typeof cellValue === 'string') {
                  cell.v = parseFloat(cellValue);
                }
                
                // 设置数字格式：千分位分隔符 + 2位小数
                cell.z = '#,##0.00';
                cell.t = 'n'; // 数字类型
              } else {
                // 非数字内容保持文本格式
                cell.t = 's';
              }
            }
          }
        }
        
        // 设置列宽 - 基于内容长度自动调整
        const colWidths = headers.map(header => {
          const maxLength = Math.max(
            header.length,
            ...exportData.slice(0, 100).map(row => String(row[header] || '').length)
          );
          return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
        });
        ws['!cols'] = colWidths;
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 设置工作簿属性
        wb.Props = {
          Title: '薪资数据导出',
          Subject: '薪资数据',
          Author: 'Salary System',
          CreatedDate: new Date()
        };
        
        // 添加工作表
        XLSX.utils.book_append_sheet(wb, ws, '薪资数据');
        
        // 生成安全的文件名（避免特殊字符）
        const safeFileName = `薪资数据_${periodName || '当前期间'}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
        
        // 导出文件
        XLSX.writeFile(wb, safeFileName, { 
          bookType: 'xlsx',
          type: 'buffer',
          compression: false // 关闭压缩以避免兼容性问题
        });
        
        message.success(`导出成功！共导出 ${filteredDataSource.length} 条记录`);
      }).catch((error) => {
        console.error('Excel导出错误:', error);
        message.error(`导出失败: ${error.message || '未知错误'}`);
      });
    } catch (error: any) {
      console.error('数据处理错误:', error);
      message.error(`数据处理失败: ${error.message || '未知错误'}`);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    refetch(); // 🚀 使用 React Query 刷新数据
    message.success(t('common:table.refreshSuccess'));
  };

  // 重置表格筛选
  const handleResetFilters = () => {
    console.log('🔄 [handleResetFilters] 开始重置表格筛选');
    console.log('🔄 [handleResetFilters] 当前dataSource长度:', dataSource.length);
    
    // 强制刷新表格
    if (actionRef.current) {
      actionRef.current.clearSelected?.();
      // 使用 setTimeout 确保状态更新后再刷新
      setTimeout(() => {
        actionRef.current?.reload();
        console.log('🔄 [handleResetFilters] 已调用actionRef.reload刷新表格');
      }, 0);
      console.log('🔄 [handleResetFilters] 已调用actionRef.clearSelected');
    }
  };

  return (
    <Modal
      title={t('payroll:payroll_data_for_period', { periodName: periodName || '' })}
      open={visible}
      onCancel={onClose}
      footer={
        <Button key="close" onClick={onClose}>
          {t('common:button.close')}
        </Button>
      }
      width="95%"
      style={{ top: 20 }}
      destroyOnClose
    >
      <style>{`
        @media (max-width: 768px) {
          .search-card-toggle-text {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .search-card-toggle-text {
            display: inline !important;
          }
        }
      `}</style>
      {/* 🔍 React Query 调试信息 */}
      {import.meta.env.DEV && (
        <>
          <ReactQueryDebugger />
          <div style={{ margin: '8px 0' }}>
            <ReactQueryCleaner />
          </div>
        </>
      )}
      
      {/* 筛选配置面板 */}
      {showFilterPanel && (
        <Card 
          title={
            <Space>
              <SettingOutlined />
              列筛选配置
              <Tag color="blue">{dynamicColumns.length - 1} 列显示</Tag>
              <Tag color="green">{allAvailableKeys.length} 列总计</Tag>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Collapse size="small">
            <Panel header="基础筛选" key="basic">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap>
                  <Switch
                    checked={filterConfig.hideJsonbColumns}
                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, hideJsonbColumns: checked }))}
                  />
                  <span>隐藏 JSONB 列（原始数据列）</span>
                </Space>
                <Space wrap>
                  <Switch
                    checked={filterConfig.hideZeroColumns}
                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, hideZeroColumns: checked }))}
                  />
                  <span>隐藏全零列</span>
                </Space>
                <Space wrap>
                  <Switch
                    checked={filterConfig.hideEmptyColumns}
                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, hideEmptyColumns: checked }))}
                  />
                  <span>隐藏空列</span>
                </Space>
                <Space wrap>
                  <Switch
                    checked={filterConfig.showOnlyNumericColumns}
                    onChange={(checked) => setFilterConfig(prev => ({ ...prev, showOnlyNumericColumns: checked }))}
                  />
                  <span>只显示数值列</span>
                </Space>
              </Space>
            </Panel>
            
            <Panel header="模式匹配" key="patterns">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <label>包含模式（支持通配符 * 和 ?）：</label>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="例如：*工资*、保险*、*金额"
                    value={filterConfig.includePatterns}
                    onChange={(patterns) => setFilterConfig(prev => ({ ...prev, includePatterns: patterns }))}
                  >
                    <Option value="*工资*">*工资*</Option>
                    <Option value="*保险*">*保险*</Option>
                    <Option value="*金额">*金额</Option>
                    <Option value="*合计">*合计</Option>
                    <Option value="基本*">基本*</Option>
                  </Select>
                </div>
                <div>
                  <label>排除模式（支持通配符 * 和 ?）：</label>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="例如：*id、*时间、*日期"
                    value={filterConfig.excludePatterns}
                    onChange={(patterns) => setFilterConfig(prev => ({ ...prev, excludePatterns: patterns }))}
                  >
                    <Option value="*id">*id</Option>
                    <Option value="*时间">*时间</Option>
                    <Option value="*日期">*日期</Option>
                    <Option value="*编号">*编号</Option>
                    <Option value="原始*">原始*</Option>
                  </Select>
                </div>
              </Space>
            </Panel>
            
            <Panel header="数值范围" key="values">
              <Space wrap>
                <span>最小值阈值：</span>
                <InputNumber
                  value={filterConfig.minValueThreshold}
                  onChange={(value) => setFilterConfig(prev => ({ ...prev, minValueThreshold: value || 0 }))}
                  placeholder="0"
                />
                <span>最大值阈值：</span>
                <InputNumber
                  value={filterConfig.maxValueThreshold === Infinity ? undefined : filterConfig.maxValueThreshold}
                  onChange={(value) => setFilterConfig(prev => ({ ...prev, maxValueThreshold: value || Infinity }))}
                  placeholder="无限制"
                />
              </Space>
            </Panel>
            
            <Panel header="快速预设" key="presets">
              <Space wrap>
                <Button 
                  size="small" 
                  onClick={() => setFilterConfig({
                    ...defaultFilterConfig,
                    includePatterns: ['*工资*', '*合计', '*金额'],
                    excludePatterns: ['*id', '*时间', '*日期', '*编号']
                  })}
                >
                  工资相关
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setFilterConfig({
                    ...defaultFilterConfig,
                    includePatterns: ['*保险*', '*公积金*'],
                    excludePatterns: ['*id', '*时间', '*日期']
                  })}
                >
                  保险公积金
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setFilterConfig({
                    ...defaultFilterConfig,
                    showOnlyNumericColumns: true,
                    excludePatterns: ['*id', '*比例', '*费率']
                  })}
                >
                  只看金额
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setFilterConfig(defaultFilterConfig)}
                >
                  重置默认
                </Button>
              </Space>
            </Panel>
          </Collapse>
        </Card>
      )}

      {/* 🔍 智能搜索卡片 */}
      <Card 
        title={
          <Row justify="space-between" align="middle" wrap={false}>
            <Col flex="auto">
                          <Space wrap size={8}>
              <SearchOutlined />
              <span>{useAdvancedSearch ? '高级搜索' : '智能搜索'}</span>
              {!isEmptyQuery && (
                <Tag color="blue" style={{ margin: 0 }}>
                  {totalResults} 条结果
                  {performance.isOptimal && <span style={{ color: '#52c41a' }}> ⚡</span>}
                </Tag>
              )}
              <Button
                type="text"
                size="small"
                icon={useAdvancedSearch ? <SearchOutlined /> : <SettingOutlined />}
                onClick={() => setUseAdvancedSearch(!useAdvancedSearch)}
                style={{ 
                  padding: '2px 6px', 
                  height: 'auto',
                  fontSize: '12px',
                  color: '#1890ff'
                }}
              >
                {useAdvancedSearch ? '简单' : '高级'}
              </Button>
            </Space>
            </Col>
            <Col flex="none">
              <Button 
                type="text" 
                size="small"
                onClick={() => setSearchCardCollapsed(!searchCardCollapsed)}
                icon={searchCardCollapsed ? <DownOutlined /> : <UpOutlined />}
                style={{ 
                  padding: '4px 8px',
                  height: 'auto',
                  lineHeight: 1
                }}
              >
                <span 
                  style={{ fontSize: '12px' }}
                  className="search-card-toggle-text"
                >
                  {searchCardCollapsed ? '展开' : '收起'}
                </span>
              </Button>
            </Col>
          </Row>
        }
        size="small"
        style={{ 
          marginBottom: 16,
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}
        bodyStyle={{ 
          padding: searchCardCollapsed ? 0 : '16px',
          backgroundColor: '#fafafa'
        }}
      >
                {!searchCardCollapsed && (
          useAdvancedSearch ? (
            /* 高级搜索表单 */
            <AdvancedSearchForm
              onSearch={(values) => {
                console.log('🔍 [PayrollDataModal] 高级搜索参数:', values);
                // 这里需要根据高级搜索的参数来执行搜索
                if (values.keyword) {
                  search(values.keyword, values.searchMode || SearchMode.AUTO);
                } else {
                  clearSearch();
                }
              }}
              onReset={clearSearch}
              loading={isSearching}
              totalResults={totalResults}
              searchTime={searchTime}
              collapsed={false}
            />
          ) : (
            /* 简单搜索 */
            <Row gutter={[16, 12]}>
              {/* 搜索组件 */}
              <Col xs={24} sm={24} md={24} lg={24}>
                <ProFormGlobalSearch
                  value={searchQuery}
                  onSearch={search}
                  onClear={clearSearch}
                  suggestions={suggestions}
                  searchMode={searchMode}
                  onSearchModeChange={setSearchMode}
                  isSearching={isSearching}
                  totalResults={totalResults}
                  searchTime={searchTime}
                  showPerformance={true}
                  placeholder="搜索员工姓名、编号、部门、职位..."
                />
              </Col>
              
              {/* 搜索统计信息 */}
              <Col xs={24} sm={18} md={20} lg={20}>
                <div style={{ 
                  fontSize: 12, 
                  color: '#666',
                  padding: '8px 12px',
                  backgroundColor: isEmptyQuery ? '#e6f7ff' : '#f0f0f0',
                  borderRadius: '6px',
                  border: isEmptyQuery ? '1px solid #91d5ff' : '1px solid #d9d9d9',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {isEmptyQuery ? (
                    <Space size={4}>
                      <span>💡 支持多关键词搜索，用空格分隔</span>
                    </Space>
                  ) : (
                    <Space size={8} wrap>
                      <span>搜索耗时: <strong>{searchTime.toFixed(1)}ms</strong></span>
                      {performance.isOptimal && (
                        <Tag color="success" style={{ margin: 0 }}>高效</Tag>
                      )}
                    </Space>
                  )}
                </div>
              </Col>
              
              {/* 搜索模式指示器 */}
              {!isEmptyQuery && (
                <Col xs={24} sm={6} md={4} lg={4}>
                  <div style={{ 
                    fontSize: 11,
                    color: '#999',
                    padding: '8px 12px',
                    backgroundColor: '#fff',
                    border: '1px solid #e8e8e8',
                    borderRadius: '6px',
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    模式: {searchMode === 'fuzzy' ? '模糊' : searchMode === 'exact' ? '精确' : '智能'}
                  </div>
                </Col>
              )}
            </Row>
          )
        )}
      </Card>

      <ProTable<PayrollData>
        actionRef={actionRef}
        columns={dynamicColumns}
        dataSource={filteredDataSource}
        loading={loading}
        rowKey="id"
        search={false}
        headerTitle={false}
        toolbar={{
          actions: [
            <Button 
              key="filter" 
              icon={<FilterOutlined />} 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              type={showFilterPanel ? 'primary' : 'default'}
            >
              列筛选配置
            </Button>,
            <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh}>
              {t('common:button.refresh')}
            </Button>,
            <Button
              key="export"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              disabled={filteredDataSource.length === 0}
            >
              {t('common:button.export_excel')} ({filteredDataSource.length})
            </Button>,
          ]
        }}
        onChange={(pagination, filters, sorter, extra) => {
          // 当表格筛选、排序或分页变化时，记录变化信息
          console.log('🔍 [PayrollDataModal] 表格变化:', {
            pagination,
            filters,
            sorter,
            currentDataSourceLength: extra.currentDataSource?.length,
            action: extra.action
          });
          // 注意：我们现在直接使用 dataSource，不再需要状态同步
        }}
        columnsState={{
          persistenceKey: 'payroll-data-table',
          persistenceType: 'localStorage',
          onChange: (newColumnsState) => {
            console.log('📊 [ProTable] 列状态变化:', newColumnsState);
            setCurrentColumnsState(newColumnsState || {});
          },
        }}
        options={{
          reload: handleRefresh,
          density: true,
          fullScreen: true,
          setting: {
            listsHeight: 400,
            draggable: true,
            checkable: true,
          },
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredDataSource.length,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page, size) => {
            setPagination(prev => ({
              ...prev,
              current: page,
              pageSize: size || prev.pageSize,
            }));
          },
        }}
        scroll={{ x: 'max-content' }}
        size="small"
        cardBordered
        tableAlertRender={({ selectedRowKeys, selectedRows, onCleanSelected }) => (
          selectedRowKeys.length > 0 && (
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 项
              &nbsp;&nbsp;
              <span>
                应发合计: ¥{selectedRows.reduce((sum, row) => {
                  const value = row.应发合计;
                  const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
                  return sum + (isNaN(numValue) ? 0 : numValue);
                }, 0).toFixed(2)}
                &nbsp;&nbsp;
                实发合计: ¥{selectedRows.reduce((sum, row) => {
                  const value = row.实发合计;
                  const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
                  return sum + (isNaN(numValue) ? 0 : numValue);
                }, 0).toFixed(2)}
              </span>
            </div>
          )
        )}
        tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => (
          <div>
            <a 
              onClick={() => {
                // 批量删除逻辑
                console.log('批量删除选中的记录:', selectedRowKeys);
                message.warning('批量删除功能开发中...');
              }}
              style={{ color: '#ff4d4f' }}
            >
              批量删除
            </a>
            &nbsp;&nbsp;
            <a onClick={onCleanSelected}>取消选择</a>
          </div>
        )}
        rowSelection={{
          type: 'checkbox',
          // 可以添加批量操作
        }}
      />

      {/* 🎯 详情查看Modal */}
      {detailModalVisible && selectedEntryId && (
        <PayrollEntryDetailModal
          visible={detailModalVisible}
          entryId={selectedEntryId}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedEntryId(null);
          }}
        />
      )}

      {/* 🎯 编辑Modal */}
      {editModalVisible && selectedEntry && (
        <PayrollEntryFormModal
          visible={editModalVisible}
          payrollPeriodId={periodId}
          payrollRunId={payrollRunId}
          entry={selectedEntry}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedEntry(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </Modal>
  );
}; 