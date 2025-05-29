import React, { useState, useEffect, useCallback } from 'react';
import { message, Tag, Space, Button, Tooltip, Badge } from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  StopOutlined,
  GlobalOutlined,
  LockOutlined,
  CopyOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { StandardListPageTemplateProps } from '../../../components/common/StandardListPageTemplate';

// 报表模板数据类型
interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  is_public: boolean;
  creator_name: string;
  field_count: number;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

const ReportTemplates: React.FC = () => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [data, setData] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // 模拟数据加载
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: ReportTemplate[] = [
        {
          id: '1',
          name: '员工薪资详细报表',
          description: '包含员工基本信息和薪资详细构成的综合报表',
          category: '薪资管理',
          is_active: true,
          is_public: false,
          creator_name: 'admin',
          field_count: 15,
          usage_count: 245,
          last_used_at: '2024-01-20 14:30:00',
          created_at: '2024-01-10 09:00:00',
          updated_at: '2024-01-15 10:30:00',
        },
        {
          id: '2', 
          name: '部门费用汇总表',
          description: '各部门月度费用支出统计汇总',
          category: '财务管理',
          is_active: true,
          is_public: true,
          creator_name: 'finance_manager',
          field_count: 10,
          usage_count: 89,
          last_used_at: '2024-01-19 16:45:00',
          created_at: '2024-01-08 14:20:00',
          updated_at: '2024-01-14 15:20:00',
        },
        {
          id: '3',
          name: '员工绩效考核表',
          description: '季度员工绩效评估报表',
          category: '人事管理',
          is_active: false,
          is_public: false,
          creator_name: 'hr_admin',
          field_count: 18,
          usage_count: 34,
          last_used_at: '2024-01-15 11:20:00',
          created_at: '2024-01-05 10:15:00',
          updated_at: '2024-01-12 09:45:00',
        },
        {
          id: '4',
          name: '考勤统计分析表',
          description: '员工考勤数据统计与分析',
          category: '人事管理',
          is_active: true,
          is_public: true,
          creator_name: 'hr_manager',
          field_count: 12,
          usage_count: 156,
          last_used_at: '2024-01-20 09:15:00',
          created_at: '2024-01-12 16:30:00',
          updated_at: '2024-01-18 14:10:00',
        },
        {
          id: '5',
          name: '年度薪资趋势分析',
          description: '年度薪资水平变化趋势统计',
          category: '统计分析',
          is_active: true,
          is_public: false,
          creator_name: 'analyst',
          field_count: 8,
          usage_count: 67,
          last_used_at: '2024-01-18 13:25:00',
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

  // 删除报表模板
  const deleteItem = useCallback(async (id: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      throw new Error(t('deleteTemplateFailed'));
    }
  }, [t]);

  // 处理新增
  const handleAdd = () => {
    message.info(t('addReportTemplate'));
    // 这里可以打开新增对话框或跳转到新增页面
  };

  // 处理编辑
  const handleEdit = (item: ReportTemplate) => {
    message.info(t('editReportTemplate'));
    // 这里可以打开编辑对话框或跳转到编辑页面
  };

  // 处理查看详情
  const handleViewDetails = (id: string) => {
    const item = data.find(d => d.id === id);
    message.info(t('viewTemplateDetails'));
    // 这里可以打开详情对话框或跳转到详情页面
  };

  // 复制报表模板
  const handleCopy = (item: ReportTemplate) => {
    message.success(t('copyTemplate'));
  };

  // 分享报表模板
  const handleShare = (item: ReportTemplate) => {
    message.info(t('shareTemplate'));
  };

  // 运行报表
  const handleRunReport = (item: ReportTemplate) => {
    message.loading(t('runningReport'), 2);
    setTimeout(() => {
      message.success(t('reportRunSuccess'));
    }, 2000);
  };

  // 切换启用状态
  const handleToggleStatus = (item: ReportTemplate) => {
    const newStatus = !item.is_active;
    setData(prev => prev.map(d => 
      d.id === item.id ? { ...d, is_active: newStatus } : d
    ));
    message.success(newStatus ? t('templateEnabled') : t('templateDisabled'));
  };

  // 切换公开状态
  const handleTogglePublic = (item: ReportTemplate) => {
    const newPublicStatus = !item.is_public;
    setData(prev => prev.map(d => 
      d.id === item.id ? { ...d, is_public: newPublicStatus } : d
    ));
    message.success(newPublicStatus ? t('templateMadePublic') : t('templateMadePrivate'));
  };

  // 生成表格列配置
  const generateTableColumns = useCallback((
    t: (key: string) => string,
    getColumnSearch: (dataIndex: keyof ReportTemplate) => any,
    lookupMaps: any,
    permissions: {
      canViewDetail: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    },
    onEdit: (item: ReportTemplate) => void,
    onDelete: (id: string) => void,
    onViewDetails: (id: string) => void
  ): ProColumns<ReportTemplate>[] => {
    return [
      {
        title: t('templateName'),
        dataIndex: 'name',
        key: 'name',
        width: 220,
        fixed: 'left',
        ...getColumnSearch('name'),
        render: (text: string, record: ReportTemplate) => (
          <Space direction="vertical" size={0}>
            <Space>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 500 }}>{text}</span>
              {!record.is_active && <Badge status="default" text="停用" />}
            </Space>
            {record.description && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                {record.description}
              </span>
            )}
          </Space>
        ),
      },
      {
        title: t('category'),
        dataIndex: 'category',
        key: 'category',
        width: 120,
        filters: [
          { text: '薪资管理', value: '薪资管理' },
          { text: '财务管理', value: '财务管理' },
          { text: '人事管理', value: '人事管理' },
          { text: '统计分析', value: '统计分析' },
        ],
        onFilter: (value: any, record: ReportTemplate) => record.category === value,
        render: (category: string) => {
          const colorMap: Record<string, string> = {
            '薪资管理': 'blue',
            '财务管理': 'green',
            '人事管理': 'orange',
            '统计分析': 'purple',
          };
          return <Tag color={colorMap[category] || 'default'}>{category}</Tag>;
        },
      },
      {
        title: t('fieldCount'),
        dataIndex: 'field_count',
        key: 'field_count',
        width: 100,
        align: 'center',
        sorter: (a: ReportTemplate, b: ReportTemplate) => a.field_count - b.field_count,
        render: (count: number) => (
          <Tag color="cyan">{count}</Tag>
        ),
      },
      {
        title: t('usageStats'),
        key: 'usage_stats',
        width: 140,
        render: (_, record: ReportTemplate) => (
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
        title: t('visibility'),
        dataIndex: 'is_public',
        key: 'is_public',
        width: 100,
        align: 'center',
        filters: [
          { text: t('public'), value: true },
          { text: t('private'), value: false },
        ],
        onFilter: (value: any, record: ReportTemplate) => record.is_public === value,
        render: (isPublic: boolean, record: ReportTemplate) => (
          <Button
            type="text"
            size="small"
            icon={isPublic ? <GlobalOutlined /> : <LockOutlined />}
            style={{ 
              color: isPublic ? '#52c41a' : '#faad14',
              border: 'none',
              padding: 0
            }}
            onClick={() => handleTogglePublic(record)}
          >
            {isPublic ? t('public') : t('private')}
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
        onFilter: (value: any, record: ReportTemplate) => record.is_active === value,
        render: (isActive: boolean, record: ReportTemplate) => (
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
        sorter: (a: ReportTemplate, b: ReportTemplate) => 
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
        render: (date: string) => new Date(date).toLocaleString(),
      },
      {
        title: t('actions'),
        key: 'action',
        fixed: 'right',
        width: 220,
        render: (_, record: ReportTemplate) => (
          <Space size="small">
            <Tooltip title={t('runReport')}>
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleRunReport(record)}
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
            <Tooltip title={t('share')}>
              <Button
                type="text"
                size="small"
                icon={<ShareAltOutlined />}
                onClick={() => handleShare(record)}
                disabled={!record.is_public}
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
  }, [handleCopy, handleShare, handleRunReport, handleToggleStatus, handleTogglePublic]);

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
    titleKey: 'confirmDeleteTemplate',
    contentKey: 'confirmDeleteTemplateContent',
    okTextKey: 'delete',
    cancelTextKey: 'cancel',
    successMessageKey: 'deleteTemplateSuccess',
    errorMessageKey: 'deleteTemplateFailed',
  };

  // 导出配置
  const exportConfig = {
    filenamePrefix: 'report_templates',
    sheetName: 'ReportTemplates',
    buttonText: t('export'),
    successMessage: t('exportSuccess'),
  };

  const templateProps: StandardListPageTemplateProps<ReportTemplate> = {
    translationNamespaces: ['reportManagement', 'common'],
    pageTitleKey: 'reportTemplateManagement',
    addButtonTextKey: 'addReportTemplate',
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

export default ReportTemplates;