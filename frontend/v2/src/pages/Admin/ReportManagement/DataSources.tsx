import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Space, Button, Tooltip, Modal, Drawer, App } from 'antd';
import { 
  DatabaseOutlined, 
  CheckCircleOutlined, 
  StopOutlined,
  LinkOutlined,
  CopyOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SyncOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { StandardListPageTemplateProps } from '../../../components/common/StandardListPageTemplate';
import { dataSourceAPI, type DataSource } from '../../../api/reports';
import type { ReportDataSource } from './types';
import DataSourceForm from './components/DataSourceForm.tsx';
import DataSourceDetails from './components/DataSourceDetails.tsx';
import FieldManagement from './components/FieldManagement.tsx';

const DataSources: React.FC = () => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const { message } = App.useApp();
  const [data, setData] = useState<ReportDataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [fieldsDrawerVisible, setFieldsDrawerVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<ReportDataSource | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');

  // 加载数据源列表
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dataSourceAPI.getDataSources();
      // 转换API数据格式为组件需要的格式
      const transformedData: ReportDataSource[] = response.data.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        category: item.category,
        connection_type: item.connection_type,
        schema_name: item.schema_name,
        table_name: item.table_name,
        view_name: item.view_name,
        custom_query: item.custom_query,
        source_type: item.source_type,
        connection_config: item.connection_config,
        field_mapping: item.field_mapping,
        default_filters: item.default_filters,
        sort_config: item.sort_config,
        access_level: item.access_level,
        allowed_roles: item.allowed_roles?.map(String),
        allowed_users: item.allowed_users,
        cache_enabled: item.cache_enabled,
        cache_duration: item.cache_duration,
        max_rows: item.max_rows,
        is_active: item.is_active,
        is_system: item.is_system,
        sort_order: item.sort_order,
        tags: item.tags,
        field_count: item.field_count,
        usage_count: item.usage_count,
        last_used_at: item.last_used_at,
        last_sync_at: item.last_sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
        fields: item.fields
      }));
      setData(transformedData);
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
      message.error(t('loadDataFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 删除数据源
  const deleteItem = useCallback(async (id: string) => {
    try {
      await dataSourceAPI.deleteDataSource(Number(id));
      setData(prev => prev.filter(item => item.id !== Number(id)));
      message.success(t('deleteDataSourceSuccess'));
    } catch (error) {
      console.error('Failed to delete data source:', error);
      throw new Error(t('deleteDataSourceFailed'));
    }
  }, [t]);

  // 处理新增
  const handleAdd = () => {
    setCurrentItem(null);
    setEditMode('create');
    setEditModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (item: ReportDataSource) => {
    setCurrentItem(item);
    setEditMode('edit');
    setEditModalVisible(true);
  };

  // 处理查看详情
  const handleViewDetails = (id: string) => {
    const item = data.find(d => d.id === Number(id));
    if (item) {
      setCurrentItem(item);
      setDetailsDrawerVisible(true);
    }
  };

  // 处理字段管理
  const handleManageFields = (item: ReportDataSource) => {
    setCurrentItem(item);
    setFieldsDrawerVisible(true);
  };

  // 测试连接
  const handleTestConnection = async (item: ReportDataSource) => {
    try {
      message.loading(t('testingConnection'), 0);
      const response = await dataSourceAPI.testConnection({
        connection_type: item.connection_type,
        connection_config: item.connection_config || {},
        schema_name: item.schema_name,
        table_name: item.table_name
      });
      message.destroy();
      
      if (response.data.success) {
        message.success(t('connectionTestSuccess'));
      } else {
        message.error(response.data.message || t('connectionTestFailed'));
      }
    } catch (error) {
      message.destroy();
      console.error('Connection test failed:', error);
      message.error(t('connectionTestFailed'));
    }
  };

  // 同步字段
  const handleSyncFields = async (item: ReportDataSource) => {
    try {
      message.loading(t('syncingFields'), 0);
      await dataSourceAPI.syncFields(item.id!);
      message.destroy();
      message.success(t('syncFieldsSuccess'));
      // 重新加载数据
      fetchData();
    } catch (error) {
      message.destroy();
      console.error('Sync fields failed:', error);
      message.error(t('syncFieldsFailed'));
    }
  };

  // 复制数据源
  const handleCopy = (item: ReportDataSource) => {
    const copiedItem = {
      ...item,
      id: undefined,
      code: `${item.code}_copy`,
      name: `${item.name} (副本)`,
      created_at: undefined,
      updated_at: undefined
    };
    setCurrentItem(copiedItem);
    setEditMode('create');
    setEditModalVisible(true);
  };

  // 切换启用状态
  const handleToggleStatus = async (item: ReportDataSource) => {
    try {
      const newStatus = !item.is_active;
      await dataSourceAPI.updateDataSource(item.id!, { is_active: newStatus });
      setData(prev => prev.map(d => 
        d.id === item.id ? { ...d, is_active: newStatus } : d
      ));
      message.success(newStatus ? t('dataSourceEnabled') : t('dataSourceDisabled'));
    } catch (error) {
      console.error('Failed to toggle status:', error);
      message.error(t('updateStatusFailed'));
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (editMode === 'create') {
        const response = await dataSourceAPI.createDataSource(values);
        const newItem: ReportDataSource = {
          ...response.data,
          allowed_roles: response.data.allowed_roles?.map(String)
        };
        setData(prev => [...prev, newItem]);
        message.success(t('createDataSourceSuccess'));
      } else {
        const response = await dataSourceAPI.updateDataSource(currentItem!.id!, values);
        const updatedItem: ReportDataSource = {
          ...response.data,
          allowed_roles: response.data.allowed_roles?.map(String)
        };
        setData(prev => prev.map(item => 
          item.id === currentItem!.id ? updatedItem : item
        ));
        message.success(t('updateDataSourceSuccess'));
      }
      setEditModalVisible(false);
      setCurrentItem(null);
    } catch (error: any) {
      console.error('Failed to save data source:', error);
      
      // 提取后端返回的错误信息
      let errorMessage = editMode === 'create' ? t('createDataSourceFailed') : t('updateDataSourceFailed');
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    }
  };

  // 生成表格列配置
  const generateTableColumns = useCallback((
    t: (key: string) => string,
    getColumnSearch: (dataIndex: keyof DataSource) => any,
    lookupMaps: any,
    permissions: {
      canViewDetail: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    },
    onEdit: (item: DataSource) => void,
    onDelete: (id: string) => void,
    onViewDetails: (id: string) => void
  ): ProColumns<DataSource>[] => {
    return [
      {
        title: t('dataSourceName'),
        dataIndex: 'name',
        key: 'name',
        width: 200,
        fixed: 'left',
        ...getColumnSearch('name'),
        render: (text: string, record: DataSource) => (
          <Space>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 500 }}>{text}</span>
          </Space>
        ),
      },
      {
        title: t('description'),
        dataIndex: 'description',
        key: 'description',
        width: 250,
        ellipsis: true,
        ...getColumnSearch('description'),
      },
      {
        title: t('connectionType'),
        dataIndex: 'connection_type',
        key: 'connection_type',
        width: 120,
        filters: [
          { text: 'PostgreSQL', value: 'postgresql' },
          { text: 'MySQL', value: 'mysql' },
          { text: 'SQL Server', value: 'sqlserver' },
          { text: 'Oracle', value: 'oracle' },
          { text: 'SQLite', value: 'sqlite' },
        ],
        onFilter: (value: any, record: DataSource) => record.connection_type === value,
        render: (type: string) => {
          const colorMap: Record<string, string> = {
            postgresql: 'blue',
            mysql: 'orange',
            sqlserver: 'purple',
            oracle: 'red',
            sqlite: 'green',
          };
          return <Tag color={colorMap[type] || 'default'}>{type.toUpperCase()}</Tag>;
        },
      },
      {
        title: t('schemaTable'),
        key: 'schema_table',
        width: 200,
        render: (_, record: DataSource) => (
          <Space direction="vertical" size={0}>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {t('schema')}: {record.schema_name}
            </span>
            <span style={{ fontWeight: 500 }}>
              {t('table')}: {record.table_name}
            </span>
          </Space>
        ),
      },
      {
        title: t('fieldCount'),
        dataIndex: 'field_count',
        key: 'field_count',
        width: 100,
        align: 'center',
        sorter: (a: DataSource, b: DataSource) => a.field_count - b.field_count,
        render: (count: number) => (
          <Tag color="cyan">{count}</Tag>
        ),
      },
      {
        title: t('status'),
        dataIndex: 'is_active',
        key: 'is_active',
        width: 100,
        align: 'center',
        filters: [
          { text: t('active'), value: true },
          { text: t('inactive'), value: false },
        ],
        onFilter: (value: any, record: DataSource) => record.is_active === value,
        render: (isActive: boolean, record: DataSource) => (
          <Button
            type="text"
            size="small"
            icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
            style={{ 
              color: isActive ? '#52c41a' : '#ff4d4f',
              border: 'none',
              padding: 0
            }}
            onClick={() => handleToggleStatus(record as ReportDataSource)}
          >
            {isActive ? t('active') : t('inactive')}
          </Button>
        ),
      },
      {
        title: t('creator'),
        dataIndex: 'created_by',
        key: 'created_by',
        width: 120,
        render: (createdBy: number) => createdBy || '-',
      },
      {
        title: t('createdAt'),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 160,
        sorter: (a: DataSource, b: DataSource) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (date: string) => new Date(date).toLocaleString(),
      },
      {
        title: t('updatedAt'),
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 160,
        sorter: (a: DataSource, b: DataSource) => 
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
        render: (date: string) => new Date(date).toLocaleString(),
      },
      {
        title: t('actions'),
        key: 'action',
        fixed: 'right',
        width: 250,
        render: (_, record: DataSource) => (
          <Space size="small">
            <Tooltip title={t('testConnection')}>
              <Button
                type="text"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => handleTestConnection(record as ReportDataSource)}
              />
            </Tooltip>
            <Tooltip title={t('syncFields')}>
              <Button
                type="text"
                size="small"
                icon={<SyncOutlined />}
                onClick={() => handleSyncFields(record as ReportDataSource)}
              />
            </Tooltip>
            <Tooltip title={t('manageFields')}>
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => handleManageFields(record as ReportDataSource)}
              />
            </Tooltip>
            <Tooltip title={t('copy')}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(record as ReportDataSource)}
              />
            </Tooltip>
            {permissions.canViewDetail && (
              <Tooltip title={t('viewDetails')}>
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onViewDetails(record.id.toString())}
                />
              </Tooltip>
            )}
            {permissions.canUpdate && (
              <Tooltip title={t('edit')}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record as ReportDataSource)}
                />
              </Tooltip>
            )}
            {permissions.canDelete && (
              <Tooltip title={t('delete')}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(record.id.toString())}
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ];
  }, [handleTestConnection, handleCopy, handleToggleStatus, handleSyncFields, handleManageFields, handleEdit]);

  // 权限配置
  const permissions = {
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  };

  // 删除确认配置
  const deleteConfirmConfig = {
    titleKey: 'confirmDeleteDataSource',
    contentKey: 'confirmDeleteDataSourceContent',
    okTextKey: 'delete',
    cancelTextKey: 'cancel',
    successMessageKey: 'deleteDataSourceSuccess',
    errorMessageKey: 'deleteDataSourceFailed',
  };

  // 导出配置
  const exportConfig = {
    filenamePrefix: 'data_sources',
    sheetName: 'DataSources',
    buttonText: t('export'),
    successMessage: t('exportSuccess'),
  };

  const templateProps: StandardListPageTemplateProps<DataSource> = {
    translationNamespaces: ['reportManagement', 'common'],
    pageTitleKey: 'dataSourceManagement',
    addButtonTextKey: 'addDataSource',
    dataSource: data as DataSource[],
    loadingData: loading,
    permissions,
    lookupMaps: { initialized: true }, // 提供非空对象避免显示错误消息
    loadingLookups: false,
    errorLookups: null,
    fetchData,
    deleteItem,
    onAddClick: handleAdd,
    onEditClick: (item: DataSource) => handleEdit(item as ReportDataSource),
    onViewDetailsClick: handleViewDetails,
    generateTableColumns,
    deleteConfirmConfig,
    exportConfig,
    lookupErrorMessageKey: 'lookupDataError',
    lookupLoadingMessageKey: 'lookupDataLoading',
    lookupDataErrorMessageKey: 'lookupDataErrorMessage',
    rowKey: 'id',
  };

  return (
    <>
      <StandardListPageTemplate {...templateProps} />
      
      {/* 数据源表单模态框 */}
      <DataSourceForm
        visible={editModalVisible}
        mode={editMode}
        initialValues={currentItem}
        onSubmit={handleFormSubmit}
        onCancel={() => setEditModalVisible(false)}
      />
      
      {/* 数据源详情抽屉 */}
      <DataSourceDetails
        visible={detailsDrawerVisible}
        dataSource={currentItem}
        onClose={() => setDetailsDrawerVisible(false)}
      />
      
      {/* 字段管理抽屉 */}
      <FieldManagement
        visible={fieldsDrawerVisible}
        dataSource={currentItem}
        onClose={() => setFieldsDrawerVisible(false)}
      />
    </>
  );
};

export default DataSources;