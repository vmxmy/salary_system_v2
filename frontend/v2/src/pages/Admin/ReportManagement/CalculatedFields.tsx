import React, { useState, useEffect, useCallback } from 'react';
import { message, Tag, Space, Button, Tooltip, Badge } from 'antd';
import { 
  FunctionOutlined, 
  CheckCircleOutlined, 
  StopOutlined,
  GlobalOutlined,
  LockOutlined,
  CopyOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { StandardListPageTemplateProps } from '../../../components/common/StandardListPageTemplate';

// 计算字段数据类型
interface CalculatedField {
  id: string;
  name: string;
  alias: string;
  description?: string;
  formula: string;
  return_type: string;
  category: string;
  is_global: boolean;
  is_active: boolean;
  creator_name: string;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

const CalculatedFields: React.FC = () => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [data, setData] = useState<CalculatedField[]>([]);
  const [loading, setLoading] = useState(false);

  // 模拟数据加载
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: CalculatedField[] = [
        {
          id: '1',
          name: '实发工资',
          alias: 'net_salary',
          description: '扣除社保公积金后的实际发放工资',
          formula: 'base_salary + allowance - social_security - housing_fund',
          return_type: 'decimal',
          category: '薪资计算',
          is_global: true,
          is_active: true,
          creator_name: 'admin',
          usage_count: 156,
          last_used_at: '2024-01-20 14:30:00',
          created_at: '2024-01-10 09:00:00',
          updated_at: '2024-01-15 14:30:00',
        },
        {
          id: '2',
          name: '工龄系数',
          alias: 'seniority_factor',
          description: '根据工龄计算的系数',
          formula: 'CASE WHEN years_of_service < 1 THEN 1.0 WHEN years_of_service < 3 THEN 1.1 ELSE 1.2 END',
          return_type: 'decimal',
          category: '人事计算',
          is_global: false,
          is_active: true,
          creator_name: 'hr_manager',
          usage_count: 89,
          last_used_at: '2024-01-19 16:45:00',
          created_at: '2024-01-08 16:20:00',
          updated_at: '2024-01-12 11:45:00',
        },
        {
          id: '3',
          name: '绩效奖金',
          alias: 'performance_bonus',
          description: '基于绩效评分计算的奖金',
          formula: 'base_salary * performance_score * 0.1',
          return_type: 'decimal',
          category: '薪资计算',
          is_global: true,
          is_active: false,
          creator_name: 'finance_manager',
          usage_count: 34,
          last_used_at: '2024-01-15 11:20:00',
          created_at: '2024-01-05 10:15:00',
          updated_at: '2024-01-12 09:45:00',
        },
        {
          id: '4',
          name: '年假天数',
          alias: 'annual_leave_days',
          description: '根据工龄计算的年假天数',
          formula: 'CASE WHEN years_of_service < 1 THEN 5 WHEN years_of_service < 10 THEN 5 + years_of_service ELSE 15 END',
          return_type: 'integer',
          category: '人事计算',
          is_global: true,
          is_active: true,
          creator_name: 'hr_admin',
          usage_count: 67,
          last_used_at: '2024-01-18 13:25:00',
          created_at: '2024-01-12 16:30:00',
          updated_at: '2024-01-18 14:10:00',
        },
        {
          id: '5',
          name: '税前总收入',
          alias: 'gross_income',
          description: '所有收入项目的总和',
          formula: 'base_salary + allowance + bonus + overtime_pay',
          return_type: 'decimal',
          category: '财务计算',
          is_global: true,
          is_active: true,
          creator_name: 'analyst',
          usage_count: 203,
          last_used_at: '2024-01-20 09:15:00',
          created_at: '2024-01-15 11:00:00',
          updated_at: '2024-01-20 10:15:00',
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

  // 删除计算字段
  const deleteItem = useCallback(async (id: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      throw new Error(t('deleteCalculatedFieldFailed'));
    }
  }, [t]);

  // 处理新增
  const handleAdd = () => {
    message.info(t('addCalculatedField'));
    // 这里可以打开新增对话框或跳转到新增页面
  };

  // 处理编辑
  const handleEdit = (item: CalculatedField) => {
    message.info(t('editCalculatedField'));
    // 这里可以打开编辑对话框或跳转到编辑页面
  };

  // 处理查看详情
  const handleViewDetails = (id: string) => {
    const item = data.find(d => d.id === id);
    message.info(t('viewCalculatedFieldDetails'));
    // 这里可以打开详情对话框或跳转到详情页面
  };

  // 复制计算字段
  const handleCopy = (item: CalculatedField) => {
    message.success(t('copyCalculatedField'));
  };

  // 测试计算字段
  const handleTest = (item: CalculatedField) => {
    message.loading(t('testingCalculatedField'), 2);
    setTimeout(() => {
      message.success(t('testCalculatedFieldSuccess'));
    }, 2000);
  };

  // 切换启用状态
  const handleToggleStatus = (item: CalculatedField) => {
    const newStatus = !item.is_active;
    setData(prev => prev.map(d => 
      d.id === item.id ? { ...d, is_active: newStatus } : d
    ));
    message.success(newStatus ? t('calculatedFieldEnabled') : t('calculatedFieldDisabled'));
  };

  // 切换全局状态
  const handleToggleGlobal = (item: CalculatedField) => {
    const newGlobalStatus = !item.is_global;
    setData(prev => prev.map(d => 
      d.id === item.id ? { ...d, is_global: newGlobalStatus } : d
    ));
    message.success(newGlobalStatus ? t('calculatedFieldMadeGlobal') : t('calculatedFieldMadeLocal'));
  };

  // 生成表格列配置
  const generateTableColumns = useCallback((
    t: (key: string) => string,
    getColumnSearch: (dataIndex: keyof CalculatedField) => any,
    lookupMaps: any,
    permissions: {
      canViewDetail: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    },
    onEdit: (item: CalculatedField) => void,
    onDelete: (id: string) => void,
    onViewDetails: (id: string) => void
  ): ProColumns<CalculatedField>[] => {
    return [
      {
        title: t('fieldName'),
        dataIndex: 'name',
        key: 'name',
        width: 200,
        fixed: 'left',
        ...getColumnSearch('name'),
        render: (text: string, record: CalculatedField) => (
          <Space direction="vertical" size={0}>
            <Space>
              <FunctionOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 500 }}>{text}</span>
              {!record.is_active && <Badge status="default" text="停用" />}
            </Space>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {record.alias}
            </span>
            {record.description && (
              <span style={{ fontSize: '12px', color: '#999' }}>
                {record.description}
              </span>
            )}
          </Space>
        ),
      },
      {
        title: t('formula'),
        dataIndex: 'formula',
        key: 'formula',
        width: 300,
        ellipsis: {
          showTitle: false,
        },
        render: (formula: string) => (
          <Tooltip title={formula} placement="topLeft">
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '12px',
              backgroundColor: '#f5f5f5',
              padding: '4px 8px',
              borderRadius: '4px',
              maxWidth: '280px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <CodeOutlined style={{ marginRight: 4, color: '#666' }} />
              {formula}
            </div>
          </Tooltip>
        ),
      },
      {
        title: t('returnType'),
        dataIndex: 'return_type',
        key: 'return_type',
        width: 100,
        align: 'center',
        filters: [
          { text: '字符串', value: 'string' },
          { text: '整数', value: 'integer' },
          { text: '小数', value: 'decimal' },
          { text: '日期', value: 'date' },
          { text: '布尔值', value: 'boolean' },
        ],
        onFilter: (value: any, record: CalculatedField) => record.return_type === value,
        render: (type: string) => {
          const colorMap: Record<string, string> = {
            'string': 'blue',
            'integer': 'green',
            'decimal': 'orange',
            'date': 'purple',
            'boolean': 'red',
          };
          const labelMap: Record<string, string> = {
            'string': '字符串',
            'integer': '整数',
            'decimal': '小数',
            'date': '日期',
            'boolean': '布尔值',
          };
          return <Tag color={colorMap[type] || 'default'}>{labelMap[type] || type}</Tag>;
        },
      },
      {
        title: t('category'),
        dataIndex: 'category',
        key: 'category',
        width: 120,
        filters: [
          { text: '薪资计算', value: '薪资计算' },
          { text: '人事计算', value: '人事计算' },
          { text: '财务计算', value: '财务计算' },
          { text: '统计分析', value: '统计分析' },
        ],
        onFilter: (value: any, record: CalculatedField) => record.category === value,
        render: (category: string) => {
          const colorMap: Record<string, string> = {
            '薪资计算': 'blue',
            '人事计算': 'orange',
            '财务计算': 'green',
            '统计分析': 'purple',
          };
          return <Tag color={colorMap[category] || 'default'}>{category}</Tag>;
        },
      },
      {
        title: t('usageStats'),
        key: 'usage_stats',
        width: 140,
        render: (_, record: CalculatedField) => (
          <Space direction="vertical" size={0}>
            <span style={{ fontSize: '12px', color: '#666' }}>
              使用次数: <strong>{record.usage_count}</strong>
            </span>
            {record.last_used_at && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                最后使用: {new Date(record.last_used_at).toLocaleDateString()}
              </span>
            )}
          </Space>
        ),
      },
      {
        title: t('scope'),
        dataIndex: 'is_global',
        key: 'is_global',
        width: 100,
        align: 'center',
        filters: [
          { text: t('global'), value: true },
          { text: t('local'), value: false },
        ],
        onFilter: (value: any, record: CalculatedField) => record.is_global === value,
        render: (isGlobal: boolean, record: CalculatedField) => (
          <Button
            type="text"
            size="small"
            icon={isGlobal ? <GlobalOutlined /> : <LockOutlined />}
            style={{ 
              color: isGlobal ? '#52c41a' : '#faad14',
              border: 'none',
              padding: 0
            }}
            onClick={() => handleToggleGlobal(record)}
          >
            {isGlobal ? t('global') : t('local')}
          </Button>
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
        onFilter: (value: any, record: CalculatedField) => record.is_active === value,
        render: (isActive: boolean, record: CalculatedField) => (
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
        title: t('updatedAt'),
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 160,
        sorter: (a: CalculatedField, b: CalculatedField) => 
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
        render: (date: string) => new Date(date).toLocaleString(),
      },
      {
        title: t('actions'),
        key: 'action',
        fixed: 'right',
        width: 220,
        render: (_, record: CalculatedField) => (
          <Space size="small">
            <Tooltip title={t('testCalculatedField')}>
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleTest(record)}
                disabled={!record.is_active}
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
  }, [handleCopy, handleTest, handleToggleStatus, handleToggleGlobal]);

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
    titleKey: 'confirmDeleteCalculatedField',
    contentKey: 'confirmDeleteCalculatedFieldContent',
    okTextKey: 'delete',
    cancelTextKey: 'cancel',
    successMessageKey: 'deleteCalculatedFieldSuccess',
    errorMessageKey: 'deleteCalculatedFieldFailed',
  };

  // 导出配置
  const exportConfig = {
    filenamePrefix: 'calculated_fields',
    sheetName: 'CalculatedFields',
    buttonText: t('export'),
    successMessage: t('exportSuccess'),
  };

  const templateProps: StandardListPageTemplateProps<CalculatedField> = {
    translationNamespaces: ['reportManagement', 'common'],
    pageTitleKey: 'calculatedFieldManagement',
    addButtonTextKey: 'addCalculatedField',
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

export default CalculatedFields;