import React, { useState, useEffect, useCallback } from 'react';
import { message, Tag, Space, Button, Tooltip } from 'antd';
import { 
  DatabaseOutlined, 
  CheckCircleOutlined, 
  StopOutlined,
  LinkOutlined,
  CopyOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { StandardListPageTemplateProps } from '../../../components/common/StandardListPageTemplate';

// 数据源数据类型
interface DataSource {
  id: string;
  name: string;
  description?: string;
  connection_type: string;
  schema_name: string;
  table_name: string;
  field_count: number;
  is_active: boolean;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

const DataSources: React.FC = () => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [data, setData] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);

  // 模拟数据加载
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: DataSource[] = [
        {
          id: '1',
          name: '员工基础信息表',
          description: '包含员工基本信息的主表',
          connection_type: 'postgresql',
          schema_name: 'hr',
          table_name: 'employees',
          field_count: 15,
          is_active: true,
          creator_name: 'admin',
          created_at: '2024-01-10 09:00:00',
          updated_at: '2024-01-15 14:30:00',
        },
        {
          id: '2',
          name: '薪资发放记录表',
          description: '员工薪资发放的历史记录',
          connection_type: 'postgresql',
          schema_name: 'payroll',
          table_name: 'salary_records',
          field_count: 20,
          is_active: true,
          creator_name: 'hr_manager',
          created_at: '2024-01-08 16:20:00',
          updated_at: '2024-01-12 11:45:00',
        },
        {
          id: '3',
          name: '部门结构表',
          description: '组织架构和部门信息',
          connection_type: 'postgresql',
          schema_name: 'org',
          table_name: 'departments',
          field_count: 8,
          is_active: false,
          creator_name: 'admin',
          created_at: '2024-01-05 10:15:00',
          updated_at: '2024-01-10 09:30:00',
        },
        {
          id: '4',
          name: '考勤记录表',
          description: '员工考勤打卡记录',
          connection_type: 'mysql',
          schema_name: 'attendance',
          table_name: 'attendance_records',
          field_count: 12,
          is_active: true,
          creator_name: 'hr_admin',
          created_at: '2024-01-12 14:20:00',
          updated_at: '2024-01-18 16:45:00',
        },
        {
          id: '5',
          name: '绩效评估表',
          description: '员工绩效考核数据',
          connection_type: 'postgresql',
          schema_name: 'performance',
          table_name: 'evaluations',
          field_count: 18,
          is_active: true,
          creator_name: 'manager',
          created_at: '2024-01-15 11:30:00',
          updated_at: '2024-01-20 09:15:00',
        }
      ];
      
      setData(mockData);
    } catch (error) {
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
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      throw new Error(t('deleteDataSourceFailed'));
    }
  }, [t]);

  // 处理新增
  const handleAdd = () => {
    message.info(t('addDataSource'));
    // 这里可以打开新增对话框或跳转到新增页面
  };

  // 处理编辑
  const handleEdit = (item: DataSource) => {
    message.info(t('editDataSource'));
    // 这里可以打开编辑对话框或跳转到编辑页面
  };

  // 处理查看详情
  const handleViewDetails = (id: string) => {
    const item = data.find(d => d.id === id);
    message.info(t('viewDataSourceDetails'));
    // 这里可以打开详情对话框或跳转到详情页面
  };

  // 测试连接
  const handleTestConnection = (item: DataSource) => {
    message.loading(t('testingConnection'), 2);
    setTimeout(() => {
      message.success(t('connectionTestSuccess'));
    }, 2000);
  };

  // 复制数据源
  const handleCopy = (item: DataSource) => {
    message.success(t('copyDataSource'));
  };

  // 切换启用状态
  const handleToggleStatus = (item: DataSource) => {
    const newStatus = !item.is_active;
    setData(prev => prev.map(d => 
      d.id === item.id ? { ...d, is_active: newStatus } : d
    ));
    message.success(newStatus ? t('dataSourceEnabled') : t('dataSourceDisabled'));
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
            onClick={() => handleToggleStatus(record)}
          >
            {isActive ? t('active') : t('inactive')}
          </Button>
        ),
      },
      {
        title: t('creator'),
        dataIndex: 'creator_name',
        key: 'creator_name',
        width: 120,
        ...getColumnSearch('creator_name'),
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
        width: 200,
        render: (_, record: DataSource) => (
          <Space size="small">
            <Tooltip title={t('testConnection')}>
              <Button
                type="text"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => handleTestConnection(record)}
              />
            </Tooltip>
            <Tooltip title={t('copy')}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(record)}
              />
            </Tooltip>
            {permissions.canViewDetail && (
              <Tooltip title={t('viewDetails')}>
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onViewDetails(record.id)}
                />
              </Tooltip>
            )}
            {permissions.canUpdate && (
              <Tooltip title={t('edit')}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
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
                  onClick={() => onDelete(record.id)}
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ];
  }, [handleTestConnection, handleCopy, handleToggleStatus]);

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
    dataSource: data,
    loadingData: loading,
    permissions,
    lookupMaps: { initialized: true }, // 提供非空对象避免显示错误消息
    loadingLookups: false,
    errorLookups: null,
    fetchData,
    deleteItem,
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

export default DataSources;