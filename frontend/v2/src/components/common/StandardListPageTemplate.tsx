import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, message, Modal, Space, Tooltip, Input, Card, App } from 'antd';
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import OrganizationManagementTableTemplate from './OrganizationManagementTableTemplate';
import type { SorterResult, TablePaginationConfig, FilterValue, TableCurrentDataSource } from 'antd/es/table/interface';
import type { ProColumns } from '@ant-design/pro-components';
import { stringSorter, numberSorter, dateSorter, useTableSearch, useTableExport } from './TableUtils';
import type { Dayjs } from 'dayjs';
import TableActionButton from './TableActionButton';

// 查询参数接口
export interface QueryParams {
  filters?: Record<string, any>;
  sorting?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  search?: string;
  page?: number;
  page_size?: number;
}

// 标准列表页面模板的属性接口
export interface StandardListPageTemplateProps<T extends Record<string, any>> {
  /** 翻译命名空间数组 */
  translationNamespaces: string[];
  /** 页面标题翻译键 */
  pageTitleKey: string;
  /** 新增按钮文本翻译键 */
  addButtonTextKey: string;
  /** 数据源状态 */
  dataSource: T[];
  /** 数据加载状态 */
  loadingData: boolean;
  /** 权限配置 */
  permissions: {
    canViewList: boolean;
    canViewDetail: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
  /** 查找映射数据 */
  lookupMaps: any;
  /** 查找数据加载状态 */
  loadingLookups: boolean;
  /** 查找数据错误 */
  errorLookups: any;
  /** 数据获取函数 */
  fetchData: (params?: QueryParams) => Promise<void>;
  /** 删除单个项目的函数 */
  deleteItem: (id: string) => Promise<void>;
  /** 新增按钮点击处理 */
  onAddClick: () => void;
  /** 编辑按钮点击处理 */
  onEditClick: (item: T) => void;
  /** 查看详情按钮点击处理 */
  onViewDetailsClick: (id: string) => void;
  /** 表格列配置生成函数 */
  generateTableColumns: (
    t: (key: string) => string,
    getColumnSearch: (dataIndex: keyof T) => any,
    lookupMaps: any,
    permissions: {
      canViewDetail: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    },
    onEdit: (item: T) => void,
    onDelete: (id: string) => void,
    onViewDetails: (id: string) => void
  ) => ProColumns<T>[];
  /** 删除确认对话框配置 */
  deleteConfirmConfig: {
    titleKey: string;
    contentKey: string;
    okTextKey: string;
    cancelTextKey: string;
    successMessageKey: string;
    errorMessageKey: string;
  };
  /** 批量删除配置 */
  batchDeleteConfig?: {
    enabled: boolean;
    buttonText: string;
    confirmTitle: string;
    confirmContent: string;
    confirmOkText: string;
    confirmCancelText: string;
    successMessage: string;
    errorMessage: string;
    noSelectionMessage: string;
    onBatchDelete: (selectedKeys: React.Key[]) => Promise<void>;
  };
  /** 导出配置 */
  exportConfig: {
    filenamePrefix: string;
    sheetName: string;
    buttonText: string;
    successMessage: string;
  };
  /** 查找数据错误消息翻译键 */
  lookupErrorMessageKey: string;
  /** 查找数据加载中消息翻译键 */
  lookupLoadingMessageKey: string;
  /** 查找数据错误显示消息翻译键 */
  lookupDataErrorMessageKey: string;
  /** 行键字段名 */
  rowKey?: string;
  /** 总数据量（用于服务器端分页） */
  total?: number;
  /** 是否启用服务器端分页 */
  serverSidePagination?: boolean;
  /** 是否启用服务器端排序 */
  serverSideSorting?: boolean;
  /** 是否启用服务器端筛选 */
  serverSideFiltering?: boolean;
  /** 分页配置 */
  paginationConfig?: TablePaginationConfig;
  /** 搜索回调 */
  onSearch?: (value: string) => void;
  /** 表格变化回调 */
  onTableChange?: (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<T> | SorterResult<T>[], extra: TableCurrentDataSource<T>) => void;
  /** 选中行键 */
  selectedRowKeys?: React.Key[];
  /** 设置选中行键的回调 */
  setSelectedRowKeys?: (selectedKeys: React.Key[]) => void;
}

// 标准列表页面模板组件
const StandardListPageTemplate = <T extends Record<string, any>>({
  translationNamespaces,
  pageTitleKey,
  addButtonTextKey,
  dataSource,
  loadingData,
  permissions = { canViewList: false, canViewDetail: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false },
  lookupMaps,
  loadingLookups,
  errorLookups,
  fetchData,
  deleteItem,
  onAddClick,
  onEditClick,
  onViewDetailsClick,
  generateTableColumns,
  deleteConfirmConfig,
  batchDeleteConfig,
  exportConfig,
  lookupErrorMessageKey,
  lookupLoadingMessageKey,
  lookupDataErrorMessageKey,
  rowKey = 'id',
  total,
  serverSidePagination,
  serverSideSorting,
  serverSideFiltering,
  paginationConfig,
  onSearch,
  onTableChange,
  selectedRowKeys,
  setSelectedRowKeys,
}: StandardListPageTemplateProps<T>): React.ReactElement => {
  const { t } = useTranslation(translationNamespaces);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const isInitializedRef = useRef(false);
  
  // 服务器端查询参数状态
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    page_size: 20,
    filters: {},
    sorting: [],
    search: '',
  });

  const { getColumnSearch, searchText, searchedColumn } = useTableSearch();

  // 定义删除处理函数
  const handleDelete = useCallback(async (itemId: string) => {
    modal.confirm({
      title: t(deleteConfirmConfig.titleKey),
      content: t(deleteConfirmConfig.contentKey),
      okText: t(deleteConfirmConfig.okTextKey),
      okType: 'danger',
      cancelText: t(deleteConfirmConfig.cancelTextKey),
      onOk: async () => {
        try {
          await deleteItem(itemId);
          message.success(t(deleteConfirmConfig.successMessageKey));
          // 根据是否启用服务器端功能决定如何刷新数据
          if (serverSidePagination || serverSideSorting || serverSideFiltering) {
            fetchData(queryParams);
          } else {
            fetchData();
          }
        } catch (error) {
          message.error(t(deleteConfirmConfig.errorMessageKey));
        }
      },
    });
  }, [t, deleteItem, fetchData, deleteConfirmConfig, message, modal, queryParams, serverSidePagination, serverSideSorting, serverSideFiltering]);

  // Generate the full column configuration using React.useMemo
  const tableColumnsConfigForControls = React.useMemo(() => {
    const columns = generateTableColumns(
      t, 
      getColumnSearch, 
      lookupMaps, 
      {
        canViewDetail: permissions.canViewDetail,
        canUpdate: permissions.canUpdate,
        canDelete: permissions.canDelete
      },
      onEditClick,
      handleDelete,
      onViewDetailsClick
    );
    
    // 如果启用服务器端排序或筛选，需要修改列配置
    if (serverSideSorting || serverSideFiltering) {
      return columns.map(column => {
        const newColumn = { ...column };
        
        // 对于服务器端排序，移除客户端排序函数
        if (serverSideSorting && column.sorter) {
          newColumn.sorter = true; // 启用排序但不提供排序函数
        }
        
        // 对于服务器端筛选，确保筛选配置正确
        if (serverSideFiltering && column.filters) {
          // 保持筛选配置，但移除客户端筛选函数
          newColumn.onFilter = undefined;
        }
        
        return newColumn;
      });
    }
    
    return columns;
  }, [t, getColumnSearch, lookupMaps, permissions.canViewDetail, permissions.canUpdate, permissions.canDelete, onEditClick, handleDelete, onViewDetailsClick, generateTableColumns, serverSideSorting, serverSideFiltering]);

  // 生成带有当前日期时间的文件名
  const generateExportFilename = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
    return `${exportConfig.filenamePrefix}_${dateStr}_${timeStr}`;
  };

  // 为导出创建简化的列配置（避免ProColumns类型兼容性问题）
  const exportColumns = React.useMemo(() => {
    return tableColumnsConfigForControls
      .filter(col => col.key !== 'action') // 排除操作列
      .map(col => ({
        title: col.title,
        dataIndex: col.dataIndex,
        key: col.key,
        render: col.render,
      }));
  }, [tableColumnsConfigForControls]);

  // 配置导出功能
  const { ExportButton } = useTableExport(
    dataSource, // dataSource for client-side export
    exportColumns as any, // columns for client-side export
    {
      filename: generateExportFilename(),
      sheetName: exportConfig.sheetName,
      buttonText: t(exportConfig.buttonText, t('components:auto_excel_e5afbc')), // StandardListPage usually has a dedicated Excel export button text
      successMessage: t(exportConfig.successMessage, t('components:auto_text_e5afbc')),
      supportedFormats: ['excel'], // Explicitly stating only excel for client mode
      // onExportRequest is NOT provided, so it will use client-side Excel export by default
    }
  );

  useEffect(() => {
    if (errorLookups) {
      message.error(t(lookupErrorMessageKey));
    }
  }, [errorLookups, t, lookupErrorMessageKey, message]);
 
  // Fetch all data once lookups are loaded
  useEffect(() => {
    if (!loadingLookups && !errorLookups && !isInitializedRef.current) {
      
      isInitializedRef.current = true;
      // 根据是否启用服务器端功能决定传递参数
      if (serverSidePagination || serverSideSorting || serverSideFiltering) {
        fetchData(queryParams);
      } else {
      fetchData();
      }
    }
  }, [loadingLookups, errorLookups, fetchData, queryParams, serverSidePagination, serverSideSorting, serverSideFiltering]);

  // 表格变化处理函数 - 支持服务器端和客户端操作
  const handleTableChange = (
    pagination: any,
    filters: Record<string, any | null>,
    sorter: SorterResult<T> | SorterResult<T>[],
    extra: { currentDataSource: T[], action: string }
  ) => {
    
    // 如果启用了服务器端功能，处理服务器端查询
    if (serverSidePagination || serverSideSorting || serverSideFiltering) {
      const newParams: QueryParams = { ...queryParams };

      // 处理分页
      if (serverSidePagination && pagination) {
        newParams.page = pagination.current || 1;
        newParams.page_size = pagination.pageSize || 20;
      }

      // 处理排序
      if (serverSideSorting && sorter) {
        const sorters = Array.isArray(sorter) ? sorter : [sorter];
        newParams.sorting = sorters
          .filter(s => s.field && s.order)
          .map(s => ({
            field: String(s.field),
            direction: s.order === 'ascend' ? 'asc' as const : 'desc' as const,
          }));
      }

      // 处理筛选
      if (serverSideFiltering && filters) {
        
        const activeFilters: Record<string, any> = {};
        Object.entries(filters).forEach(([key, filterValue]) => {
          // ProTable 通常将筛选值作为数组传递，即使是单选。
          // 如果筛选值是 null 或空数组，则表示该列没有激活的筛选。
          if (filterValue && (Array.isArray(filterValue) && filterValue.length > 0)) {
            // 后端可能期望单个值或数组，这里我们保留数组，如果后端需要单个值，可以在 ReportViewData 中处理
            activeFilters[key] = filterValue;
          }
        });
        newParams.filters = activeFilters;
        
      }

      // 更新查询参数并触发数据获取
      setQueryParams(newParams);
      fetchData(newParams);
    }
    // 对于客户端操作，Ant Table 会自动处理，无需额外操作
  };
 
  const combinedLoading = loadingData || loadingLookups;

  // 构建批量删除配置
  const finalBatchDeleteConfig = permissions.canDelete && batchDeleteConfig ? {
    enabled: true,
    buttonText: batchDeleteConfig.buttonText,
    confirmTitle: batchDeleteConfig.confirmTitle,
    confirmContent: batchDeleteConfig.confirmContent,
    confirmOkText: batchDeleteConfig.confirmOkText,
    confirmCancelText: batchDeleteConfig.confirmCancelText,
    onBatchDelete: batchDeleteConfig.onBatchDelete,
    successMessage: batchDeleteConfig.successMessage,
    errorMessage: batchDeleteConfig.errorMessage,
    noSelectionMessage: batchDeleteConfig.noSelectionMessage,
  } : undefined;

  // 刷新数据函数
  const handleRefresh = useCallback(() => {
    if (serverSidePagination || serverSideSorting || serverSideFiltering) {
      fetchData(queryParams);
    } else {
      fetchData();
    }
  }, [fetchData, queryParams, serverSidePagination, serverSideSorting, serverSideFiltering]);

  // 分页配置
  const paginationConfigForTable = serverSidePagination ? {
    current: queryParams.page,
    pageSize: queryParams.page_size,
    total: total || 0,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100', '200'],
    showTotal: (total: number, range: [number, number]) => 
      t('components:auto__range_0_range_1___total__e7acac', { range0: range[0], range1: range[1], total }),
  } : {
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100', '200'],
    showTotal: (total: number) => t('components:auto__total__e585b1'),
  };

  return (
    <div>
      {(lookupMaps && Object.keys(lookupMaps).length > 0) || (!loadingLookups && !errorLookups) ? (
        <OrganizationManagementTableTemplate<T>
          pageTitle={t(pageTitleKey)}
          addButtonText={t(addButtonTextKey)}
          onAddClick={onAddClick}
          showAddButton={permissions.canCreate}
          extraButtons={permissions.canExport ? [<ExportButton key="export" />] : []}
          batchDelete={finalBatchDeleteConfig}
          columns={tableColumnsConfigForControls}
          dataSource={dataSource}
          loading={combinedLoading}
          pagination={paginationConfigForTable}
          rowKey={rowKey}
          bordered
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          onChange={handleTableChange}
          onRefresh={handleRefresh}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {loadingLookups ? t(lookupLoadingMessageKey) : t(lookupDataErrorMessageKey)}
        </div>
      )}
    </div>
  );
};

export default StandardListPageTemplate; 

/*
使用示例 - 启用服务器端功能：

// 在组件中使用服务器端排序、筛选和分页
const MyListPage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // 数据获取函数，支持查询参数
  const fetchData = async (params?: QueryParams) => {
    setLoading(true);
    try {
      const response = await api.getData({
        page: params?.page || 1,
        page_size: params?.page_size || 20,
        filters: params?.filters || {},
        sorting: params?.sorting || [],
        search: params?.search || '',
      });
      setDataSource(response.data);
      setTotal(response.total);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <StandardListPageTemplate
      // ... 其他属性
      dataSource={dataSource}
      loadingData={loading}
      total={total}
      fetchData={fetchData}
      // 启用服务器端功能
      serverSidePagination={true}
      serverSideSorting={true}
      serverSideFiltering={true}
      // ... 其他配置
    />
  );
};

注意事项：
1. 当启用服务器端功能时，fetchData 函数必须支持 QueryParams 参数
2. 需要提供 total 属性用于分页显示
3. 列配置中的 sorter 和 filters 会自动适配服务器端模式
4. 所有数据操作（删除、刷新等）都会自动使用当前的查询参数
*/ 