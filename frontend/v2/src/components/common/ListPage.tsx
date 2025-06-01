import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, message, Modal, Space, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';

import { DataTable, SearchForm, ModalForm } from './index';
import type { SearchFormConfig, ExportFormat, ModalFormConfig } from './index';

// 权限配置
export interface ListPagePermissions {
  /** 是否可以查看列表 */
  canViewList?: boolean;
  /** 是否可以查看详情 */
  canViewDetail?: boolean;
  /** 是否可以创建 */
  canCreate?: boolean;
  /** 是否可以更新 */
  canUpdate?: boolean;
  /** 是否可以删除 */
  canDelete?: boolean;
  /** 是否可以导出 */
  canExport?: boolean;
}

// 服务接口
export interface ListPageService<T = any, Q = any> {
  /** 获取列表数据 */
  getList: (query: Q) => Promise<{ data: T[]; total?: number; success?: boolean }>;
  /** 创建记录 */
  create?: (data: any) => Promise<T>;
  /** 更新记录 */
  update?: (id: string | number, data: any) => Promise<T>;
  /** 删除记录 */
  delete?: (id: string | number) => Promise<void>;
  /** 导出数据 */
  export?: (format: ExportFormat, data: T[]) => Promise<void>;
}

// 路由配置
export interface ListPageRoutes {
  /** 详情页路由 */
  detail?: string;
  /** 编辑页路由 */
  edit?: string;
  /** 创建页路由 */
  create?: string;
}

// 消息配置
export interface ListPageMessages {
  /** 获取数据失败消息 */
  getListFailed?: string;
  /** 获取数据失败（空响应）消息 */
  getListFailedEmpty?: string;
  /** 创建成功消息 */
  createSuccess?: string;
  /** 创建失败消息 */
  createFailed?: string;
  /** 更新成功消息 */
  updateSuccess?: string;
  /** 更新失败消息 */
  updateFailed?: string;
  /** 删除成功消息 */
  deleteSuccess?: string;
  /** 删除失败消息 */
  deleteFailed?: string;
  /** 导出成功消息 */
  exportSuccess?: string;
  /** 导出失败消息 */
  exportFailed?: string;
  /** 加载辅助数据失败消息 */
  loadAuxDataFailed?: string;
}

// 删除确认配置
export interface DeleteConfirmConfig {
  /** 确认标题 */
  title?: string;
  /** 确认内容 */
  content?: string;
  /** 确认按钮文本 */
  okText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
}

// 列表页面配置
export interface ListPageConfig<T = any, Q = any> {
  /** 页面标题 */
  title: string;
  /** 页面描述 */
  description?: string;
  /** 表格列配置 */
  columns: ProColumns<T>[];
  /** 搜索表单配置 */
  searchConfig?: SearchFormConfig;
  /** 创建表单配置 */
  createFormConfig?: ModalFormConfig;
  /** 编辑表单配置 */
  editFormConfig?: ModalFormConfig;
  /** 权限配置 */
  permissions: ListPagePermissions;
  /** 服务接口 */
  service: ListPageService<T, Q>;
  /** 路由配置 */
  routes?: ListPageRoutes;
  /** 消息配置 */
  messages?: ListPageMessages;
  /** 删除确认配置 */
  deleteConfirm?: DeleteConfirmConfig;
  /** 表格配置 */
  tableConfig?: {
    /** 是否显示序号列 */
    showIndex?: boolean;
    /** 是否显示选择列 */
    showSelection?: boolean;
    /** 是否显示边框 */
    bordered?: boolean;
    /** 工具栏配置 */
    toolbar?: {
      showRefresh?: boolean;
      showExport?: boolean;
      showColumnSetting?: boolean;
      showDensity?: boolean;
      showFullscreen?: boolean;
    };
  };
  /** 查询参数转换函数 */
  transformQuery?: (params: Record<string, any>) => Q;
  /** 获取记录ID的函数 */
  getRecordId?: (record: T) => string | number;
  /** 获取记录显示名称的函数 */
  getRecordName?: (record: T) => string;
  /** 自定义操作列 */
  customActions?: (record: T) => React.ReactNode;
  /** 额外的页面操作按钮 */
  extraActions?: React.ReactNode;
}

// 列表页面属性
export interface ListPageProps<T = any, Q = any> {
  /** 列表页面配置 */
  config: ListPageConfig<T, Q>;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

// 列表页面引用类型
export interface ListPageRef {
  /** 刷新列表 */
  refresh: () => void;
  /** 获取当前数据 */
  getData: () => any[];
  /** 获取选中的数据 */
  getSelectedData: () => any[];
  /** 打开创建模态框 */
  openCreateModal: () => void;
  /** 打开编辑模态框 */
  openEditModal: (record: any) => void;
}

const ListPage = <T extends Record<string, any>, Q extends Record<string, any> = Record<string, any>>({
  config,
  style,
  className,
}: ListPageProps<T, Q>) => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const { message: appMessage, modal } = App.useApp();

  // 解构配置
  const {
    title,
    description,
    columns,
    searchConfig,
    createFormConfig,
    editFormConfig,
    permissions,
    service,
    routes = {},
    messages = {},
    deleteConfirm = {},
    tableConfig = {},
    transformQuery,
    getRecordId = (record: T) => record.id,
    getRecordName = (record: T) => record.name || record.title || String(getRecordId(record)),
    customActions,
    extraActions,
  } = config;

  // 状态管理
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);

  // 获取列表数据
  const fetchData = useCallback(async (params: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const query = transformQuery ? transformQuery(params) : (params as Q);
      const response = await service.getList(query);
      
      if (response && response.data) {
        setData(response.data);
      } else {
        setData([]);
        if (messages.getListFailedEmpty) {
          appMessage.error(messages.getListFailedEmpty);
        }
      }
    } catch (error) {
      if (messages.getListFailed) {
        appMessage.error(messages.getListFailed);
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [service, transformQuery, appMessage]);

  // 处理搜索
  const handleSearch = useCallback((values: Record<string, any>) => {
    setSearchParams(values);
    fetchData(values);
  }, [fetchData]);

  // 处理刷新
  const handleRefresh = useCallback(() => {
    fetchData(searchParams);
  }, [fetchData, searchParams]);

  // 处理删除
  const handleDelete = useCallback(async (record: T) => {
    if (!service.delete) return;

    const recordId = getRecordId(record);
    const recordName = getRecordName(record);

    modal.confirm({
      title: deleteConfirm.title || t('delete_confirm.title'),
      content: deleteConfirm.content || t('delete_confirm.content', { name: recordName }),
      okText: deleteConfirm.okText || t('delete_confirm.ok_text'),
      okType: 'danger',
      cancelText: deleteConfirm.cancelText || t('delete_confirm.cancel_text'),
      onOk: async () => {
        try {
          await service.delete!(recordId);
          appMessage.success(messages.deleteSuccess || t('message.delete_success'));
          handleRefresh();
        } catch (error) {
          appMessage.error(messages.deleteFailed || t('message.delete_failed'));
        }
      },
    });
  }, [service, getRecordId, getRecordName, deleteConfirm, messages, t, handleRefresh, modal]);

  // 处理导出
  const handleExport = useCallback(async (format: ExportFormat, exportData: T[]) => {
    try {
      if (service.export) {
        await service.export(format, exportData);
        appMessage.success(messages.exportSuccess || t('message.export_success'));
      } else {
        appMessage.success(t('components:auto__exportdata_length__format_touppercase__e68890'));
      }
    } catch (error) {
      appMessage.error(messages.exportFailed || t('message.export_failed'));
    }
  }, [service, messages, t]);

  // 处理创建
  const handleCreate = useCallback(async (values: Record<string, any>) => {
    if (!service.create) return false;

    try {
      await service.create(values);
      appMessage.success(messages.createSuccess || t('message.create_success'));
      setCreateModalVisible(false);
      handleRefresh();
      return true;
    } catch (error) {
      appMessage.error(messages.createFailed || t('message.create_failed'));
      return false;
    }
  }, [service, messages, t, handleRefresh]);

  // 处理编辑
  const handleEdit = useCallback(async (values: Record<string, any>) => {
    if (!service.update || !editingRecord) return false;

    try {
      const recordId = getRecordId(editingRecord);
      await service.update(recordId, values);
      appMessage.success(messages.updateSuccess || t('message.update_success'));
      setEditModalVisible(false);
      setEditingRecord(null);
      handleRefresh();
      return true;
    } catch (error) {
      appMessage.error(messages.updateFailed || t('message.update_failed'));
      return false;
    }
  }, [service, editingRecord, getRecordId, messages, t, handleRefresh]);

  // 打开编辑模态框
  const openEditModal = useCallback((record: T) => {
    setEditingRecord(record);
    setEditModalVisible(true);
  }, []);

  // 处理行点击
  const handleRowClick = useCallback((record: T) => {
    if (permissions.canViewDetail && routes.detail) {
      const recordId = getRecordId(record);
      navigate(routes.detail.replace(':id', String(recordId)));
    }
  }, [permissions.canViewDetail, routes.detail, getRecordId, navigate]);

  // 增强列配置（添加操作列）
  const enhancedColumns = useMemo(() => {
    const actionColumn: ProColumns<T> = {
      title: t('label.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record: T) => (
        <Space>
          {permissions.canViewDetail && routes.detail && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const recordId = getRecordId(record);
                navigate(routes.detail!.replace(':id', String(recordId)));
              }}
            >
              {t('action.view')}
            </Button>
          )}
          {permissions.canUpdate && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                if (routes.edit) {
                  const recordId = getRecordId(record);
                  navigate(routes.edit.replace(':id', String(recordId)));
                } else if (editFormConfig) {
                  openEditModal(record);
                }
              }}
            >
              {t('action.edit')}
            </Button>
          )}
          {permissions.canDelete && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(record);
              }}
            >
              {t('action.delete')}
            </Button>
          )}
          {customActions?.(record)}
        </Space>
      ),
    };

    return [...columns, actionColumn];
  }, [
    columns,
    permissions,
    routes,
    getRecordId,
    navigate,
    editFormConfig,
    openEditModal,
    handleDelete,
    customActions,
    t,
  ]);

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 权限检查
  if (!permissions.canViewList) {
    return (
      <PageContainer title={title}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{t('permission_denied_action')}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <div style={style} className={className}>
      <PageContainer 
        title={title}
        content={description}
        extra={[
          extraActions,
          permissions.canCreate && (createFormConfig || routes.create) && (
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (routes.create) {
                  navigate(routes.create);
                } else {
                  setCreateModalVisible(true);
                }
              }}
            >
              {t('action.create')}
            </Button>
          ),
        ].filter(Boolean)}
      >
        {/* 搜索表单 */}
        {searchConfig && (
          <SearchForm
            config={searchConfig}
            onSearch={handleSearch}
            loading={loading}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 数据表格 */}
        <DataTable<T>
          columns={enhancedColumns}
          dataSource={data}
          loading={loading}
          title={title}
          description={description}
          showIndex={tableConfig.showIndex}
          showSelection={tableConfig.showSelection}
          bordered={tableConfig.bordered}
          toolbar={tableConfig.toolbar}
          onRefresh={handleRefresh}
          onExport={permissions.canExport ? handleExport : undefined}
          onRowClick={handleRowClick}
          rowKey={(record: T) => String(getRecordId(record))}
          scroll={{ x: 'max-content' }}
        />

        {/* 创建模态框 */}
        {createFormConfig && (
          <ModalForm
            visible={createModalVisible}
            mode="create"
            config={createFormConfig}
            onSubmit={handleCreate}
            onCancel={() => setCreateModalVisible(false)}
          />
        )}

        {/* 编辑模态框 */}
        {editFormConfig && (
          <ModalForm
            visible={editModalVisible}
            mode="edit"
            config={editFormConfig}
            initialData={editingRecord || undefined}
            onSubmit={handleEdit}
            onCancel={() => {
              setEditModalVisible(false);
              setEditingRecord(null);
            }}
          />
        )}
      </PageContainer>
    </div>
  );
};

export default ListPage; 