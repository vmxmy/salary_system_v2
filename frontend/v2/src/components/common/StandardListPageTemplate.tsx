import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Space, Tooltip, Input, Card, App } from 'antd';
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import OrganizationManagementTableTemplate from './OrganizationManagementTableTemplate';
import type { SorterResult } from 'antd/es/table/interface';
import type { ProColumns } from '@ant-design/pro-components';
import { stringSorter, numberSorter, dateSorter, useTableSearch, useTableExport } from './TableUtils';
import type { Dayjs } from 'dayjs';
import TableActionButton from './TableActionButton';

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
  fetchData: () => Promise<void>;
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
}

// 标准列表页面模板组件
const StandardListPageTemplate = <T extends Record<string, any>>({
  translationNamespaces,
  pageTitleKey,
  addButtonTextKey,
  dataSource,
  loadingData,
  permissions,
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
}: StandardListPageTemplateProps<T>): React.ReactElement => {
  const { t } = useTranslation(translationNamespaces);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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
          fetchData(); // Refetch all data after deletion
        } catch (error) {
          message.error(t(deleteConfirmConfig.errorMessageKey));
          console.error('Failed to delete item:', error);
        }
      },
    });
  }, [t, deleteItem, fetchData, deleteConfirmConfig, message, modal]);

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
    
    // 🔍 调试：检查生成的列配置
    console.log('[StandardListPageTemplate] 🔍 Generated columns:', columns.length);
    const employeeNameCol = columns.find(col => col.key === 'employee_name');
    console.log('[StandardListPageTemplate] 🔍 Employee name column:', {
      exists: !!employeeNameCol,
      hasRender: !!employeeNameCol?.render,
      title: employeeNameCol?.title,
      key: employeeNameCol?.key,
      renderType: typeof employeeNameCol?.render
    });
    
    return columns;
  }, [t, getColumnSearch, lookupMaps, permissions.canViewDetail, permissions.canUpdate, permissions.canDelete, onEditClick, handleDelete, onViewDetailsClick, generateTableColumns]);

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
  const { ExportButton } = useTableExport(dataSource, exportColumns as any, {
    filename: generateExportFilename(),
    sheetName: exportConfig.sheetName,
    buttonText: exportConfig.buttonText,
    successMessage: exportConfig.successMessage,
  });

  useEffect(() => {
    if (errorLookups) {
      message.error(t(lookupErrorMessageKey));
      console.error('Error from lookups:', errorLookups);
    }
  }, [errorLookups, t, lookupErrorMessageKey, message]);
 
  // Fetch all data once lookups are loaded
  useEffect(() => {
    if (!loadingLookups) {
      fetchData();
    }
  }, [fetchData, loadingLookups]); // Depends on fetchData and loadingLookups

  // Ant Table's onChange handler for client-side operations
  const handleTableChange = (
    pagination: any, // pagination object from Ant Table
    filters: Record<string, any | null>, // filters object from Ant Table
    sorter: SorterResult<T> | SorterResult<T>[], // sorter object from Ant Table
    extra: { currentDataSource: T[], action: string } // extra info
  ) => {
    // For client-side pagination, sorting, and filtering,
    // Ant Table handles these internally based on the full dataSource.
    // This callback can be used to log changes or if any external state needs to be synced.
    console.log('Ant Table onChange event:', { pagination, filters, sorter, extra });
    // No need to set any state here for data fetching purposes when all data is client-side.
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
    onBatchDelete: async (selectedKeys: React.Key[]) => {
      // 逐个删除选中的项目
      const deletePromises = selectedKeys.map(id => 
        deleteItem(String(id))
      );
      await Promise.all(deletePromises);
      setSelectedRowKeys([]); // 清空选择
      fetchData(); // 重新获取数据
    },
    successMessage: batchDeleteConfig.successMessage,
    errorMessage: batchDeleteConfig.errorMessage,
    noSelectionMessage: batchDeleteConfig.noSelectionMessage,
  } : undefined;

  return (
    <div>
      {lookupMaps && Object.keys(lookupMaps).length > 0 ? (
        (() => {
          console.log('[StandardListPageTemplate] Rendering OrganizationManagementTableTemplate. dataSource.length:', dataSource.length);
          return (
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
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ['10', '20', '50', '100', '200'],
                showTotal: (total: number) => `共 ${total} 条`,
              }}
              rowKey={rowKey}
              bordered
              scroll={{ x: 'max-content' }}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              onChange={handleTableChange}
              onRefresh={fetchData}
            />
          );
        })()
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {loadingLookups ? t(lookupLoadingMessageKey) : t(lookupDataErrorMessageKey)}
        </div>
      )}
    </div>
  );
};

export default StandardListPageTemplate; 