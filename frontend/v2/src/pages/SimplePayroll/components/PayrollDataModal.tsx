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
import { FilterConfigPanel } from '../../../components/PayrollDataModal/FilterConfigPanel';
// generateColumns 现在通过 usePayrollDataProcessing 提供
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
    
    console.log('📊 [API数据源] 接收到的数据条数:', queryResult.data.length);
    
    const result = queryResult.data.map((item, index) => ({
      ...item,
      id: item.id || index,
    }));
    
    console.log('📊 [数据源处理] 最终数据条数:', result.length);
    return result;
  }, [queryResult]);

  // 数据源验证 - 最后一道防线
  const validatedDataSource = useMemo(() => {
    console.log('🔍 [数据验证] 开始验证数据源...');
    let reactElementCount = 0;
    
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
          }
        }
      });
      
      return validatedItem;
    });
    
    if (reactElementCount > 0) {
      console.error(`❌ [数据验证] 总共发现 ${reactElementCount} 个React元素在数据中!`);
    } else {
      console.log('✅ [数据验证] 数据源验证通过，无React元素');
    }
    
    return validated;
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

  // 修复搜索结果索引映射
  const searchResultIndices = useMemo(() => {
    if (isEmptyQuery || !searchResults || searchResults.length === 0) {
      console.log('🔍 [搜索结果映射] 无搜索查询或结果为空');
      return undefined;
    }
    
    console.log('🔍 [搜索结果映射] 开始映射搜索结果', {
      searchResultsCount: searchResults.length,
      searchResultsSample: searchResults.slice(0, 2),
      dataSourceCount: validatedDataSource.length
    });
    
    const indices = searchResults.map(result => {
      // 修复：使用result.item而不是result
      const index = validatedDataSource.findIndex(item => item === result.item);
      console.log('🔍 [搜索结果映射] 映射结果', {
        resultItem: result.item,
        foundIndex: index,
        itemPreview: result.item ? {
          员工姓名: (result.item as any)['员工姓名'],
          员工编号: (result.item as any)['员工编号']
        } : null
      });
      return index;
    }).filter(index => index !== -1);
    
    console.log('✅ [搜索结果映射] 映射完成', {
      originalCount: searchResults.length,
      mappedCount: indices.length,
      indices: indices.slice(0, 5)
    });
    
    return new Set(indices);
  }, [searchResults, validatedDataSource, isEmptyQuery]);

  const {
    filteredDataSource,
    filterConfig,
    generateColumns: generateDynamicColumns,
    exportToExcel: exportData,
    setFilterConfig
  } = usePayrollDataProcessing({
    data: validatedDataSource,
    periodName,
    searchResults: searchResultIndices,
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
  const [filterConfigVisible, setFilterConfigVisible] = useState(false);
  
  // 详情和编辑模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [payrollRunId, setPayrollRunId] = useState<number | null>(null);

  // 加载状态
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 生成动态列配置
  const dynamicColumns = useMemo(() => {
    if (!filteredDataSource || filteredDataSource.length === 0) {
      console.log('⚠️ [PayrollDataModal] filteredDataSource为空，不生成列配置');
      return [];
    }
    
    console.log('🔄 [PayrollDataModal] 生成列配置', {
      dataCount: filteredDataSource.length,
      sampleKeys: filteredDataSource[0] ? Object.keys(filteredDataSource[0]).slice(0, 5) : []
    });
    
    const columns = generateDynamicColumns(filteredDataSource, filterConfig);
    
    console.log('✅ [PayrollDataModal] 列配置完成:', columns.length, '列');
    
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
  }, [generateDynamicColumns, filteredDataSource, filterConfig, t]);
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
    console.log('🏷️ [预设应用] 开始应用预设', {
      presetName: preset.name,
      hasFilterConfig: !!preset.filterConfig,
      hasSearchQuery: !!preset.searchQuery,
      hasTableFilterState: !!preset.tableFilterState,
      preset
    });
    
    // 应用筛选配置
    if (preset.filterConfig) {
      console.log('✅ [预设应用] 应用筛选配置', preset.filterConfig);
      setFilterConfig(preset.filterConfig);
    }
    
    // 应用搜索查询（从tableFilterState或直接从preset）
    const searchQuery = preset.tableFilterState?.searchQuery || preset.searchQuery;
    if (searchQuery) {
      console.log('✅ [预设应用] 应用搜索查询', searchQuery);
      search(searchQuery);
    }
    
    // 应用搜索模式
    const searchMode = preset.tableFilterState?.searchMode || preset.searchMode || SearchMode.AUTO;
    console.log('✅ [预设应用] 应用搜索模式', searchMode);
    setSearchMode(searchMode);
    
    message.success(`已应用预设: ${preset.name}`);
  };

  const handleSavePreset = (name: string, description?: string) => {
    console.log('💾 [预设保存] 开始保存预设', {
      name,
      description,
      currentFilterConfig: filterConfig,
      currentSearchQuery: searchQuery,
      currentSearchMode: searchMode
    });
    
    // 构建表格筛选状态
    const tableFilterState = {
      searchQuery: searchQuery || undefined,
      searchMode: searchMode || SearchMode.AUTO,
      pagination: {
        current: 1,
        pageSize: 20
      }
    };
    
    console.log('💾 [预设保存] 保存的配置', {
      filterConfig,
      tableFilterState,
      category: periodName
    });
    
    savePreset(
      name,
      filterConfig, // 使用当前的筛选配置
      {}, // columnSettings（暂时为空）
      {
        description,
        category: periodName,
        tableFilterState // 保存表格状态
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

      {/* 🔧 筛选配置面板 */}
      <FilterConfigPanel
        visible={filterConfigVisible}
        onClose={() => setFilterConfigVisible(false)}
        filterConfig={filterConfig}
        onFilterConfigChange={setFilterConfig}
        dataSource={validatedDataSource}
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
        search={false}
        onLoad={() => {
          console.log('📊 [ProTable] 表格加载完成，列数:', dynamicColumns.length, '数据:', filteredDataSource.length);
        }}
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
            onOpenFilter: () => setFilterConfigVisible(true),
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
        currentFilterConfig={filterConfig} // 使用当前的筛选配置
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