import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal, message, Button, Space, Input, Card, Collapse, Switch, Tag, Select, InputNumber, Divider, Row, Col } from 'antd';
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { ReloadOutlined, DownloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, FilterOutlined, SettingOutlined, DeleteOutlined, UpOutlined, DownOutlined, BookOutlined } from '@ant-design/icons';
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

// 搜索功能导入
import { usePayrollSearch } from '../../../hooks/usePayrollSearch';
import { SearchMode } from '../../../utils/searchUtils';
import { ProFormGlobalSearch } from '../../../components/PayrollDataModal/ProFormGlobalSearch';
import { TableCellHighlight } from '../../../components/PayrollDataModal/HighlightText';

// 预设报表管理功能导入
import { PresetManager } from '../../../components/PayrollDataModal/PresetManager';
import { usePayrollDataPresets } from '../../../hooks/usePayrollDataPresets';
import type { ColumnFilterConfig as PresetColumnFilterConfig, ColumnSettings, PayrollDataModalPreset } from '../../../types/payrollDataPresets';

// 导入CSS样式，解决拖拽交互问题
import './payrollDataModalStyles.css';

const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

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

  // 临时使用基础筛选逻辑，完整筛选逻辑将在 tableFilterState 定义后实现
  const baseFilteredDataSource = isEmptyQuery ? dataSource : searchResults.map(result => result.item);
  
  // React Query 相关 Hooks
  const { refreshFiltered, clearCache } = useRefreshPayrollData();
  const { getCacheSize, getQueryStatus } = usePayrollDataCacheStatus();
  const { onDeleteSuccess, onBatchOperationSuccess } = usePayrollDataMutations();
  const [dynamicColumns, setDynamicColumns] = useState<ProColumns<PayrollData>[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [searchCardCollapsed, setSearchCardCollapsed] = useState(false);

  // 数字格式化函数：只返回格式化的字符串，保持原始数据类型用于Excel导出
  const formatNumber = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && isFinite(numValue)) {
        return numValue.toLocaleString('zh-CN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      }
    }
    
    return value.toString();
  };

  // 数字渲染函数：用于表格显示，返回React元素
  const renderNumber = (value: any) => {
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

  // 日期格式化函数：将日期格式化为中文年月格式 (YYYY年MM月)
  const formatDateToChinese = (value: any) => {
    if (value === null || value === undefined) {
      return <span style={{ color: '#999' }}>N/A</span>;
    }
    
    const dateStr = String(value);
    
    // 尝试解析各种日期格式
    let date: Date | null = null;
    
    // 格式1: 标准日期字符串 (YYYY-MM-DD)
    const standardMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (standardMatch) {
      const year = parseInt(standardMatch[1]);
      const month = parseInt(standardMatch[2]) - 1;
      const day = parseInt(standardMatch[3]);
      date = new Date(year, month, day);
    }
    
    // 格式2: 已经是中文格式 (YYYY年MM月)
    if (!date) {
      const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月/);
      if (chineseMatch) {
        const year = parseInt(chineseMatch[1]);
        const month = parseInt(chineseMatch[2]) - 1;
        date = new Date(year, month);
      }
    }
    
    // 格式3: 其他标准日期格式
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
  
  // 🎯 新增：表头筛选状态管理
  const [tableFilterState, setTableFilterState] = useState<{
    filters: Record<string, any>;
    sorter: any;
    pagination: { current: number; pageSize: number; total: number };
  }>({
    filters: {},
    sorter: {},
    pagination: { current: 1, pageSize: 10, total: 0 }
  });

  // 🎯 综合筛选逻辑：同时考虑搜索筛选和表头筛选
  const filteredDataSource = useMemo(() => {
    // 首先应用搜索筛选
    let baseData = baseFilteredDataSource;
    
    // 然后应用表头筛选器
    if (tableFilterState.filters && Object.keys(tableFilterState.filters).length > 0) {
      baseData = baseData.filter(record => {
        return Object.entries(tableFilterState.filters).every(([filterKey, filterValues]) => {
          if (!filterValues || (Array.isArray(filterValues) && filterValues.length === 0)) {
            return true; // 没有筛选条件，通过
          }
          
          const recordValue = record[filterKey as keyof PayrollData];
          
          if (Array.isArray(filterValues)) {
            // 多选筛选
            return filterValues.includes(recordValue);
          } else {
            // 单值筛选（如搜索框）
            if (typeof recordValue === 'string' && typeof filterValues === 'string') {
              return recordValue.toLowerCase().includes(filterValues.toLowerCase());
            }
            return recordValue === filterValues;
          }
        });
      });
    }
    
    return baseData;
  }, [baseFilteredDataSource, tableFilterState.filters]);
  
  // 🎯 详情和编辑功能状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [payrollRunId, setPayrollRunId] = useState<number | null>(null);

  // 🎯 预设报表管理功能状态
  const [presetManagerVisible, setPresetManagerVisible] = useState(false);
  
  // 🎯 预设报表管理Hook
  const { defaultPreset, loadDefaultPreset, setCurrentPreset } = usePayrollDataPresets();

  // 💡 安全的 JSON 序列化函数，避免循环引用
  const safeStringify = useCallback((obj: any): string => {
    try {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, val) => {
        if (val != null && typeof val === 'object') {
          if (seen.has(val)) {
            return '[Circular Reference]';
          }
          seen.add(val);
        }
        return val;
      }, 2); // 添加缩进以保持可读性
    } catch (error) {
      console.warn('JSON序列化失败:', error);
      return '[Object]';
    }
  }, []);

  // 🔍 调试：监听defaultPreset状态变化
  useEffect(() => {
    console.log('🔍 [PayrollDataModal] defaultPreset状态变化:', {
      defaultPreset: defaultPreset,
      presetName: defaultPreset?.name,
      presetId: defaultPreset?.id,
      timestamp: new Date().toISOString()
    });
  }, [defaultPreset]);

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

  // 🎯 加载默认预设配置
  useEffect(() => {
    if (visible) {
      console.log('🔍 [PayrollDataModal] 开始加载默认预设配置...');
      loadDefaultPreset().then(preset => {
        console.log('🔍 [PayrollDataModal] 默认预设加载结果:', {
          preset: preset,
          presetName: preset?.name,
          presetId: preset?.id,
          hasPreset: !!preset
        });
        if (preset) {
          // 应用默认预设的筛选配置
          setFilterConfig(preset.filterConfig);
          // 注意：列设置会在列生成后通过 columnsState 应用
          console.log('✅ [PayrollDataModal] 已加载默认预设:', preset.name);
        } else {
          console.log('⚠️ [PayrollDataModal] 没有找到默认预设配置');
        }
      }).catch(error => {
        console.warn('⚠️ [PayrollDataModal] 加载默认预设失败:', error);
      });
    }
  }, [visible, loadDefaultPreset]);

  // 🔧 修复列设置交互事件冲突（按钮点击、拖拽等）
  useEffect(() => {
    if (!visible) return;

    const handleInteractionEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // 处理移动按钮点击
      const button = target.closest('[aria-label*="vertical-align"]');
      if (button) {
        e.stopPropagation();
        e.preventDefault();
        
        const ariaLabel = button.getAttribute('aria-label');
        const isTopButton = ariaLabel?.includes('vertical-align-top');
        const isBottomButton = ariaLabel?.includes('vertical-align-bottom');
        
        console.log('🎯 [按钮点击] 移动按钮被正确处理:', {
          type: isTopButton ? '移到最上面' : isBottomButton ? '移到最下面' : '未知',
          ariaLabel
        });
        return;
      }
      
      // 处理拖拽手柄交互
      const dragHandle = target.closest('[aria-label="holder"]');
      if (dragHandle) {
        // 不阻止拖拽事件，但确保不会触发字段选择
        console.log('🔄 [拖拽手柄] 拖拽操作被正确处理');
        return;
      }
      
      // 处理复选框点击
      const checkbox = target.closest('.ant-tree-checkbox');
      if (checkbox) {
        console.log('☑️ [复选框] 复选框操作被正确处理');
        return;
      }
    };

    const handleDragStart = (e: Event) => {
      const target = e.target as HTMLElement;
      const dragHandle = target.closest('[aria-label="holder"]');
      if (dragHandle) {
        console.log('🚀 [拖拽开始] 拖拽操作开始');
        // 确保拖拽时不会触发其他事件
        e.stopPropagation();
      }
    };

    // 使用捕获阶段监听，确保在树节点事件之前处理
    const timer = setTimeout(() => {
      const columnSetting = document.querySelector('.ant-pro-table-column-setting');
      if (columnSetting) {
        // 监听点击事件
        columnSetting.addEventListener('click', handleInteractionEvent, true);
        // 监听拖拽开始事件
        columnSetting.addEventListener('dragstart', handleDragStart, true);
        // 监听鼠标按下事件（用于拖拽）
        columnSetting.addEventListener('mousedown', handleInteractionEvent, true);
        
        console.log('✅ [事件监听] 列设置交互事件监听器已添加');
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      const columnSetting = document.querySelector('.ant-pro-table-column-setting');
      if (columnSetting) {
        columnSetting.removeEventListener('click', handleInteractionEvent, true);
        columnSetting.removeEventListener('dragstart', handleDragStart, true);
        columnSetting.removeEventListener('mousedown', handleInteractionEvent, true);
        console.log('🧹 [事件清理] 列设置交互事件监听器已移除');
      }
    };
  }, [visible]);

  // 当筛选配置改变时重新生成列 - 保持用户列设置
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
          render: (text: any, record: PayrollData, index: number) => {
              if (text === null || typeof text === 'undefined') {
                return <span style={{ color: '#999' }}>N/A</span>;
              }
              
              if (typeof text === 'object') {
                return (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px' }}>
                    {safeStringify(text)}
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
              
            // 特殊处理：日期字段使用中文年月格式
            const dateFields = ['出生日期', '入职日期', '首次工作日期', '现职位开始日期'];
            if (dateFields.includes(key)) {
              return formatDateToChinese(text);
            }
            
            // 特殊处理：序号、电话、身份证号、住房公积金客户号、银行账号使用文本格式，不进行数字格式化
            if (key === '序号' || key === '电话' || key === '身份证号' || key === '住房公积金客户号' || key === '银行账号') {
              // 对于这些字段，即使是数字也显示为文本
              if (!isEmptyQuery) {
                return (
                  <TableCellHighlight
                    text={text.toString()}
                    searchQuery={searchQuery}
                    type="text"
                  />
                );
              }
              return text.toString();
            }
            
            // 检查是否为数字类型，使用专门的渲染函数
            if (typeof text === 'number' || (typeof text === 'string' && !isNaN(parseFloat(text)) && isFinite(parseFloat(text)))) {
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
              return renderNumber(text);
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
            
            // 🎯 关键修复：设置预设的筛选值
            const presetFilterValue = tableFilterState.filters?.[key];
            if (presetFilterValue) {
              column.filteredValue = Array.isArray(presetFilterValue) ? presetFilterValue : [presetFilterValue];
              console.log(`🔍 [列筛选恢复] ${key}: 恢复筛选值`, column.filteredValue);
            }
          }
        }

        // 为员工姓名添加文本搜索功能和固定在左侧
        if (key === '员工姓名') {
          // 固定姓名列在左侧
          column.fixed = 'left';
          column.width = 120;
          
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
                  if (clearFilters) {
                    clearFilters();
                  }
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
            const name = record[key as keyof PayrollData];
            return name ? String(name).toLowerCase().includes(String(value).toLowerCase()) : false;
          };
          
          // 🎯 关键修复：设置预设的搜索筛选值
          const presetFilterValue = tableFilterState.filters?.[key];
          if (presetFilterValue) {
            column.filteredValue = Array.isArray(presetFilterValue) ? presetFilterValue : [presetFilterValue];
            console.log(`🔍 [搜索筛选恢复] ${key}: 恢复搜索值`, column.filteredValue);
          }
        }
        
        return column;
      });

      // 🎯 按照指定顺序重新排列列：员工信息｜应发合计｜扣发合计｜实发合计｜应发明细｜个人扣发明细｜单位扣发明细
      const orderedColumns: ProColumns<PayrollData>[] = [];
      
      // 1. 员工信息字段（按重要性排序）
      const employeeInfoFields = [
        '员工姓名', '员工编号', '部门名称', '职位名称', '人员类别', '编制', 
        '薪资期间名称', '期间开始日期', '期间结束日期'
      ];
      
      // 2. 汇总字段
      const summaryFields = ['应发合计', '扣除合计', '实发合计'];
      
      // 3. 应发明细字段（按重要性排序）
      const earningsFields = [
        '基本工资', '岗位工资', '薪级工资', '绩效工资', '津贴', '补助',
        '职务技术等级工资', '级别岗位级别工资', '基础绩效', '月奖励绩效',
        '独生子女父母奖励金', '公务员规范性津贴补贴', '公务交通补贴',
        '九三年工改保留津补贴', '信访工作人员岗位工作津贴', '乡镇工作补贴'
      ];
      
      // 4. 个人扣缴字段
      const personalDeductionFields = [
        '养老保险个人应缴费额', '医疗保险个人应缴费额', '失业保险个人应缴费额',
        '职业年金个人应缴费额', '住房公积金个人应缴费额', '个人所得税'
      ];
      
      // 5. 单位扣缴字段
      const employerDeductionFields = [
        '养老保险单位应缴费额', '医疗保险单位应缴费额', '医疗保险单位应缴总额',
        '大病医疗单位应缴费额', '失业保险单位应缴费额', '工伤保险单位应缴费额',
        '职业年金单位应缴费额', '住房公积金单位应缴费额'
      ];
      
      // 按顺序添加字段
      const fieldGroups = [
        employeeInfoFields,
        summaryFields,
        earningsFields,
        personalDeductionFields,
        employerDeductionFields
      ];
      
      // 创建字段映射
      const columnMap = new Map<string, ProColumns<PayrollData>>();
      generatedColumns.forEach(col => {
        if (col.key) {
          columnMap.set(String(col.key), col);
        }
      });
      
      // 按组顺序添加列
      fieldGroups.forEach(group => {
        group.forEach(fieldKey => {
          const column = columnMap.get(fieldKey);
          if (column) {
            // 确保所有列默认都有filteredValue属性，没有筛选时设为undefined
            if (column.filteredValue === undefined && !tableFilterState.filters?.[String(column.key)]) {
              column.filteredValue = undefined;
            }
            orderedColumns.push(column);
            columnMap.delete(fieldKey); // 避免重复添加
          }
        });
      });
      
      // 添加剩余的其他字段
      columnMap.forEach(column => {
        // 确保所有列默认都有filteredValue属性，没有筛选时设为undefined
        if (column.filteredValue === undefined && !tableFilterState.filters?.[String(column.key)]) {
          column.filteredValue = undefined;
        }
        orderedColumns.push(column);
      });

      // 添加操作列
      orderedColumns.push({
        title: t('common:table.action'),
        key: 'action',
        fixed: 'right',
        width: 120,
        render: (_, record) => (
          <Space size="small">
            <TableActionButton
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              tooltipTitle={t('common:button.view')}
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
                console.log('🗑️ [删除操作] 删除记录:', record);
                message.warning('删除功能开发中...');
              }}
              tooltipTitle={t('common:button.delete')}
              actionType="delete"
            />
          </Space>
        ),
      });
      
      // 🎯 智能同步机制：保持用户的列设置
      setDynamicColumns(prevColumns => {
        // 如果是首次生成或列结构发生重大变化，直接使用新列
        if (prevColumns.length === 0) {
          console.log('🔄 [列同步] 首次生成列，直接使用新列配置');
          return orderedColumns;
    }
        
        // 检查列是否发生了实质性变化（列的key集合是否不同）
        const prevKeys = new Set(prevColumns.map(col => col.key));
        const newKeys = new Set(orderedColumns.map(col => col.key));
        const keysChanged = prevKeys.size !== newKeys.size || 
                           [...prevKeys].some(key => !newKeys.has(key)) ||
                           [...newKeys].some(key => !prevKeys.has(key));
        
        if (keysChanged) {
          console.log('🔄 [列同步] 列结构发生变化，需要同步用户设置');
          console.log('🔄 [列同步] 旧列keys:', [...prevKeys]);
          console.log('🔄 [列同步] 新列keys:', [...newKeys]);
          
          // 🎯 保持用户的列设置：将现有的列状态应用到新列
          const updatedColumnsState: Record<string, any> = {};
          
          // 遍历新列，检查是否在用户设置中存在
          orderedColumns.forEach(newCol => {
            const key = String(newCol.key || '');
            const existingState = currentColumnsState[key];
            
            if (existingState) {
              // 保持用户的显示/隐藏和顺序设置
              updatedColumnsState[key] = existingState;
              console.log(`🔄 [列同步] 保持列 ${key} 的用户设置:`, existingState);
            } else {
              // 新列默认显示
              updatedColumnsState[key] = { show: true };
              console.log(`🔄 [列同步] 新列 ${key} 默认显示`);
            }
          });
          
          // 更新列状态（这会触发ProTable重新渲染）
          setCurrentColumnsState(updatedColumnsState);
          
          return orderedColumns;
        } else {
          console.log('🔄 [列同步] 列结构未变化，保持现有列配置');
          return prevColumns;
        }
      });
    }
  }, [dataSource, t, filterConfig, matchesPattern]); // 移除 currentColumnsState 依赖避免循环

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
    console.log('🔄 [PayrollDataModal] Edit button clicked for entry:', record.薪资条目id);
    console.log('✏️ [PayrollDataModal] 编辑记录:', record);
    
    if (!record.薪资条目id) {
      message.warning(t('payroll:runs_page.form.placeholder.payroll_period'));
      return;
    }

    try {
      // 根据薪资条目ID获取完整的薪资条目数据
      console.log('🔄 [PayrollDataModal] Fetching payroll entry by ID:', record.薪资条目id);
      const response = await getPayrollEntryById(record.薪资条目id);
      
      if (response.data) {
        const payrollEntry = response.data;
        console.log('🔄 [PayrollDataModal] Setting selected entry and opening modal');
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
    console.log('🔄 [PayrollDataModal] Edit success callback triggered');
    console.log('🔄 [PayrollDataModal] Closing edit modal and refreshing data');
    setEditModalVisible(false);
    setSelectedEntry(null);
    setPayrollRunId(null);
    refetch(); // 🚀 使用 React Query 刷新数据
    message.success(t('payroll:entry_form.message.update_success'));
    console.log('✅ [PayrollDataModal] Edit success processing completed');
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
        return safeStringify(value);
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

      // 🎯 生成导出数据，转换字符串数字为数字类型
      const exportData = filteredDataSource.map((item, index) => {
        const row: { [key: string]: any } = { '序号': index + 1 };
        
        visibleColumns.forEach(col => {
          if (col.dataIndex) {
            const dataIndex = col.dataIndex as keyof PayrollData;
            const columnTitle = String(col.title || col.dataIndex);
            const rawValue = item[dataIndex];
            
            // 保持原始数据类型，特别保护数字类型
            if (typeof rawValue === 'number') {
              // 数字类型直接保持，Excel会正确识别
              row[columnTitle] = rawValue;
            } else if (typeof rawValue === 'string' && !isNaN(parseFloat(rawValue)) && isFinite(parseFloat(rawValue))) {
              // 字符串数字转换为数字类型
              row[columnTitle] = parseFloat(rawValue);
            } else if (rawValue === null || rawValue === undefined) {
              // 空值保持为null，Excel会显示为空
              row[columnTitle] = null;
            } else {
              // 其他类型保持原样
              row[columnTitle] = rawValue;
            }
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

      // 🔍 调试：检查数据类型和数字格式保持情况
      if (exportData.length > 0) {
        const sampleRow = exportData[0];
        const typeAnalysis: Record<string, any> = {};
        
        Object.entries(sampleRow).forEach(([key, value]) => {
          typeAnalysis[key] = {
            value: value,
            type: typeof value,
            isNumber: typeof value === 'number',
            isValidNumber: typeof value === 'number' && !isNaN(value) && isFinite(value),
            canParseAsNumber: typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value)),
            isNull: value === null || value === undefined
          };
        });
        
        console.log('🔍 [数据类型分析]:', typeAnalysis);
        
        // 统计数字字段
        const numberFields = Object.entries(typeAnalysis)
          .filter(([key, info]) => info.isValidNumber)
          .map(([key]) => key);
        
        const stringNumberFields = Object.entries(typeAnalysis)
          .filter(([key, info]) => info.canParseAsNumber)
          .map(([key]) => key);

        const nullFields = Object.entries(typeAnalysis)
          .filter(([key, info]) => info.isNull)
          .map(([key]) => key);
          
        console.log('🔢 [数字格式保持统计]:', {
          原生数字字段: numberFields,
          字符串数字字段: stringNumberFields,
          空值字段: nullFields,
          原生数字字段数量: numberFields.length,
          字符串数字字段数量: stringNumberFields.length,
          空值字段数量: nullFields.length,
          总字段数量: Object.keys(typeAnalysis).length
        });

        // 验证数字格式是否正确保持
        const numericColumns = ['应发合计', '扣除合计', '实发合计', '基本工资', '绩效工资'];
        const formatValidation = numericColumns.map(col => {
          const value = sampleRow[col];
          return {
            列名: col,
            原始值: value,
            类型: typeof value,
            是否为数字: typeof value === 'number',
            格式正确: typeof value === 'number' || value === null
          };
        });

        console.log('✅ [数字格式验证]:', formatValidation);
        
        // 检查是否有格式错误
        const formatErrors = formatValidation.filter(item => !item.格式正确);
        if (formatErrors.length > 0) {
          console.warn('⚠️ [格式警告] 发现数字格式问题:', formatErrors);
        } else {
          console.log('✅ [格式验证] 所有数字字段格式正确！');
        }
      }

      // 创建工作表
      import('exceljs').then(async (ExcelJS) => {
        // 创建工作簿
        const workbook = new ExcelJS.Workbook();
        
        // 设置工作簿属性
        workbook.creator = 'Salary System';
        workbook.created = new Date();
        workbook.title = '薪资数据导出';
        workbook.subject = '薪资数据';
        
        // 添加工作表
        const worksheet = workbook.addWorksheet('薪资数据');
        
        // 获取表头
        const headers = Object.keys(exportData[0]);
        
        // 设置表头
        worksheet.addRow(headers);
        
        // 设置表头样式
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        // 统计计数器
        let numberCellCount = 0;
        let textCellCount = 0;
        let nullCellCount = 0;
        
        // 添加数据行
        exportData.forEach((rowData, rowIndex) => {
          const row = worksheet.addRow(Object.values(rowData));
          
          // 设置数据格式
          headers.forEach((header, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            const cellValue = rowData[header];
            
            if (typeof cellValue === 'number' && !isNaN(cellValue) && isFinite(cellValue)) {
              // 数字类型：设置千分位分隔符 + 2位小数
              cell.numFmt = '#,##0.00';
              numberCellCount++;
              
              // 调试：记录数字单元格
              if (rowIndex === 0) { // 只记录第一行数据
                console.log(`🔢 [数字单元格] ${header}: ${cellValue} (${typeof cellValue})`);
              }
            } else if (typeof cellValue === 'string' && !isNaN(parseFloat(cellValue)) && isFinite(parseFloat(cellValue))) {
              // 字符串数字：转换为数字并设置格式
              cell.value = parseFloat(cellValue);
              cell.numFmt = '#,##0.00';
              numberCellCount++;
              
              // 调试：记录转换的数字单元格
              if (rowIndex === 0) { // 只记录第一行数据
                console.log(`🔄 [转换数字单元格] ${header}: "${cellValue}" -> ${parseFloat(cellValue)} (string->number)`);
              }
            } else if (cellValue === null || cellValue === undefined) {
              // 空值处理
              cell.value = '';
              nullCellCount++;
            } else {
              // 其他类型保持原样
              textCellCount++;
              
              // 调试：记录文本单元格
              if (rowIndex === 0) { // 只记录第一行数据
                console.log(`📝 [文本单元格] ${header}: ${cellValue} (${typeof cellValue})`);
              }
            }
          });
        });
        
        console.log('📊 [Excel格式化统计]:', {
          数字单元格数量: numberCellCount,
          文本单元格数量: textCellCount,
          空值单元格数量: nullCellCount,
          总单元格数量: numberCellCount + textCellCount + nullCellCount
        });
        
        // 设置列宽 - 基于内容长度自动调整
        headers.forEach((header, index) => {
          const maxLength = Math.max(
            header.length,
            ...exportData.slice(0, 100).map(row => String(row[header] || '').length)
          );
          const width = Math.min(Math.max(maxLength + 2, 10), 50);
          worksheet.getColumn(index + 1).width = width;
        });
        
        // 生成安全的文件名（避免特殊字符）
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
        
        // 🔍 调试：检查预设名称获取情况
        console.log('🔍 [导出Excel] 预设名称调试信息:', {
          defaultPreset: defaultPreset,
          presetName: defaultPreset?.name,
          hasDefaultPreset: !!defaultPreset,
          presetId: defaultPreset?.id,
          presetDescription: defaultPreset?.description
        });
        
        // 获取当前预设名称，尝试多种方式
        let presetName = '薪资数据'; // 默认名称
        
        // 方式1：从defaultPreset获取
        if (defaultPreset?.name) {
          presetName = defaultPreset.name;
          console.log('✅ [导出Excel] 使用defaultPreset名称:', presetName);
        }
        // 方式2：从当前筛选配置推断预设类型
        else if (filterConfig.includePatterns.length > 0) {
          const patterns = filterConfig.includePatterns.join(',');
          if (patterns.includes('工资')) {
            presetName = '工资明细报表';
          } else if (patterns.includes('保险') || patterns.includes('公积金')) {
            presetName = '保险公积金报表';
          } else if (filterConfig.showOnlyNumericColumns) {
            presetName = '数值汇总报表';
          } else {
            presetName = '自定义筛选报表';
          }
          console.log('✅ [导出Excel] 根据筛选配置推断预设名称:', presetName);
        }
        // 方式3：根据期间名称生成
        else if (periodName) {
          presetName = `${periodName}_薪资数据`;
          console.log('✅ [导出Excel] 使用期间名称:', presetName);
        }
        
        console.log('🔍 [导出Excel] 最终确定的预设名称:', presetName);
        
        // 清理预设名称中的特殊字符
        const safePresetName = presetName.replace(/[<>:"/\\|?*]/g, '_');
        
        console.log('🔍 [导出Excel] 文件名生成调试:', {
          原始预设名称: defaultPreset?.name,
          使用的预设名称: presetName,
          安全预设名称: safePresetName,
          日期字符串: dateStr,
          时间字符串: timeStr
        });
        
        // 构建包含薪资周期的文件名
        let safeFileName = '';
        if (periodName) {
          // 清理期间名称中的特殊字符
          const safePeriodName = periodName.replace(/[<>:"/\\|?*]/g, '_');
          safeFileName = `${safePeriodName}_${safePresetName}_${dateStr}_${timeStr}.xlsx`;
        } else {
          safeFileName = `${safePresetName}_${dateStr}_${timeStr}.xlsx`;
        }
        
        console.log('🔍 [导出Excel] 最终文件名:', safeFileName);
        
        // 导出文件
        const buffer = await workbook.xlsx.writeBuffer();
        
        // 创建下载链接
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = safeFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
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

  // 🎯 预设应用处理函数
  const handleApplyPreset = useCallback((preset: PayrollDataModalPreset) => {
    try {
      console.log('🎯 [PayrollDataModal] 开始应用预设配置:', preset);
      
      // 🔧 关键修复：更新当前预设状态
      // 这里我们需要通过Hook来更新defaultPreset状态
      // 由于我们不能直接调用Hook的内部方法，我们需要另一种方式
      
      // 🎯 关键修复：同步更新当前预设状态
      setCurrentPreset(preset);
      console.log('🔧 [PayrollDataModal] 已更新当前预设状态:', preset.name);
      
      // 应用筛选配置
      setFilterConfig(preset.filterConfig);
      
      // 应用列设置
      if (preset.columnSettings) {
        setCurrentColumnsState(preset.columnSettings);
        console.log('📊 [PayrollDataModal] 已更新列状态:', preset.columnSettings);
      }
      
      // 🎯 应用表头筛选状态
      if (preset.tableFilterState) {
        // 恢复全局搜索状态
        if (preset.tableFilterState.searchQuery) {
          search(preset.tableFilterState.searchQuery);
          console.log('🔍 [PayrollDataModal] 已恢复搜索查询:', preset.tableFilterState.searchQuery);
        } else {
          // 如果预设没有搜索查询，清空当前搜索
          clearSearch();
          console.log('🔍 [PayrollDataModal] 已清空搜索查询');
        }
        
        // 恢复搜索模式
        if (preset.tableFilterState.searchMode) {
          setSearchMode(preset.tableFilterState.searchMode as any);
          console.log('🔍 [PayrollDataModal] 已恢复搜索模式:', preset.tableFilterState.searchMode);
        }
        
        // 恢复分页状态
        if (preset.tableFilterState.pagination) {
          setPagination(prev => ({
            ...prev,
            current: preset.tableFilterState?.pagination?.current || 1,
            pageSize: preset.tableFilterState?.pagination?.pageSize || 10
          }));
          console.log('📄 [PayrollDataModal] 已恢复分页状态:', preset.tableFilterState.pagination);
        }
        
        // 🎯 关键修复：恢复表头筛选和排序状态
        setTableFilterState(prev => ({
          ...prev,
          filters: preset.tableFilterState?.filters || {},
          sorter: preset.tableFilterState?.sorter || {},
          pagination: {
            current: preset.tableFilterState?.pagination?.current || 1,
            pageSize: preset.tableFilterState?.pagination?.pageSize || 10,
            total: prev.pagination.total // 保持当前总数
          }
        }));
        
        console.log('🎯 [PayrollDataModal] 已恢复表头筛选状态:', {
          filters: preset.tableFilterState?.filters,
          sorter: preset.tableFilterState?.sorter,
          pagination: preset.tableFilterState?.pagination
        });
        
        // 🎯 关键修复：强制重新生成列以应用筛选状态
        // 通过触发依赖项变化来重新生成动态列
        setTimeout(() => {
          console.log('🔄 [PayrollDataModal] 触发列重新生成以应用筛选状态');
          // 这里我们可以通过更新一个状态来触发列重新生成
          setFilterConfig(prev => ({ ...prev }));
        }, 50);
      } else {
        // 如果预设没有表头筛选状态，清空当前状态
        setTableFilterState({
          filters: {},
          sorter: {},
          pagination: { current: 1, pageSize: 10, total: 0 }
        });
        clearSearch();
        console.log('🎯 [PayrollDataModal] 预设无表头筛选状态，已清空当前状态');
      }
      
      // 强制刷新表格以确保所有配置生效
      setTimeout(() => {
        if (actionRef.current) {
          actionRef.current.reload();
          console.log('🔄 [PayrollDataModal] 已强制刷新表格');
        }
      }, 100);
      
      message.success(t('payroll:presets.apply_success'));
      console.log('✅ [PayrollDataModal] 预设配置应用完成');
    } catch (error) {
      console.error('❌ [PayrollDataModal] 应用预设失败:', error);
      message.error(t('payroll:presets.apply_failed'));
    }
  }, [t, search, setSearchMode, setPagination, setCurrentPreset]);

  // 🎯 安全序列化函数 - 排除循环引用和不可序列化的对象
  const safeSerialize = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // 基本数据类型直接返回
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map(item => {
        // 只保留基本数据类型和简单对象
        if (typeof item === 'object' && item !== null) {
          // 检查是否是DOM元素或React组件
          if (item.nodeType || item._owner || item.$$typeof) {
            return null;
          }
          return safeSerialize(item);
        }
        return item;
      }).filter(item => item !== null);
    }
    
    // 处理对象
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        // 跳过函数、Symbol、DOM元素和React组件
        if (typeof value === 'function' || 
            typeof value === 'symbol' ||
            (value && typeof value === 'object' && (
              value.nodeType || 
              value._owner || 
              value.$$typeof ||
              value instanceof Element ||
              value instanceof Node
            ))) {
          continue;
        }
        
        // 递归处理嵌套对象
        if (typeof value === 'object' && value !== null) {
          result[key] = safeSerialize(value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  };

  // 🎯 获取当前配置用于保存预设
  const getCurrentConfig = useCallback(() => {
    // 安全提取筛选器状态，只保留可序列化的数据
    const safeFilters: Record<string, any> = {};
    if (tableFilterState.filters) {
      Object.keys(tableFilterState.filters).forEach(key => {
        const filterValue = tableFilterState.filters[key];
        // 只保留基本数据类型的筛选值
        if (Array.isArray(filterValue)) {
          safeFilters[key] = filterValue.filter(v => 
            typeof v === 'string' || 
            typeof v === 'number' || 
            typeof v === 'boolean'
          );
        } else if (typeof filterValue === 'string' || 
                   typeof filterValue === 'number' || 
                   typeof filterValue === 'boolean') {
          safeFilters[key] = filterValue;
        }
      });
    }
    
    // 安全提取排序状态
    const safeSorter: any = {};
    if (tableFilterState.sorter) {
      if (typeof tableFilterState.sorter.field === 'string') {
        safeSorter.field = tableFilterState.sorter.field;
      }
      if (typeof tableFilterState.sorter.order === 'string') {
        safeSorter.order = tableFilterState.sorter.order;
      }
    }
    
    const currentTableFilterState = {
      filters: safeFilters,
      sorter: safeSorter,
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total
      },
      searchQuery: searchQuery,
      searchMode: searchMode
    };
    
    // 使用安全序列化函数进一步清理
    const safeTableFilterState = safeSerialize(currentTableFilterState);
    
    console.log('📋 [PayrollDataModal] 获取当前配置:', {
      filterConfig,
      columnSettings: currentColumnsState,
      tableFilterState: safeTableFilterState
    });
    
    // 最终验证：尝试序列化整个配置对象
    const finalConfig = {
      filterConfig,
      columnSettings: currentColumnsState,
      tableFilterState: safeTableFilterState
    };
    
    try {
      JSON.stringify(finalConfig);
      console.log('✅ [PayrollDataModal] 配置对象可以安全序列化');
    } catch (error) {
      console.error('❌ [PayrollDataModal] 配置对象序列化失败:', error);
      // 如果仍然有序列化问题，返回一个更安全的版本
      return {
        filterConfig: safeSerialize(filterConfig),
        columnSettings: safeSerialize(currentColumnsState),
        tableFilterState: {
          filters: {},
          sorter: {},
          pagination: {
            current: pagination.current || 1,
            pageSize: pagination.pageSize || 50,
            total: pagination.total || 0
          },
          searchQuery: typeof searchQuery === 'string' ? searchQuery : '',
          searchMode: typeof searchMode === 'string' ? searchMode : 'simple'
        }
      };
    }
    
    return finalConfig;
  }, [filterConfig, currentColumnsState, tableFilterState, pagination, searchQuery, searchMode]);

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
          
          /* 多选框自适应多行样式 */
          .ant-select-selector {
            min-height: 32px !important;
            height: auto !important;
            padding: 4px 11px !important;
          }
          
          .ant-select-selection-overflow {
            flex-wrap: wrap !important;
          }
          
          .ant-select-selection-item {
            margin: 2px 4px 2px 0 !important;
            max-width: calc(100% - 24px) !important;
            height: 24px !important;
            line-height: 22px !important;
            display: inline-flex !important;
            align-items: center !important;
          }
          
          .ant-select-selection-search {
            margin: 2px 0 !important;
            min-width: 100px !important;
          }
          
          .ant-select-selection-search-input {
            height: 24px !important;
            line-height: 22px !important;
          }
          
          .ant-select-selection-placeholder {
            line-height: 24px !important;
            height: 24px !important;
            display: flex !important;
            align-items: center !important;
          }
          
          /* 改善列设置面板中移动按钮的样式 */
          .ant-pro-table-column-setting .ant-tree-treenode {
            position: relative;
            padding: 2px 0;
          }
          
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 36px;
            padding: 6px 4px 6px 8px;
            border-radius: 4px;
            transition: background-color 0.15s ease-in-out;
            /* 确保字段名和按钮区域有足够间距 */
            gap: 12px;
          }
          
          /* 拖拽手柄区域 - 独立交互区域 */
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper .anticon[aria-label="holder"] {
            opacity: 0.5;
            margin-right: 8px;
            padding: 4px;
            border-radius: 4px;
            cursor: grab;
            z-index: 40 !important;
            position: relative;
            pointer-events: auto !important;
            transition: all 0.15s ease-in-out;
            /* 为拖拽手柄创建独立的交互边界 */
            min-width: 20px;
            min-height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper .anticon[aria-label="holder"]:hover {
            opacity: 1;
            background-color: #f0f0f0;
            cursor: grabbing;
          }
          
          /* 复选框区域 - 独立交互区域 */
          .ant-pro-table-column-setting .ant-tree-checkbox {
            margin-right: 8px;
            z-index: 35 !important;
            pointer-events: auto !important;
          }
          
          /* 字段名区域 - 精确限制点击区域 */
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper > span:first-child {
            flex: 1;
            display: flex;
            align-items: center;
            min-width: 0;
            /* 为字段名区域添加右侧间距 */
            padding-right: 8px;
            /* 精确限制字段选择的点击区域 */
            max-width: calc(100% - 100px); /* 为拖拽手柄和按钮留出更多空间 */
            overflow: hidden;
          }
          
          /* 字段名文本区域 - 进一步限制 */
          .ant-pro-table-column-setting .ant-tree-title {
            max-width: calc(100% - 120px);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            pointer-events: auto;
            z-index: 5;
            position: relative;
          }
          
          /* 重写树节点的点击区域，精确排除所有交互元素 */
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper {
            position: relative;
          }
          
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper::before {
            content: '';
            position: absolute;
            left: 60px; /* 排除左侧拖拽手柄和复选框区域 */
            top: 0;
            right: 100px; /* 排除右侧按钮区域 */
            bottom: 0;
            z-index: 1;
            pointer-events: auto;
          }
          
          /* 按钮容器区域 - 完全独立的交互区域 */
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper > span:last-child {
            display: flex;
            align-items: center;
            gap: 4px;
            /* 确保按钮区域完全独立 */
            pointer-events: auto !important;
            z-index: 30 !important;
            position: relative;
            /* 为按钮区域创建独立的交互空间 */
            padding: 4px 6px;
            margin: -4px -2px;
            border-radius: 6px;
            background-color: transparent;
            transition: background-color 0.1s ease-in-out;
            /* 阻止事件冒泡到父元素 */
            isolation: isolate;
          }
          
          /* 按钮区域悬停效果 */
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper > span:last-child:hover {
            background-color: rgba(24, 144, 255, 0.08);
          }
          
          /* 移动按钮容器 - 始终显示所有按钮 */
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper .anticon[aria-label*="vertical-align"] {
            min-width: 22px;
            min-height: 22px;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 3px;
            border-radius: 4px;
            cursor: pointer;
            z-index: 50 !important;
            position: relative;
            /* 始终可见，但透明度较低 */
            opacity: 0.5;
            background-color: transparent;
            transition: all 0.15s ease-in-out;
            /* 确保按钮完全独立，不被任何元素遮挡 */
            pointer-events: auto !important;
            /* 为每个按钮添加独立的交互边界 */
            border: 1px solid transparent;
            /* 阻止事件冒泡 */
            isolation: isolate;
          }
          
          /* 🎯 最优解决方案：基于 Web 最佳实践的精确指针事件控制 */
          
          /* 1. 禁用整个树节点的默认指针事件 */
          .ant-pro-table-column-setting .ant-tree-treenode .ant-tree-node-content-wrapper {
            pointer-events: none;
          }
          
          /* 2. 为字段选择创建精确的点击区域（伪元素方案） */
          .ant-pro-table-column-setting .ant-tree-treenode .ant-tree-node-content-wrapper::before {
            pointer-events: auto;
            cursor: pointer;
          }
          
          /* 3. 启用所有交互元素的指针事件 */
          .ant-pro-table-column-setting .ant-tree-treenode .ant-tree-switcher,
          .ant-pro-table-column-setting .ant-tree-treenode .ant-tree-checkbox,
          .ant-pro-table-column-setting .ant-tree-treenode .anticon[aria-label="holder"] {
            pointer-events: auto !important;
          }
          
          /* 4. 确保按钮区域完全独立且可点击 */
          .ant-pro-table-column-setting .ant-tree-treenode .ant-tree-node-content-wrapper > span:last-child {
            pointer-events: auto !important;
            /* 创建独立的交互层 */
            isolation: isolate;
            z-index: 50;
          }
          
          /* 5. 按钮本身必须可点击 */
          .ant-pro-table-column-setting .ant-tree-treenode .ant-tree-node-content-wrapper > span:last-child * {
            pointer-events: auto !important;
          }
          
          /* 按钮悬停效果 - 立即响应 */
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper .anticon[aria-label*="vertical-align"]:hover {
            opacity: 1 !important;
            background-color: #1890ff !important;
            color: white !important;
            transform: scale(1.05);
            border-color: #1890ff !important;
            box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
            transition: all 0.15s ease-in-out;
          }
          
          /* 节点悬停时的样式 - 只影响字段名区域 */
          .ant-pro-table-column-setting .ant-tree-treenode:hover .ant-tree-node-content-wrapper > span:first-child {
            background-color: rgba(0, 0, 0, 0.02);
            border-radius: 4px;
          }
          
          /* 节点悬停时按钮区域保持独立 */
          .ant-pro-table-column-setting .ant-tree-treenode:hover .anticon[aria-label*="vertical-align"] {
            opacity: 0.7;
          }
          
          /* 选中节点的特殊样式 */
          .ant-pro-table-column-setting .ant-tree-treenode.ant-tree-treenode-selected .ant-tree-node-content-wrapper {
            background-color: #e6f7ff;
            border: 1px solid #91d5ff;
          }
          
          .ant-pro-table-column-setting .ant-tree-treenode.ant-tree-treenode-selected .anticon[aria-label*="vertical-align"] {
            opacity: 0.8;
            border-color: rgba(24, 144, 255, 0.2);
          }
          
          /* 按钮区域与字段名区域的分隔线 */
          .ant-pro-table-column-setting .ant-tree-node-content-wrapper > span:last-child::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 50%;
            transform: translateY(-50%);
            width: 1px;
            height: 16px;
            background-color: rgba(0, 0, 0, 0.06);
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
          }
          
          .ant-pro-table-column-setting .ant-tree-treenode:hover .ant-tree-node-content-wrapper > span:last-child::before {
            opacity: 1;
          }
          

        `}</style>

      
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
                    style={{ 
                      width: '100%',
                      minHeight: '32px'
                    }}
                    placeholder="例如：*工资*、保险*、*金额"
                    value={filterConfig.includePatterns}
                    onChange={(patterns) => setFilterConfig(prev => ({ ...prev, includePatterns: patterns }))}
                    maxTagCount="responsive"
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}项...`}
                    allowClear
                    showSearch
                    filterOption={false}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    tagRender={(props) => {
                      const { label, closable, onClose } = props;
                      return (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            margin: '2px',
                            backgroundColor: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={String(label)}
                        >
                          {label}
                          {closable && (
                            <span
                              style={{ marginLeft: '4px', cursor: 'pointer' }}
                              onClick={onClose}
                            >
                              ×
                            </span>
                          )}
                        </span>
                      );
                    }}
                  >
                    <Option value="*工资*">*工资*</Option>
                    <Option value="*保险*">*保险*</Option>
                    <Option value="*金额">*金额</Option>
                    <Option value="*合计">*合计</Option>
                    <Option value="基本*">基本*</Option>
                    <Option value="*津贴*">*津贴*</Option>
                    <Option value="*补贴*">*补贴*</Option>
                    <Option value="*奖金*">*奖金*</Option>
                  </Select>
                </div>
                <div>
                  <label>排除模式（支持通配符 * 和 ?）：</label>
                  <Select
                    mode="tags"
                    style={{ 
                      width: '100%',
                      minHeight: '32px'
                    }}
                    placeholder="例如：*id、*时间、*日期"
                    value={filterConfig.excludePatterns}
                    onChange={(patterns) => setFilterConfig(prev => ({ ...prev, excludePatterns: patterns }))}
                    maxTagCount="responsive"
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}项...`}
                    allowClear
                    showSearch
                    filterOption={false}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    tagRender={(props) => {
                      const { label, closable, onClose } = props;
                      return (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            margin: '2px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            fontSize: '12px',
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={String(label)}
                        >
                          {label}
                          {closable && (
                            <span
                              style={{ marginLeft: '4px', cursor: 'pointer' }}
                              onClick={onClose}
                            >
                              ×
                            </span>
                          )}
                        </span>
                      );
                    }}
                  >
                    <Option value="*id">*id</Option>
                    <Option value="*时间">*时间</Option>
                    <Option value="*日期">*日期</Option>
                    <Option value="*编号">*编号</Option>
                    <Option value="原始*">原始*</Option>
                    <Option value="*备注*">*备注*</Option>
                    <Option value="*说明*">*说明*</Option>
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
              <Space wrap size={4} align="center">
                <SearchOutlined />
                <span>智能搜索</span>
                {!isEmptyQuery && (
                  <Tag color="blue" style={{ margin: 0 }}>
                    {totalResults} 条结果
                    {performance.isOptimal && <span style={{ color: '#52c41a' }}> ⚡</span>}
                  </Tag>
                )}
                {isEmptyQuery && (
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '2px' }}>
                    💡 支持多关键词搜索，用空格分隔
                  </span>
                )}
              </Space>
            </Col>
            <Col flex="none">
              <Button 
                type="text" 
                size="small"
                onClick={() => setSearchCardCollapsed(!searchCardCollapsed)}
                icon={searchCardCollapsed ? <DownOutlined /> : <UpOutlined />}
                style={{ 
                  padding: '2px 6px',
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
        styles={{ 
          header: {
            padding: '6px 12px',
            minHeight: 'auto',
            borderBottom: searchCardCollapsed ? '0px' : '1px solid #f0f0f0'
          },
          body: {
            padding: searchCardCollapsed ? 0 : '6px 8px',
            backgroundColor: '#fafafa'
          }
        }}
      >
        {!searchCardCollapsed && (
          /* 简单搜索 */
          <Row style={{ margin: 0 }}>
            <Col span={24} style={{ padding: 0 }}>
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
          </Row>
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
        params={{
          // 🎯 关键修复：将表头筛选状态作为params传递给ProTable
          // 当这些参数变化时，ProTable会自动重新渲染并应用筛选/排序
          // 注意：不再使用 JSON.stringify，直接传递状态变化的时间戳来触发重新渲染
          filtersHash: Object.keys(tableFilterState.filters || {}).length,
          sorterField: typeof tableFilterState.sorter === 'object' && tableFilterState.sorter ? (tableFilterState.sorter.field || '') : '',
          sorterOrder: typeof tableFilterState.sorter === 'object' && tableFilterState.sorter ? (tableFilterState.sorter.order || '') : '',
          timestamp: Date.now() // 强制刷新标识
        }}
        toolbar={{
          actions: [
            <Button
              key="export"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              disabled={filteredDataSource.length === 0}
            >
              {t('common:button.export_excel')} ({filteredDataSource.length})
            </Button>,
            <Button 
              key="presets" 
              icon={<BookOutlined />} 
              onClick={() => setPresetManagerVisible(true)}
            >
              预设报表管理
            </Button>,
            <Button 
              key="filter" 
              icon={<FilterOutlined />} 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              title="列筛选配置"
            >
              列筛选配置
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
          
          // 🎯 保存表头筛选状态
          setTableFilterState(prev => ({
            ...prev,
            filters: filters || {},
            sorter: sorter || {},
            pagination: {
              current: pagination?.current || 1,
              pageSize: pagination?.pageSize || 10,
              total: pagination?.total || 0
            }
          }));
          
          console.log('💾 [PayrollDataModal] 已保存表头筛选状态:', {
            filters,
            sorter,
            pagination
          });
        }}
        columnsState={{
          persistenceKey: 'payroll-data-table',
          persistenceType: 'localStorage',
          value: currentColumnsState, // 🎯 关键修复：将状态传递给ProTable
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
            draggable: true, // 启用列拖拽功能
            checkable: true, // 启用列显示/隐藏功能
            listsHeight: 500, // 增加列表高度，提供更多显示空间
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

      {/* 🎯 预设报表管理Modal */}
      <PresetManager
        visible={presetManagerVisible}
        onClose={() => setPresetManagerVisible(false)}
        currentFilterConfig={filterConfig}
        currentColumnSettings={currentColumnsState}
        getCurrentConfig={getCurrentConfig}
        onApplyPreset={handleApplyPreset}
      />
    </Modal>
  );
}; 