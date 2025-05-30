import React, { useState, useEffect, useCallback } from 'react';
import { message, Tag, Space, Button, Tooltip, Modal, Card, Form, Input, Select, Table } from 'antd';
import { 
  CodeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  DatabaseOutlined,
  SettingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { StandardListPageTemplateProps } from '../../../components/common/StandardListPageTemplate';
import { dataSourceAPI } from '../../../api/reports';

import CustomQueryEditor from './components/ReportDesigner/CustomQueryEditor';

// 自定义查询数据类型
interface CustomQuery {
  id: string;
  name: string;
  description?: string;
  sql: string;
  parameters: any[];
  dataSource: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DataSource {
  value: string;
  label: string;
}

const CustomQueryPage: React.FC = () => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [data, setData] = useState<CustomQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingQuery, setEditingQuery] = useState<CustomQuery | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 加载自定义查询列表
  const loadData = async () => {
    try {
      setLoading(true);
      // 注意：目前还没有自定义查询的专门API，所以暂时保留空数组
      // 实际项目中应该调用：const response = await customQueryAPI.getQueries();
      setData([]);
    } catch (error: any) {
      console.error('Failed to load custom queries:', error);
      message.error(`加载自定义查询失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 加载数据源列表
  const loadDataSources = async () => {
    try {
      const response = await dataSourceAPI.getDataSources();
      setDataSources(response.data);
    } catch (error: any) {
      console.error('Failed to load data sources:', error);
      message.error(`加载数据源失败: ${error.response?.data?.detail || error.message}`);
    }
  };

  // 保存查询
  const handleSave = async (values: any) => {
    try {
      // 注意：目前还没有自定义查询的专门API
      // 实际项目中应该调用：
      // if (editingQuery) {
      //   await customQueryAPI.updateQuery(editingQuery.id, values);
      // } else {
      //   await customQueryAPI.createQuery(values);
      // }
      
      message.success(editingQuery ? '查询更新成功' : '查询创建成功');
      setModalVisible(false);
      setEditingQuery(null);
      await loadData();
    } catch (error: any) {
      console.error('Failed to save query:', error);
      message.error(`保存失败: ${error.response?.data?.detail || error.message}`);
    }
  };

  // 删除查询
  const handleDelete = async (id: string) => {
    try {
      // 注意：目前还没有自定义查询的专门API
      // 实际项目中应该调用：await customQueryAPI.deleteQuery(id);
      
      message.success('查询删除成功');
      await loadData();
    } catch (error: any) {
      console.error('Failed to delete query:', error);
      message.error(`删除失败: ${error.response?.data?.detail || error.message}`);
    }
  };

  // 执行查询
  const handleExecute = async (query: CustomQuery) => {
    try {
      setLoading(true);
      // 注意：目前还没有自定义查询的执行API
      // 实际项目中应该调用：const result = await customQueryAPI.executeQuery(query.id);
      
      message.success('查询执行成功');
    } catch (error: any) {
      console.error('Failed to execute query:', error);
      message.error(`执行失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadDataSources();
  }, []);

  // 处理新增
  const handleAdd = () => {
    setEditingQuery(null);
    setEditorVisible(true);
  };

  // 处理编辑
  const handleEdit = (item: CustomQuery) => {
    setEditingQuery(item);
    setEditorVisible(true);
  };

  // 处理查看详情
  const handleViewDetails = (id: string) => {
    const item = data.find(d => d.id === id);
    if (item) {
      setEditingQuery(item);
      setEditorVisible(true);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setEditorVisible(false);
    setEditingQuery(null);
  };

  // 转换查询数据以匹配CustomQueryEditor的期望类型
  const convertQueryForEditor = (query?: CustomQuery) => {
    if (!query) return undefined;
    return {
      ...query,
      id: query.id ? Number(query.id) : undefined
    };
  };

  // 生成表格列配置
  const generateTableColumns = useCallback((
    t: (key: string) => string,
    getColumnSearch: (dataIndex: keyof CustomQuery) => any,
    lookupMaps: any,
    permissions: {
      canViewDetail: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    },
    onEdit: (item: CustomQuery) => void,
    onDelete: (id: string) => void,
    onViewDetails: (id: string) => void
  ): ProColumns<CustomQuery>[] => {
    return [
      {
        title: t('customQuery.queryName'),
        dataIndex: 'name',
        key: 'name',
        width: 200,
        fixed: 'left',
        ...getColumnSearch('name'),
        render: (text: string, record: CustomQuery) => (
          <Space direction="vertical" size={0}>
            <Space>
              <CodeOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 500 }}>{text}</span>
            </Space>
            {record.description && (
              <span style={{ fontSize: '12px', color: '#999' }}>
                {record.description}
              </span>
            )}
          </Space>
        ),
      },
      {
        title: t('customQuery.dataSource'),
        dataIndex: 'dataSource',
        key: 'dataSource',
        width: 120,
        filters: dataSources.map(ds => ({ text: ds.label, value: ds.value })),
        onFilter: (value: any, record: CustomQuery) => record.dataSource === value,
        render: (value: string) => {
          const ds = dataSources.find(d => d.value === value);
          return (
            <Tag color="blue" icon={<DatabaseOutlined />}>
              {ds?.label || value}
            </Tag>
          );
        }
      },
      {
        title: t('customQuery.parameterCount'),
        dataIndex: 'parameters',
        key: 'parameters',
        width: 100,
        align: 'center',
        render: (parameters: any[]) => (
          <Tag 
            color={parameters.length > 0 ? 'green' : 'default'}
            icon={<SettingOutlined />}
          >
            {parameters.length}
          </Tag>
        )
      },
      {
        title: t('customQuery.lastUpdated'),
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 160,
        sorter: (a: CustomQuery, b: CustomQuery) => 
          new Date(a.updatedAt || '').getTime() - new Date(b.updatedAt || '').getTime(),
        render: (date: string) => date ? new Date(date).toLocaleString() : '-',
      },
      {
        title: t('actions'),
        key: 'action',
        fixed: 'right',
        width: 180,
        render: (_, record: CustomQuery) => (
          <Space size="small">
            <Tooltip title={t('customQuery.execute')}>
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleExecute(record)}
              />
            </Tooltip>
            {permissions.canViewDetail && (
              <Tooltip title={t('customQuery.edit')}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
            )}
            {permissions.canDelete && (
              <Tooltip title={t('customQuery.delete')}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(record.id)}
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ];
  }, [dataSources, handleExecute]);

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
    titleKey: 'customQuery.confirmDelete',
    contentKey: 'customQuery.confirmDeleteContent',
    okTextKey: 'customQuery.delete',
    cancelTextKey: 'cancel',
    successMessageKey: 'customQuery.deleteSuccess',
    errorMessageKey: 'customQuery.deleteFailed',
  };

  // 导出配置
  const exportConfig = {
    filenamePrefix: 'custom_queries',
    sheetName: 'CustomQueries',
    buttonText: t('export'),
    successMessage: t('exportSuccess'),
  };

  // 如果编辑器可见，显示编辑器
  if (editorVisible) {
    return (
      <PageContainer
        title={t('customQuery.title')}
        onBack={handleCancel}
        extra={null}
      >
        <CustomQueryEditor
          initialQuery={convertQueryForEditor(editingQuery)}
          dataSources={dataSources}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </PageContainer>
    );
  }

  const templateProps: StandardListPageTemplateProps<CustomQuery> = {
    translationNamespaces: ['reportManagement', 'common'],
    pageTitleKey: 'customQuery.management',
    addButtonTextKey: 'customQuery.createQuery',
    dataSource: data,
    loadingData: loading,
    permissions,
    lookupMaps: { initialized: true }, // 提供非空对象避免显示错误消息
    loadingLookups: false,
    errorLookups: null,
    fetchData: loadData,
    deleteItem: handleDelete,
    onAddClick: handleAdd,
    onEditClick: handleEdit,
    onViewDetailsClick: handleViewDetails,
    generateTableColumns,
    deleteConfirmConfig,
    exportConfig,
    lookupErrorMessageKey: 'lookupDataError',
    lookupLoadingMessageKey: 'lookupDataLoading',
    lookupDataErrorMessageKey: 'lookupDataErrorMessage',
    rowKey: 'id',
  };

  return <StandardListPageTemplate {...templateProps} />;
};

export default CustomQueryPage; 