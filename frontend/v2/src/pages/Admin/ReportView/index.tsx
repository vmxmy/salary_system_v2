/**
 * 报表视图管理主页面
 * @description 使用StandardListPageTemplate模板的报表视图管理页面
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Space, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import { DatabaseOutlined } from '@ant-design/icons';

import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import { stringSorter, dateSorter } from '../../../components/common/TableUtils';
import TableActionButton from '../../../components/common/TableActionButton';
import ReportViewForm from '../../../components/ReportView/ReportViewForm';
import ReportViewData from '../../../components/ReportView/ReportViewData';
import { reportViewAPI } from '../../../api/reportView';
import type { 
  ReportView, 
  ReportViewListItem, 
  ReportViewCreateForm, 
  ReportViewUpdateForm 
} from '../../../types/reportView';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

// 权限配置
const useReportViewPermissions = () => ({
  canViewList: true,
  canViewDetail: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canExport: true,
});

// 查找数据配置
const getReportViewLookupMaps = (t: (key: string) => string) => ({
  lookupMaps: {
    statusMap: new Map([
      ['draft', t('admin:auto_text_e88d89')],
      ['created', t('admin:auto_text_e5b7b2')],
      ['error', t('admin:auto_text_e99499')],
    ]),
    categoryMap: new Map([
      [t('admin:auto_text_e5b7a5'), t('admin:auto_text_e5b7a5')],
      [t('admin:auto_text_e88083'), t('admin:auto_text_e88083')],
      [t('admin:auto_text_e4baba'), t('admin:auto_text_e4baba')],
    ]),
  },
  loadingLookups: false,
  errorLookups: null,
});

// 表格列配置生成函数
const generateReportViewTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof ReportViewListItem) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (item: ReportViewListItem) => void,
  onDelete: (id: string) => void,
  onViewDetails: (id: string) => void
): ProColumns<ReportViewListItem>[] => {
  return [
    {
      title: t('admin:auto_text_e68aa5'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
      sorter: stringSorter<ReportViewListItem>('name'),
      ...getColumnSearch('name'),
      render: (text: string, record: ReportViewListItem) => (
        <div>
          <Space>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 'bold' }}>{text}</span>
          </Space>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '视图名称',
      dataIndex: 'view_name',
      key: 'view_name',
      width: 150,
      render: (viewName: string) => viewName || '-',
      sorter: stringSorter<ReportViewListItem>('view_name'),
      ...getColumnSearch('view_name'),
    },
    {
      title: t('admin:auto_text_e58886'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => category || '-',
      filters: lookupMaps?.categoryMap ? Array.from(lookupMaps.categoryMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: t('admin:auto_text_e78ab6'),
      dataIndex: 'view_status',
      key: 'view_status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          draft: { color: 'default', text: t('admin:auto_text_e88d89') },
          created: { color: 'success', text: t('admin:auto_text_e5b7b2') },
          error: { color: 'error', text: t('admin:auto_text_e99499') },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: lookupMaps?.statusMap ? Array.from(lookupMaps.statusMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.view_status === value,
    },
    {
      title: t('admin:auto_text_e4bdbf'),
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 100,
      align: 'center',
      render: (count: number) => <span style={{ color: '#666' }}>{count || 0}</span>,
      sorter: (a, b) => (a.usage_count || 0) - (b.usage_count || 0),
    },
    {
      title: t('admin:auto_text_e69c80'),
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
      sorter: dateSorter<ReportViewListItem>('last_used_at'),
    },
    {
      title: t('admin:auto_text_e5889b'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: dateSorter<ReportViewListItem>('created_at'),
    },
    {
      title: t('admin:auto_text_e6938d'),
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: string, record: ReportViewListItem) => (
        <Space size="small">
          {permissions.canViewDetail && (
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(record.id.toString())}
              tooltipTitle={t('admin:auto_text_e69fa5')} 
            />
          )}
          {permissions.canUpdate && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(record)} 
              tooltipTitle={t('admin:auto_text_e7bc96')} 
            />
          )}
          {permissions.canDelete && (
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(record.id.toString())}
              tooltipTitle={t('admin:auto_text_e588a0')} 
            />
          )}
        </Space>
      ),
    },
  ];
};

const ReportViewManagement: React.FC = () => {
  const { t } = useTranslation(['reportView', 'common']);
  const navigate = useNavigate();
  const permissions = useReportViewPermissions();
  const { lookupMaps, loadingLookups, errorLookups } = getReportViewLookupMaps(t);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ReportView | null>(null);
  const [dataSource, setDataSource] = useState<ReportViewListItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // 数据获取函数
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await reportViewAPI.getReportViews({
        page: 1,
        page_size: 1000, // 获取所有数据，由前端分页
      });
      setDataSource(response || []);
    } catch (error: any) {
      message.error(t('admin:auto__error_message__e58aa0'));
      setDataSource([]);
    } finally {
      setLoadingData(false);
    }
  }, [t]);

  // 删除项目函数
  const deleteItem = useCallback(async (id: string) => {
    await reportViewAPI.deleteReportView(Number(id));
  }, []);

  // 事件处理函数
  const handleAddClick = () => {
    setCurrentRecord(null);
    setViewMode('create');
  };

  const handleEditClick = (item: ReportViewListItem) => {
    // 需要获取完整的ReportView数据
    const loadReportView = async () => {
    try {
      setLoading(true);
        const response = await reportViewAPI.getReportView(item.id);
        setCurrentRecord(response);
      setViewMode('edit');
    } catch (error: any) {
      message.error(t('admin:auto__error_message__e58aa0'));
    } finally {
      setLoading(false);
    }
    };
    loadReportView();
  };

  const handleViewDetailsClick = (id: string) => {
    // 需要获取完整的ReportView数据
    const loadReportView = async () => {
    try {
      setLoading(true);
        const response = await reportViewAPI.getReportView(Number(id));
        setCurrentRecord(response);
      setViewMode('view');
    } catch (error: any) {
      message.error(t('admin:auto__error_message__e58aa0'));
    } finally {
      setLoading(false);
    }
    };
    loadReportView();
  };

  // 返回列表
  const handleBack = () => {
    setViewMode('list');
    setCurrentRecord(null);
    fetchData(); // 刷新数据
  };

  // 处理创建提交
  const handleCreateSubmit = async (values: ReportViewCreateForm | ReportViewUpdateForm) => {
    try {
      setLoading(true);
      await reportViewAPI.createReportView(values as ReportViewCreateForm);
      message.success(t('admin:auto_text_e5889b'));
      handleBack();
    } catch (error: any) {
      message.error(t('admin:auto__error_message__e5889b'));
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑提交
  const handleEditSubmit = async (values: ReportViewCreateForm | ReportViewUpdateForm) => {
    if (!currentRecord) return;

    try {
      setLoading(true);
      await reportViewAPI.updateReportView(currentRecord.id, values as ReportViewUpdateForm);
      message.success(t('admin:auto_text_e69bb4'));
      handleBack();
    } catch (error: any) {
      message.error(t('admin:auto__error_message__e69bb4'));
    } finally {
      setLoading(false);
    }
  };

  // 处理同步成功 - 不退出编辑页面
  const handleSyncSuccess = () => {
    // 同步成功后只显示消息，不退出编辑页面
    // 可以选择重新加载当前记录来更新状态
    if (currentRecord?.id) {
      const reloadCurrentRecord = async () => {
        try {
          const response = await reportViewAPI.getReportView(currentRecord.id);
          setCurrentRecord(response);
        } catch (error) {
        }
      };
      reloadCurrentRecord();
    }
  };

  // 渲染内容
  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <StandardListPageTemplate<ReportViewListItem>
            translationNamespaces={['reportView', 'common']}
            pageTitleKey="reportView:title"
            addButtonTextKey="reportView:list.create_button"
            dataSource={dataSource}
            loadingData={loadingData}
            permissions={permissions}
            lookupMaps={lookupMaps}
            loadingLookups={loadingLookups}
            errorLookups={errorLookups}
            fetchData={fetchData}
            deleteItem={deleteItem}
            onAddClick={handleAddClick}
            onEditClick={handleEditClick}
            onViewDetailsClick={handleViewDetailsClick}
            generateTableColumns={generateReportViewTableColumns}
            deleteConfirmConfig={{
              titleKey: t('admin:auto_text_e7a1ae'),
              contentKey: t('admin:auto___e7a1ae'),
              okTextKey: 'common:button.confirm',
              cancelTextKey: 'common:button.cancel',
              successMessageKey: 'reportView:messages.delete_success',
              errorMessageKey: t('admin:auto_text_e588a0'),
            }}
            batchDeleteConfig={{
              enabled: true,
              buttonText: t('admin:auto_text_e689b9'),
              confirmTitle: t('admin:auto_text_e7a1ae'),
              confirmContent: t('admin:auto___e7a1ae'),
              confirmOkText: t('admin:auto_text_e7a1ae'),
              confirmCancelText: t('admin:auto_text_e58f96'),
              successMessage: t('admin:auto_text_e689b9'),
              errorMessage: t('admin:auto_text_e689b9'),
              noSelectionMessage: t('admin:auto_text_e8afb7'),
              onBatchDelete: async (keys: React.Key[]) => {
                await Promise.all(keys.map(key => reportViewAPI.deleteReportView(Number(key))));
                fetchData();
              },
            }}
            exportConfig={{
              filenamePrefix: t('admin:auto_text_e68aa5'),
              sheetName: t('admin:auto_text_e68aa5'),
              buttonText: t('admin:auto_text_e5afbc'),
              successMessage: t('admin:auto_text_e5afbc'),
            }}
            lookupErrorMessageKey={t('admin:auto_text_e69fa5')}
            lookupLoadingMessageKey={t('admin:auto___e58aa0')}
            lookupDataErrorMessageKey={t('admin:auto_text_e69fa5')}
            rowKey="id"
          />
        );

      case 'create':
        return (
          <ReportViewForm
            mode="create"
            onSubmit={handleCreateSubmit}
            onCancel={handleBack}
            loading={loading}
          />
        );

      case 'edit':
        return (
          <ReportViewForm
            mode="edit"
            initialValues={currentRecord || undefined}
            onSubmit={handleEditSubmit}
            onCancel={handleBack}
            onSyncSuccess={handleSyncSuccess}
            loading={loading}
          />
        );

      case 'view':
        if (loading) {
          return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div>正在加载报表详情...</div>
            </div>
          );
        }
        
        if (!currentRecord) {
          return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div>未找到报表数据</div>
              <button onClick={handleBack} style={{ marginTop: '16px' }}>
                返回列表
              </button>
            </div>
          );
        }
        
        return (
          <ReportViewData
            reportView={currentRecord}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {renderContent()}
    </div>
  );
};

export default ReportViewManagement; 