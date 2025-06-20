import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Modal, message } from 'antd';
import { ProTable, type ActionType } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';

// API 和类型导入
import { payrollViewsApi, type ComprehensivePayrollDataView } from '../../Payroll/services/payrollViewsApi';
import PayrollEntryDetailModal from '../../Payroll/components/PayrollEntryDetailModal';
import PayrollEntryFormModal from '../../Payroll/components/PayrollEntryFormModal';
import { getPayrollEntryById } from '../../Payroll/services/payrollApi';
import type { PayrollEntry } from '../../Payroll/types/payrollTypes';

// React Query 相关导入
import { 
  usePayrollDataQuery, 
  useRefreshPayrollData,
  payrollDataQueryKeys,
  type PayrollDataFilters 
} from '../../../hooks/usePayrollDataQuery';
import { useQueryClient } from '@tanstack/react-query';

// 搜索功能导入
import { usePayrollSearch } from '../../../hooks/usePayrollSearch';
import { SearchMode } from '../../../utils/searchUtils';

// 预设报表管理功能导入
import { PresetManager } from '../../../components/PayrollDataModal/PresetManager';
import { usePayrollDataPresets } from '../../../hooks/usePayrollDataPresets';

// 新建的拆分组件导入
import { usePayrollDataProcessing } from '../../../hooks/usePayrollDataProcessing';
import { SearchPanel } from '../../../components/PayrollDataModal/SearchPanel';
import { generateColumns } from '../../../components/PayrollDataModal/ColumnConfig';
import { exportToExcel } from '../../../services/payrollExportService';
import { 
  TableRowActions, 
  ToolbarActions, 
  BatchActionsAlert, 
  BatchActionsOptions,
  ModalFooterActions
} from '../../../components/PayrollDataModal/ActionButtons';

// 导入CSS样式
import './payrollDataModalStyles.css';

// 工资数据类型定义
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number;
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
  const queryClient = useQueryClient();
  
  // 🧹 清除可能被污染的缓存
  React.useEffect(() => {
    if (visible && periodId > 0) {
      console.log('🧹 [缓存清理] 清除可能被React元素污染的缓存');
      // 清除当前查询的缓存
      queryClient.removeQueries({
        queryKey: payrollDataQueryKeys.list({
          periodId: periodId.toString(),
          size: 100,
          page: 1,
        }),
      });
    }
  }, [visible, periodId, queryClient]);
  
  // 🚀 React Query 集成
  const queryFilters = useMemo<PayrollDataFilters>(() => {
    const validPeriodId = periodId && periodId > 0 ? periodId.toString() : undefined;
    return {
      periodId: validPeriodId,
      size: 100,
      page: 1,
    };
  }, [periodId]);
  
  const queryOptions = useMemo(() => ({
    enabled: visible && periodId > 0,
    staleTime: 30000,
    gcTime: 300000,
  }), [visible, periodId]);

  const {
    data: queryResult,
    isLoading,
    error,
    refetch
  } = usePayrollDataQuery(queryFilters, queryOptions);

  const dataSource = useMemo(() => {
    if (!queryResult?.data) return [];
    
    const TRACE_FIELD = '职位等级';
    console.log('🔍 [API数据源] 接收到的数据条数:', queryResult.data.length);
    
    // 🔍 追踪目标字段在数据源阶段的状态
    if (queryResult.data[0] && queryResult.data[0][TRACE_FIELD] !== undefined) {
      console.log(`🔍 [Modal数据源接收] ${TRACE_FIELD}:`, queryResult.data[0][TRACE_FIELD], `(类型: ${typeof queryResult.data[0][TRACE_FIELD]})`);
    }
    
    const result = queryResult.data.map((item, index) => ({
      ...item,
      id: item.id || index,
    }));
    
    // 🔍 追踪目标字段在映射后的状态
    if (result[0] && result[0][TRACE_FIELD] !== undefined) {
      console.log(`🔍 [Modal数据源映射后] ${TRACE_FIELD}:`, result[0][TRACE_FIELD], `(类型: ${typeof result[0][TRACE_FIELD]})`);
    }
    
    console.log('📊 [数据源处理] 最终数据条数:', result.length);
    return result;
  }, [queryResult]);

  // 🎯 数据源验证 - 最后一道防线
  const validatedDataSource = useMemo(() => {
    const TRACE_FIELD = '职位等级';
    console.log('🔍 [数据验证] 开始验证数据源...');
    let reactElementCount = 0;
    
    // 🔍 追踪目标字段在验证前的状态
    if (dataSource[0] && dataSource[0][TRACE_FIELD] !== undefined) {
      console.log(`🔍 [Modal验证前] ${TRACE_FIELD}:`, dataSource[0][TRACE_FIELD], `(类型: ${typeof dataSource[0][TRACE_FIELD]})`);
    }
    
    const validated = dataSource.map((item, index) => {
      const validatedItem: any = { ...item };
      
      // 检查每个字段
      Object.keys(validatedItem).forEach(key => {
        const value = validatedItem[key];
        if (typeof value === 'object' && value !== null) {
          const isReactElement = (value as any).$$typeof || (value as any).$typeof || ((value as any).type && (value as any).props);
          if (isReactElement) {
            reactElementCount++;
            console.error(`❌ [数据验证] 第${index}条记录的字段"${key}"中发现React元素:`, value);
            validatedItem[key] = '[数据错误:React元素]';
            
            // 🔍 特别关注目标字段
            if (key === TRACE_FIELD) {
              console.error(`🚨 [CRITICAL TRACE] ${TRACE_FIELD} 字段被React元素污染!`, value);
            }
          }
        }
      });
      
      return validatedItem;
    });
    
    // 🔍 追踪目标字段在验证后的状态
    if (validated[0] && validated[0][TRACE_FIELD] !== undefined) {
      console.log(`🔍 [Modal验证后] ${TRACE_FIELD}:`, validated[0][TRACE_FIELD], `(类型: ${typeof validated[0][TRACE_FIELD]})`);
    }
    
    if (reactElementCount > 0) {
      console.error(`❌ [数据验证] 总共发现 ${reactElementCount} 个React元素在数据中!`);
    } else {
      console.log('✅ [数据验证] 数据源验证通过，无React元素');
    }
    
    // ========================[ 核心修改点 ]========================
    // 在将数据传递给表格前，深度冻结每一条记录
    console.log('🧊 [数据冻结] 准备冻结数据...');
    
    /**
     * 深度冻结一个对象，使其所有嵌套属性都变为只读。
     * @param obj 需要深度冻结的对象
     * @returns 被深度冻结的对象
     */
    function deepFreeze<T extends object>(obj: T): T {
      // 如果对象已经是冻结的，或者不是一个对象，则直接返回
      if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
        return obj;
      }

      // 递归冻结所有自身的属性
      Object.getOwnPropertyNames(obj).forEach(prop => {
        const value = (obj as any)[prop];
        // 如果属性值是对象，则递归调用 deepFreeze
        if (value && typeof value === 'object') {
          deepFreeze(value);
        }
      });

      // 最后，冻结对象自身
      return Object.freeze(obj);
    }
    
    const frozenData = validated.map(record => {
      try {
        // 深度冻结对象及其所有属性
        return deepFreeze({...record});
      } catch (error) {
        console.error('❌ [数据冻结] 冻结记录失败:', error);
        return record; // 如果冻结失败，返回原始记录
      }
    });
    
    // 验证冻结是否生效
    if (frozenData.length > 0) {
      console.log('🔍 [验证冻结] 第一条记录是否已冻结?', Object.isFrozen(frozenData[0]));
      
      // 检查一些常见的嵌套对象字段
      const nestedFields = ['其他个人扣缴', '其他单位扣缴', '其他应发项目', '其他计算参数'];
      nestedFields.forEach(field => {
        const value = (frozenData[0] as any)[field];
        if (value && typeof value === 'object') {
          console.log(`🔍 [验证冻结] 嵌套对象字段 "${field}" 是否已冻结?`, Object.isFrozen(value));
        }
      });
      
      // 特别检查职位等级字段
      const targetField = '职位等级';
      const targetValue = (frozenData[0] as any)[targetField];
      if (targetValue && typeof targetValue === 'object') {
        console.log(`🔍 [验证冻结] 目标字段 "${targetField}" 是否已冻结?`, Object.isFrozen(targetValue));
      }
    }
    
    console.log('✅ [数据冻结] 数据已全部深度冻结!');
    // =============================================================
    
    return frozenData;
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
  } = usePayrollSearch(validatedDataSource, {
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

  const {
    filteredDataSource,
    filterConfig,
    generateColumns: generateDynamicColumns,
    exportToExcel: exportData
  } = usePayrollDataProcessing({
    data: validatedDataSource,
    periodName,
    searchResults: isEmptyQuery ? undefined : new Set(searchResults.map((_, index) => index)),
    searchMode
  });

  // 🏷️ 预设管理集成
  const {
    presets,
    savePreset,
    deletePreset,
    applyPreset,
  } = usePayrollDataPresets();

  // 📊 状态管理
  const [presetManagerVisible, setPresetManagerVisible] = useState(false);
  
  // 详情和编辑模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [payrollRunId, setPayrollRunId] = useState<number | null>(null);

  // 加载状态
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔄 生成动态列配置
  const dynamicColumns = useMemo(() => {
    const columns = generateColumns(dataSource, filterConfig);
    
    // 添加操作列
    return [
      ...columns,
      {
        title: t('common:table.action'),
        key: 'action',
        fixed: 'right' as const,
        width: 120,
        render: (_: any, record: PayrollData) => (
          <TableRowActions
            record={record}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ),
      }
    ];
  }, [dataSource, filterConfig, t]);

  // 📋 事件处理函数
  const handleViewDetail = async (record: PayrollData) => {
    console.log('📋 [PayrollDataModal] 查看详情:', record);
    
    if (record.薪资条目id) {
      setSelectedEntryId(String(record.薪资条目id));
      setDetailModalVisible(true);
    } else {
      message.warning(t('payroll:entry_form.message.update_success_no_data'));
    }
  };

  const handleEdit = async (record: PayrollData) => {
    console.log('✏️ [PayrollDataModal] 编辑记录:', record);
    
    if (!record.薪资条目id) {
      message.warning(t('payroll:runs_page.form.placeholder.payroll_period'));
      return;
    }

    try {
      const response = await getPayrollEntryById(record.薪资条目id);
      
      if (response.data) {
        const payrollEntry = response.data;
        setSelectedEntry(payrollEntry);
        setPayrollRunId(payrollEntry.payroll_run_id);
        setEditModalVisible(true);
      } else {
        message.error(t('payroll:entry_detail_modal.not_found'));
      }
    } catch (error: any) {
      console.error('❌ [PayrollDataModal] 获取薪资条目数据失败:', error);
      message.error(`${t('payroll:entry_form.error_fetch_employee')}: ${error.message || t('common:unknown_error')}`);
    }
  };

  const handleDelete = (record: PayrollData) => {
    console.log('🗑️ [删除操作] 删除记录:', record);
    message.warning('删除功能开发中...');
  };

  const handleEditSuccess = () => {
    console.log('🔄 [PayrollDataModal] Edit success callback triggered');
    setEditModalVisible(false);
    setSelectedEntry(null);
    setPayrollRunId(null);
    refetch();
    message.success(t('payroll:entry_form.message.update_success'));
  };

  const handleExportExcel = async () => {
    if (filteredDataSource.length === 0) {
      message.warning(t('payroll:batch_import.result.no_result'));
      return;
    }

    setIsExporting(true);
    try {
      await exportToExcel(filteredDataSource, dynamicColumns, periodName, {});
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => {
      setIsRefreshing(false);
      message.success(t('common:table.refreshSuccess'));
    });
  };

  const handleApplyPreset = (preset: any) => {
    if (preset.searchQuery) {
      search(preset.searchQuery);
    }
    setSearchMode(preset.searchMode || SearchMode.AUTO);
    message.success(`已应用预设: ${preset.name}`);
  };

  const handleSavePreset = (name: string, description?: string) => {
    // 创建默认的筛选配置
    const defaultFilterConfig = {
      hideJsonbColumns: true,
      hideZeroColumns: true,
      hideEmptyColumns: true,
      includePatterns: [],
      excludePatterns: ['*id', '*时间', '*日期'],
      minValueThreshold: 0,
      maxValueThreshold: Infinity,
      showOnlyNumericColumns: false
    };
    
    savePreset(
      name,
      defaultFilterConfig,
      {}, // columnSettings
      {
        description,
        category: periodName
      }
    );
    message.success(`预设 "${name}" 保存成功`);
  };

  // 🎨 渲染
  return (
    <Modal
      title={`工资数据详情 - ${periodName || '未知期间'}`}
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ top: 20 }}
      footer={<ModalFooterActions onClose={onClose} />}
      destroyOnClose
    >
      {/* 🔍 搜索面板 */}
      <SearchPanel
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        searchMode={searchMode}
        suggestions={suggestions}
        totalResults={totalResults}
        searchTime={searchTime}
        isEmptyQuery={isEmptyQuery}
        hasResults={hasResults}
        performance={performance}
        onSearch={search}
        onClear={clearSearch}
        onSearchModeChange={setSearchMode}
        placeholder="搜索员工姓名、编号、部门、职位..."
        showPerformance={true}
      />

      {/* 📊 数据表格 */}
      <ProTable<PayrollData>
        actionRef={actionRef}
        columns={dynamicColumns}
        dataSource={filteredDataSource}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 'max-content', y: 600 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 20,
        }}
        toolbar={{
          actions: ToolbarActions({
            dataCount: filteredDataSource.length,
            onExport: handleExportExcel,
            onOpenPresets: () => setPresetManagerVisible(true),
            onRefresh: handleRefresh,
            isExporting,
            isRefreshing
          })
        }}
        rowSelection={{
          type: 'checkbox',
        }}
        tableAlertRender={({ selectedRowKeys, selectedRows }) => (
          <BatchActionsAlert
            selectedRowKeys={selectedRowKeys}
            selectedRows={selectedRows}
          />
        )}
        tableAlertOptionRender={({ selectedRowKeys, selectedRows, onCleanSelected }) => (
          <BatchActionsOptions
            selectedRowKeys={selectedRowKeys}
            selectedRows={selectedRows}
            onCleanSelected={onCleanSelected}
          />
        )}
        options={{
          reload: handleRefresh,
          density: true,
          fullScreen: true,
          setting: {
            draggable: true,
            checkable: true,
            listsHeight: 500,
          },
        }}
      />

      {/* 🏷️ 预设管理模态框 */}
      <PresetManager
        visible={presetManagerVisible}
        onClose={() => setPresetManagerVisible(false)}
        currentFilterConfig={{
          hideJsonbColumns: true,
          hideZeroColumns: true,
          hideEmptyColumns: true,
          includePatterns: [],
          excludePatterns: ['*id', '*时间', '*日期'],
          minValueThreshold: 0,
          maxValueThreshold: Infinity,
          showOnlyNumericColumns: false
        }}
        currentColumnSettings={{}}
        onApplyPreset={handleApplyPreset}
      />

      {/* 📋 详情模态框 */}
      <PayrollEntryDetailModal
        visible={detailModalVisible}
        entryId={selectedEntryId}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedEntryId('');
        }}
      />

      {/* ✏️ 编辑模态框 */}
      <PayrollEntryFormModal
        visible={editModalVisible}
        entry={selectedEntry}
        payrollPeriodId={periodId}
        payrollRunId={payrollRunId}
        onSuccess={handleEditSuccess}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedEntry(null);
          setPayrollRunId(null);
        }}
      />
    </Modal>
  );
};