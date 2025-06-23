import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Modal, message, Button } from 'antd';
// import { useRenderMonitor } from '../../../hooks/useRenderCount'; // 临时禁用
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import { SearchMode } from '../../../utils/searchUtils';
import styles from './UniversalDataModal.module.css';

// Import universal components that will be extracted from PayrollDataModal
import { SmartSearchPanel } from './SmartSearchPanel';
import { AdvancedColumnManager } from './AdvancedColumnManager';
import { ConfigPresetManager } from './ConfigPresetManager';

// Import universal hooks
import { useUniversalDataProcessing } from '../hooks/useUniversalDataProcessing';
import { useUniversalSearch } from '../hooks/useUniversalSearch';
import { useUniversalPresets } from '../hooks/useUniversalPresets';

// Import universal services
import { UniversalExportService } from '../services/UniversalExportService';

// Types
export interface SearchConfig<T = Record<string, unknown>> {
  searchableFields: SearchableField<T>[];
  supportExpressions?: boolean;
  searchModes?: SearchMode[];
  placeholder?: string;
  debounceMs?: number;
}

export interface SearchableField<T> {
  key: keyof T;
  label: string;
  type: 'text' | 'select' | 'number' | 'date';
  options?: Array<{ label: string; value: unknown }>;
}

export interface FilterConfig {
  hideEmptyColumns?: boolean;
  hideZeroColumns?: boolean;
  categorySort?: string[];
  presets?: FilterPreset[];
}

export interface FilterPreset {
  name: string;
  filters: Record<string, unknown>;
  description?: string;
}

export interface PresetConfig {
  enabled: boolean;
  categories?: string[];
}

export interface ActionConfig<T = Record<string, unknown>> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  permission?: string;
}

export interface UniversalDataModalProps<T = Record<string, unknown>> {
  // Basic props
  title: string;
  visible: boolean;
  onClose: () => void;
  
  // Data props
  dataSource: T[];
  loading?: boolean;
  columns?: ProColumns<T>[];
  autoGenerateColumns?: boolean;
  
  // Search configuration
  searchable?: boolean;
  searchConfig?: SearchConfig<T>;
  
  // Filter configuration
  filterable?: boolean;
  filterConfig?: FilterConfig;
  
  // Preset configuration
  presetEnabled?: boolean;
  presetConfig?: PresetConfig;
  
  // Action configuration
  actions?: ActionConfig<T>[];
  onRowSelect?: (selectedRows: T[]) => void;
  onExport?: (data: T[]) => void;
  
  // Table configuration
  rowKey?: string | ((record: T) => string);
  selectable?: boolean;
  exportable?: boolean;
  
  // Style configuration
  width?: string | number;
  height?: number;
  
  // Advanced configuration
  queryKey?: string;
  queryFn?: () => Promise<T[]>;
  onRowDoubleClick?: (record: T) => void;
}

export const UniversalDataModal = <T extends Record<string, unknown> = Record<string, unknown>>({
  title,
  visible,
  onClose,
  dataSource = [],
  loading = false,
  columns,
  autoGenerateColumns = true,
  searchable = true,
  searchConfig,
  filterable = true,
  filterConfig,
  presetEnabled = true,
  presetConfig,
  actions = [],
  onRowSelect,
  rowKey = 'id',
  selectable = true,
  exportable = true,
  width = '90%',
  height = 600,
  queryKey,
  onRowDoubleClick,
}: UniversalDataModalProps<T>) => {
  const { t } = useTranslation(['common']);
  const actionRef = useRef<ActionType>(null);
  
  // 渲染监控 - 临时禁用避免自身循环（调试用）
  // TODO: 重新启用渲染监控，一旦修复了所有无限循环问题
  // const { renderCount, isExcessive } = useRenderMonitor({
  //   componentName: 'UniversalDataModal',
  //   warningThreshold: 5,
  //   enableLogging: true,
  //   enableProfiling: true
  // });

  // State management
  const [columnManagerVisible, setColumnManagerVisible] = useState(false);
  const [presetManagerVisible, setPresetManagerVisible] = useState(false);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Data validation and cleaning - 仅在开发环境执行，避免生产性能问题
  const validatedDataSource = useMemo(() => {
    // 生产环境直接返回原始数据，避免性能开销
    if (process.env.NODE_ENV === 'production') {
      return dataSource;
    }

    // 开发环境进行数据验证
    console.log('🔍 [UniversalDataModal] Validating data source...');
    let reactElementCount = 0;
    
    const validated = dataSource.map((item, index) => {
      const validatedItem: Record<string, unknown> = { ...item };
      
      // Check each field for React elements
      Object.keys(validatedItem).forEach(key => {
        const value = validatedItem[key];
        if (typeof value === 'object' && value !== null) {
          const reactElement = value as Record<string, unknown>;
          const isReactElement = reactElement.$$typeof || reactElement.$typeof || 
                                 (reactElement.type && reactElement.props);
          if (isReactElement) {
            reactElementCount++;
            console.error(`❌ [Data Validation] React element found in record ${index}, field "${key}":`, value);
            validatedItem[key] = '[Data Error: React Element]';
          }
        }
      });
      
      return validatedItem;
    });
    
    if (reactElementCount > 0) {
      console.error(`❌ [Data Validation] Found ${reactElementCount} React elements in data!`);
    } else {
      console.log('✅ [Data Validation] Data source validation passed, no React elements found');
    }
    
    return validated;
  }, [dataSource]);

  // Search functionality - 确保对象引用稳定  
  const searchConfiguration = useMemo(() => ({
    searchableFields: searchConfig?.searchableFields ? 
      searchConfig.searchableFields.map(field => field.key as string) : [],
    threshold: 0.3,
    debounceDelay: searchConfig?.debounceMs || 300,
    enableSuggestions: true,
    maxSuggestions: 5,
    supportExpressions: searchConfig?.supportExpressions || false,
  }), [
    searchConfig?.searchableFields, 
    searchConfig?.debounceMs, 
    searchConfig?.supportExpressions
  ]);

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
  } = useUniversalSearch(validatedDataSource, searchConfiguration);

  // 修复无限循环：使用useMemo而不是useEffect + useState来避免状态更新循环
  const processedSearchIndices = useMemo(() => {
    // 如果没有搜索结果或正在搜索中，返回undefined
    if (!searchResults || searchResults.length === 0 || isSearching) {
      return undefined;
    }
    
    const indices = searchResults
      .map((r) => validatedDataSource.findIndex(item => item === r.item))
      .filter(i => i !== -1);
    
    return indices.length > 0 ? new Set(indices) : undefined;
  }, [searchResults, validatedDataSource, isSearching]);

  // Data processing - 使用useRef保存稳定的配置引用
  const dataProcessingConfigRef = useRef({
    data: validatedDataSource,
    searchResults: processedSearchIndices,
    searchMode,
    filterConfig,
    autoGenerateColumns
  });

  // 只有在实际值变化时才更新配置
  const dataProcessingConfig = useMemo(() => {
    const newConfig = {
      data: validatedDataSource,
      searchResults: processedSearchIndices,
      searchMode,
      filterConfig,
      autoGenerateColumns
    };

    // 检查是否有实际变化
    const hasChanged = (
      dataProcessingConfigRef.current.data !== newConfig.data ||
      dataProcessingConfigRef.current.searchResults !== newConfig.searchResults ||
      dataProcessingConfigRef.current.searchMode !== newConfig.searchMode ||
      dataProcessingConfigRef.current.filterConfig !== newConfig.filterConfig ||
      dataProcessingConfigRef.current.autoGenerateColumns !== newConfig.autoGenerateColumns
    );

    if (hasChanged) {
      dataProcessingConfigRef.current = newConfig;
    }

    return dataProcessingConfigRef.current;
  }, [validatedDataSource, processedSearchIndices, searchMode, filterConfig, autoGenerateColumns]);

  const {
    filteredDataSource,
    filterConfiguration,
    generateColumns: generateDynamicColumns,
    setFilterConfiguration
  } = useUniversalDataProcessing(dataProcessingConfig);

  // Preset management
  const {
    presets,
    savePreset,
    deletePreset,
  } = useUniversalPresets(queryKey || 'universal');

  // Column generation - 使用useRef缓存，减少不必要的重新生成
  const columnsRef = useRef<ProColumns<T>[]>([]);
  const lastConfigRef = useRef<{
    columns?: ProColumns<T>[];
    hasData: boolean;
    actionsLength: number;
    autoGen: boolean;
    filterConfig?: any;
  }>({
    columns: undefined,
    hasData: false,
    actionsLength: 0,
    autoGen: false,
    filterConfig: undefined,
  });

  const dynamicColumns = useMemo(() => {
    const hasData = filteredDataSource && filteredDataSource.length > 0;
    const currentConfig = {
      columns,
      hasData,
      actionsLength: actions.length,
      autoGen: autoGenerateColumns,
      filterConfig: filterConfiguration,
    };

    // 检查是否需要重新生成列
    const needsRegeneration = (
      lastConfigRef.current.columns !== currentConfig.columns ||
      lastConfigRef.current.hasData !== currentConfig.hasData ||
      lastConfigRef.current.actionsLength !== currentConfig.actionsLength ||
      lastConfigRef.current.autoGen !== currentConfig.autoGen ||
      lastConfigRef.current.filterConfig !== currentConfig.filterConfig
    );

    if (!needsRegeneration && columnsRef.current.length > 0) {
      return columnsRef.current;
    }

    if (!hasData) {
      const result = columns || [];
      columnsRef.current = result;
      lastConfigRef.current = currentConfig;
      return result;
    }
    
    // Use provided columns or generate dynamically
    const baseColumns = columns && columns.length > 0 ? 
      columns : 
      (autoGenerateColumns ? generateDynamicColumns(filteredDataSource, filterConfiguration) : []);
    
    // Add action column if actions are provided
    const finalColumns = [...baseColumns];
    
    if (actions.length > 0) {
      finalColumns.push({
        title: t('table.action'),
        key: 'action',
        fixed: 'right' as const,
        width: Math.min(120 + actions.length * 30, 200),
        render: (_: unknown, record: T) => (
          <div style={{ display: 'flex', gap: 4 }}>
            {actions.map(action => (
              <button
                key={action.key}
                onClick={() => action.onClick(record)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 4,
                }}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        ),
      });
    }
    
    columnsRef.current = finalColumns;
    lastConfigRef.current = currentConfig;
    return finalColumns;
  }, [columns, filteredDataSource, filterConfiguration, generateDynamicColumns, actions, autoGenerateColumns, t]);

  // Export functionality
  const handleExport = useCallback(async () => {
    if (!exportable || filteredDataSource.length === 0) {
      message.warning(t('table.no_data_to_export'));
      return;
    }

    setIsExporting(true);
    try {
      const exportService = new UniversalExportService();
      await exportService.exportToExcel(
        filteredDataSource,
        dynamicColumns,
        title,
        {
          timestamp: true,
          creator: 'Universal Data Modal'
        }
      );
    } catch (error) {
      console.error('Export failed:', error);
      message.error(t('table.export_failed'));
    } finally {
      setIsExporting(false);
    }
  }, [exportable, filteredDataSource, dynamicColumns, title, t]);

  // Batch export
  const handleBatchExport = useCallback(async (rows: T[]) => {
    if (rows.length === 0) {
      message.warning(t('table.select_rows_first'));
      return;
    }

    setIsExporting(true);
    try {
      const exportService = new UniversalExportService();
      await exportService.exportToExcel(
        rows,
        dynamicColumns,
        `${title} - ${t('table.selected_rows')}`,
        {
          timestamp: true,
          creator: 'Universal Data Modal'
        }
      );
    } catch (error) {
      console.error('Batch export failed:', error);
      message.error(t('table.export_failed'));
    } finally {
      setIsExporting(false);
    }
  }, [dynamicColumns, title, t]);

  // Preset handlers
  const handleApplyPreset = useCallback((preset: { name: string; filterConfig?: any; searchQuery?: string; searchMode?: SearchMode }) => {
    console.log('🏷️ [Preset] Applying preset:', preset.name);
    
    if (preset.filterConfig) {
      setFilterConfiguration(preset.filterConfig);
    }
    
    if (preset.searchQuery) {
      search(preset.searchQuery);
    }
    
    if (preset.searchMode) {
      setSearchMode(preset.searchMode);
    }
    
    message.success(`${t('preset.applied')}: ${preset.name}`);
  }, [setFilterConfiguration, search, setSearchMode, t]);

  const handleSavePreset = useCallback((name: string, description?: string) => {
    const presetData = {
      filterConfig: filterConfiguration,
      searchQuery: searchQuery || undefined,
      searchMode: searchMode || SearchMode.AUTO,
      tableState: {
        pagination: { current: 1, pageSize: 20 }
      }
    };
    
    savePreset(name, presetData, {
      description,
      category: title
    });
    
    message.success(`${t('preset.saved')}: ${name}`);
  }, [filterConfiguration, searchQuery, searchMode, savePreset, title, t]);

  // Row selection
  const rowSelection = useMemo(() => {
    if (!selectable) return undefined;
    
    return {
      type: 'checkbox' as const,
      selectedRowKeys: selectedRows.map((row: T) => 
        typeof rowKey === 'function' ? rowKey(row) : (row as Record<string, unknown>)[rowKey] as React.Key
      ),
      onChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => {
        setSelectedRows(selectedRows);
        onRowSelect?.(selectedRows);
      },
    };
  }, [selectable, selectedRows, rowKey, onRowSelect]);

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={typeof width === 'string' ? width : Math.min(width || 1200, window.innerWidth * 0.95)}
      style={{ 
        top: 20,
        maxWidth: '95vw',
        margin: '0 auto'
      }}
      footer={null}
      destroyOnClose
      className={`universal-data-modal ${styles.universalDataModal || ''}`}
      styles={{
        body: { 
          padding: '16px 24px 24px 24px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }
      }}
    >
      <div>
        {/* Search Panel */}
        {searchable && (
          <div className={styles.searchPanelContainer || ''} style={{ marginBottom: '16px' }}>
            <SmartSearchPanel
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
              placeholder={searchConfig?.placeholder || t('table.search_placeholder')}
              showPerformance={true}
              searchModes={searchConfig?.searchModes}
            />
          </div>
        )}

        {/* Column Manager */}
        {filterable && (
          <AdvancedColumnManager
            visible={columnManagerVisible}
            onClose={() => setColumnManagerVisible(false)}
            filterConfig={filterConfiguration}
            onFilterConfigChange={setFilterConfiguration}
            dataSource={validatedDataSource}
            columns={dynamicColumns}
          />
        )}

        {/* Data Table */}
        <div className={styles.tableContainer || ''} style={{ marginTop: searchable ? '0' : '16px' }}>
          <ProTable<T>
        actionRef={actionRef}
        columns={dynamicColumns}
        dataSource={filteredDataSource}
        rowKey={rowKey}
        loading={loading}
        size="small"
        scroll={{ 
          x: 'max-content', 
          y: Math.min(height || 400, window.innerHeight * 0.5) 
        }}
        search={false}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} ${t('table.of')} ${total} ${t('table.items')}`,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 20,
        }}
        toolbar={{
          style: { 
            padding: '12px 0',
            marginBottom: '8px',
            borderBottom: '1px solid #f0f0f0'
          },
          actions: [
            ...(exportable ? [
              <Button 
                key="export" 
                onClick={handleExport} 
                loading={isExporting}
                style={{ marginRight: '8px' }}
              >
                {t('table.export')}
              </Button>
            ] : []),
            ...(filterable ? [
              <Button 
                key="filter" 
                onClick={() => setColumnManagerVisible(true)}
                style={{ marginRight: '8px' }}
              >
                {t('table.filter')}
              </Button>
            ] : []),
            ...(presetEnabled ? [
              <Button 
                key="presets" 
                onClick={() => setPresetManagerVisible(true)}
                style={{ marginRight: '8px' }}
              >
                {t('table.presets')}
              </Button>
            ] : []),
          ]
        }}
        rowSelection={rowSelection}
        onRow={(record) => ({
          onDoubleClick: () => onRowDoubleClick?.(record),
        })}
        tableAlertRender={({ selectedRowKeys }) => (
          <span>
            {t('table.selected_count', { count: selectedRowKeys.length })}
          </span>
        )}
        tableAlertOptionRender={({ onCleanSelected }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            {exportable && (
              <button onClick={() => handleBatchExport(selectedRows)}>
                {t('table.export_selected')}
              </button>
            )}
            <button onClick={onCleanSelected}>
              {t('table.clear_selection')}
            </button>
          </div>
        )}
        options={{
          reload: () => {
            // Trigger refresh if needed
          },
          density: true,
          fullScreen: true,
          setting: {
            draggable: true,
            checkable: true,
            listsHeight: 500,
          },
        }}
          />
        </div>

        {/* Preset Manager */}
        {presetEnabled && (
          <ConfigPresetManager
            visible={presetManagerVisible}
            onClose={() => setPresetManagerVisible(false)}
            currentConfig={{
              filterConfig: filterConfiguration,
              searchQuery,
              searchMode
            }}
            presets={presets}
            onApplyPreset={handleApplyPreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={deletePreset}
            categories={presetConfig?.categories}
          />
        )}
      </div>
    </Modal>
  );
};

export default UniversalDataModal;