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
const useReportViewLookupMaps = () => ({
  lookupMaps: {
    statusMap: new Map([
      ['draft', '草稿'],
      ['created', '已创建'],
      ['error', '错误'],
    ]),
    categoryMap: new Map([
      ['工资报表', '工资报表'],
      ['考勤报表', '考勤报表'],
      ['人事报表', '人事报表'],
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
      title: '报表名称',
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
      title: '分类',
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
      title: '状态',
      dataIndex: 'view_status',
      key: 'view_status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          draft: { color: 'default', text: '草稿' },
          created: { color: 'success', text: '已创建' },
          error: { color: 'error', text: '错误' },
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
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 100,
      align: 'center',
      render: (count: number) => <span style={{ color: '#666' }}>{count || 0}</span>,
      sorter: (a, b) => (a.usage_count || 0) - (b.usage_count || 0),
    },
    {
      title: '最后使用',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
      sorter: dateSorter<ReportViewListItem>('last_used_at'),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: dateSorter<ReportViewListItem>('created_at'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: string, record: ReportViewListItem) => (
        <Space size="small">
          {permissions.canViewDetail && (
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(record.id.toString())} 
              tooltipTitle="查看数据" 
            />
          )}
          {permissions.canUpdate && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(record)} 
              tooltipTitle="编辑" 
            />
          )}
          {permissions.canDelete && (
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(record.id.toString())} 
              tooltipTitle="删除" 
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
  const { lookupMaps, loadingLookups, errorLookups } = useReportViewLookupMaps();

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
      console.error('Failed to fetch report views:', error);
      message.error(`加载报表视图失败: ${error.message}`);
      setDataSource([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

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
      console.error('Failed to load report view:', error);
      message.error(`加载报表视图失败: ${error.message}`);
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
      console.error('Failed to load report view:', error);
      message.error(`加载报表视图失败: ${error.message}`);
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
      message.success('创建成功');
      handleBack();
    } catch (error: any) {
      console.error('Failed to create report view:', error);
      message.error(`创建失败: ${error.message}`);
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
      message.success('更新成功');
      
      // 重新加载当前记录以获取最新状态，不退出编辑页面
      const response = await reportViewAPI.getReportView(currentRecord.id);
      setCurrentRecord(response);
    } catch (error: any) {
      console.error('Failed to update report view:', error);
      message.error(`更新失败: ${error.message}`);
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
          console.error('Failed to reload record after sync:', error);
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
              titleKey: '确认删除',
              contentKey: '确定要删除这个报表视图吗？',
              okTextKey: 'common:button.confirm',
              cancelTextKey: 'common:button.cancel',
              successMessageKey: 'reportView:messages.delete_success',
              errorMessageKey: '删除失败',
            }}
            batchDeleteConfig={{
              enabled: true,
              buttonText: '批量删除',
              confirmTitle: '确认批量删除',
              confirmContent: '确定要删除选中的报表视图吗？',
              confirmOkText: '确定',
              confirmCancelText: '取消',
              successMessage: '批量删除成功',
              errorMessage: '批量删除失败',
              noSelectionMessage: '请先选择要删除的项目',
            }}
            exportConfig={{
              filenamePrefix: '报表视图列表',
              sheetName: '报表视图',
              buttonText: '导出',
              successMessage: '导出成功',
            }}
            lookupErrorMessageKey="查找数据加载失败"
            lookupLoadingMessageKey="加载中..."
            lookupDataErrorMessageKey="查找数据加载失败"
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