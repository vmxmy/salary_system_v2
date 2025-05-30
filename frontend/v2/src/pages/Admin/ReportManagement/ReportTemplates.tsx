import React, { useState, useEffect, useCallback } from 'react';
import { message, Tag, Space, Button, Tooltip, Badge, Card, App, Modal } from 'antd';
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
  PlayCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { StandardListPageTemplateProps } from '../../../components/common/StandardListPageTemplate';
import { useNavigate } from 'react-router-dom';
import { reportTemplateAPI, type ReportTemplate as APIReportTemplate } from '../../../api/reports';

// 报表模板数据类型 - 转换为与StandardListPageTemplate兼容的格式
interface ReportTemplate {
  id: string; // 保持string类型以兼容StandardListPageTemplate
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
  const navigate = useNavigate();

  // 转换API数据格式
  const convertAPIDataToLocal = (apiTemplate: APIReportTemplate): ReportTemplate => ({
    id: apiTemplate.id.toString(),
    name: apiTemplate.name,
    description: apiTemplate.description,
    category: apiTemplate.category || 'custom',
    is_active: apiTemplate.is_active,
    is_public: apiTemplate.is_public,
    creator_name: '未知', // API可能不直接返回创建者名称
    field_count: apiTemplate.fields?.length || 0,
    usage_count: apiTemplate.usage_count || 0,
    last_used_at: apiTemplate.updated_at,
    created_at: apiTemplate.created_at,
    updated_at: apiTemplate.updated_at
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const response = await reportTemplateAPI.getTemplates({
        limit: 100 // 获取所有模板
      });
      
      const convertedData = response.data.map(convertAPIDataToLocal);
      setData(convertedData);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      message.error(`加载报表模板失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await reportTemplateAPI.deleteTemplate(Number(id));
      message.success('删除成功');
      await fetchData(); // 重新加载数据
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      throw new Error(`删除失败: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleRun = async (record: ReportTemplate) => {
    try {
      await reportTemplateAPI.executeTemplate(Number(record.id));
      message.success('报表执行成功');
      navigate(`/admin/reports/viewer?templateId=${record.id}`);
    } catch (error: any) {
      console.error('Failed to execute template:', error);
      message.error(`执行失败: ${error.response?.data?.detail || error.message}`);
    }
  };

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
                onClick={() => handleRun(record)}
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
  }, [handleCopy, handleShare, handleRun, handleToggleStatus, handleTogglePublic]);

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
    title: t('reportTemplates'),
    data,
    loading,
    columns: generateTableColumns(
      t,
      getColumnSearch,
      {},
      permissions,
      handleEdit,
      deleteItem,
      handleViewDetails
    ),
    totalItems: data.length,
    searchConfig: {
      placeholder: t('searchPlaceholder'),
      searchFields: ['name', 'description'],
    },
    filterConfig: {
      filters: [
        {
          key: 'category',
          label: t('category'),
          type: 'select',
          options: [
            { label: '薪资管理', value: '薪资管理' },
            { label: '财务管理', value: '财务管理' },
            { label: '人事管理', value: '人事管理' },
            { label: '统计分析', value: '统计分析' },
          ],
        },
        {
          key: 'is_active',
          label: t('status'),
          type: 'select',
          options: [
            { label: t('active'), value: true },
            { label: t('inactive'), value: false },
          ],
        },
      ],
    },
    addButtonText: t('addReportTemplate'),
    entityNameSingular: t('reportTemplate'),
    entityNamePlural: t('reportTemplates'),
    loadingDataMessageKey: 'loadingData',
    noDataMessageKey: 'noDataMessage',
    loadingLookups: false,
    errorLookups: null,
    fetchData: fetchData,
    deleteItem: deleteItem,
    onAddClick: handleAdd,
    onEditClick: handleEdit,
    onViewDetails: handleViewDetails,
    permissions,
    getColumnSearch,
    lookupMaps: {},
    deleteConfirmMessageKey: 'deleteConfirmMessage',
    deleteSuccessMessageKey: 'deleteSuccessMessage',
    deleteErrorMessageKey: 'deleteErrorMessage',
    lookupDataErrorMessageKey: 'lookupDataErrorMessage',
    rowKey: 'id'
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <StandardListPageTemplate {...templateProps} />;
};

export default ReportTemplates;