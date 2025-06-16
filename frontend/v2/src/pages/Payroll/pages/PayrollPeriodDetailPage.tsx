import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Spin, Alert, Descriptions, Divider, Space, Button, Tag, Tooltip, App } from 'antd';
import { ArrowLeftOutlined, DatabaseOutlined, FileAddOutlined, CalculatorOutlined, CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { ProColumns } from '@ant-design/pro-components';

import { getPayrollPeriodById, getPayrollEntries, deletePayrollEntry } from '../services/payrollApi';
import { getTableColumnsConfig, saveTableColumnsConfig, type TableColumnConfig } from '../../../services/tableConfigApi';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';

// 查询参数接口
interface QueryParams {
  filters?: Record<string, any>;
  sorting?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  search?: string;
  page?: number;
  page_size?: number;
}
import type { PayrollPeriod, PayrollEntry } from '../types/payrollTypes';
import { getPayrollEntryStatusInfo } from '../utils/payrollUtils';
import StatusTag from '../../../components/common/StatusTag';
import TableActionButton from '../../../components/common/TableActionButton';
import { stringSorter, numberSorter, dateSorter, useTableSearch } from '../../../components/common/TableUtils';
// import PayrollRunFormModal from '../components/PayrollRunFormModal';

const { Title, Paragraph } = Typography;

const PayrollPeriodDetailPage: React.FC = () => {
  const { t } = useTranslation(['payroll_periods', 'payroll_runs', 'payroll', 'common']);
  const { periodId } = useParams<{ periodId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { lookupMaps, loadingLookups, errorLookups } = useLookupMaps();

  // 状态管理
  const [payrollEntriesData, setPayrollEntriesData] = useState<PayrollEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 表单模态框状态
  const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<PayrollEntry | null>(null);

  // 表格列配置状态
  const [tableColumnsConfig, setTableColumnsConfig] = useState<TableColumnConfig[]>([]);
  const [loadingColumnsConfig, setLoadingColumnsConfig] = useState<boolean>(false);

  // 获取薪资周期详情
  const { data: payrollPeriodResponse, isLoading: loadingPeriod, isError, error } = useQuery({
    queryKey: ['payrollPeriod', periodId],
    queryFn: async () => {
      console.log('🔍 Fetching payroll period details for ID:', periodId);
      if (!periodId || isNaN(Number(periodId))) {
        throw new Error(`Invalid period ID: ${periodId}`);
      }
      try {
        const result = await getPayrollPeriodById(Number(periodId));
        console.log('✅ Payroll period data fetched successfully:', result);
        return result;
      } catch (error: any) {
        console.error('❌ Failed to fetch payroll period:', error);
        if (error.response?.status === 404) {
          throw new Error(`薪资周期 ID ${periodId} 不存在`);
        } else if (error.response?.status === 403) {
          throw new Error('没有权限查看该薪资周期详情');
        } else if (error.response?.data?.detail?.error?.details) {
          throw new Error(error.response.data.detail.error.details);
        }
        throw error;
      }
    },
    enabled: !!periodId && !isNaN(Number(periodId)),
    retry: (failureCount, error: any) => {
      // 对于404或403错误，不重试
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const payrollPeriod = payrollPeriodResponse?.data;

  // 权限配置
  const permissions = useMemo(() => ({
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  }), []);

  // 获取表格列配置
  const fetchTableColumnsConfig = useCallback(async () => {
    setLoadingColumnsConfig(true);
    try {
      const config = await getTableColumnsConfig('payroll_entries');
      setTableColumnsConfig(config.columns);
    } catch (error) {
      console.error('Failed to fetch table columns config:', error);
      // 如果获取配置失败，使用默认配置
      setTableColumnsConfig([]);
    } finally {
      setLoadingColumnsConfig(false);
    }
  }, []);

  // 获取薪资条目数据
  const fetchPayrollEntries = useCallback(async (params?: QueryParams) => {
    if (!periodId) return;
    console.log('🔍 Fetching payroll entries for period:', periodId, 'with params:', params);
    setLoadingEntries(true);
    try {
      const response = await getPayrollEntries({
        period_id: Number(periodId),
        page: params?.page || 1,
        size: params?.page_size || 50,
        sort_by: params?.sorting?.[0]?.field,
        sort_order: params?.sorting?.[0]?.direction,
        include_employee_details: true, // 确保包含员工详情
      });
      console.log('✅ Payroll entries fetched successfully:', response);
      setPayrollEntriesData(response.data || []);
      setTotalEntries(response.meta?.total || 0);
    } catch (error: any) {
      console.error('❌ Failed to fetch payroll entries:', error);
      if (error.response?.data?.detail?.error?.details) {
        message.error(`获取薪资条目失败：${error.response.data.detail.error.details}`);
      } else {
        message.error('获取薪资条目失败，请重试');
      }
      setPayrollEntriesData([]);
      setTotalEntries(0);
    } finally {
      setLoadingEntries(false);
    }
  }, [periodId, message]);

  // 在组件加载时获取表格列配置
  useEffect(() => {
    fetchTableColumnsConfig();
  }, [fetchTableColumnsConfig]);

  // 处理删除薪资条目
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    try {
      await deletePayrollEntry(Number(entryId));
      message.success(t('payroll_entries:delete_success'));
      fetchPayrollEntries();
    } catch (error: any) {
      console.error('Delete entry error:', error);
      let errorMessage = t('payroll_entries:delete_failure');
      
      if (error?.response?.data?.detail?.error?.details) {
        errorMessage = error.response.data.detail.error.details;
      } else if (error?.response?.status === 409) {
        errorMessage = '无法删除该薪资条目，因为它包含关联数据。';
      } else if (error?.response?.status === 500 && error?.response?.data?.detail?.error?.details) {
        // 处理外键约束错误
        const details = error.response.data.detail.error.details;
        if (details.includes('foreign key constraint') || details.includes('violates')) {
          errorMessage = '无法删除该薪资条目，因为它包含关联的数据记录。请先删除相关记录。';
        } else {
          errorMessage = details;
        }
      }
      
      message.error(errorMessage);
      throw error;
    }
  }, [message, t, fetchPayrollEntries]);

  // 处理批量删除薪资条目
  const handleBatchDeleteEntries = useCallback(async (selectedKeys: React.Key[]) => {
    try {
      const deletePromises = selectedKeys.map(key => deletePayrollEntry(Number(key)));
      await Promise.all(deletePromises);
      message.success(t('payroll_entries:delete_success'));
      setSelectedRowKeys([]);
      fetchPayrollEntries();
    } catch (error: any) {
      console.error('Batch delete entries error:', error);
      let errorMessage = t('payroll_entries:delete_failure');
      
      if (error?.response?.data?.detail?.error?.details) {
        const details = error.response.data.detail.error.details;
        if (details.includes('foreign key constraint') || details.includes('violates')) {
          errorMessage = '批量删除失败，部分薪资条目包含关联的数据记录。请先删除相关记录。';
        } else {
          errorMessage = `批量删除失败：${details}`;
        }
      }
      
      message.error(errorMessage);
      throw error;
    }
  }, [message, t, fetchPayrollEntries]);

  // 处理新增薪资条目
  const handleAddEntry = useCallback(() => {
    setCurrentEntry(null);
    setIsEntryModalVisible(true);
  }, []);

  // 处理编辑薪资条目
  const handleEditEntry = useCallback((entry: PayrollEntry) => {
    setCurrentEntry(entry);
    setIsEntryModalVisible(true);
  }, []);

  // 处理查看薪资条目详情
  const handleViewEntryDetails = useCallback((entryId: string) => {
    navigate(`/finance/payroll/entries/${entryId}`);
  }, [navigate]);

  // 返回薪资周期列表
  const handleBackToList = useCallback(() => {
    navigate('/finance/payroll/periods');
  }, [navigate]);

  // 生成薪资条目表格列配置（动态版本）
  const generatePayrollEntryTableColumns = useCallback((
    t: (key: string) => string,
    getColumnSearch: (dataIndex: keyof PayrollEntry) => any,
    lookupMaps: any,
    permissions: {
      canViewDetail?: boolean;
      canUpdate?: boolean;
      canDelete?: boolean;
    } = {},
    onEdit: (entry: PayrollEntry) => void,
    onDelete: (entryId: string) => void,
    onViewDetails: (entryId: string) => void
  ): ProColumns<PayrollEntry>[] => {
    // 如果有动态配置，使用动态配置
    if (tableColumnsConfig.length > 0) {
      return tableColumnsConfig.map((colConfig) => {
        const baseColumn: ProColumns<PayrollEntry> = {
          title: t(colConfig.title),
          dataIndex: colConfig.dataIndex as keyof PayrollEntry,
          key: colConfig.key,
          width: colConfig.width,
          sorter: colConfig.sorter,
          search: colConfig.search,
          fixed: colConfig.fixed,
        };

        // 根据 valueType 添加特定的渲染逻辑
        if (colConfig.valueType === 'money') {
          return {
            ...baseColumn,
            align: colConfig.align as 'left' | 'center' | 'right' || 'right',
            render: (_, record, index) => {
              const value = record[colConfig.dataIndex as keyof PayrollEntry];
              const amount = Number(value) || 0;
              if (colConfig.key === 'net_pay') {
                return (
                  <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                    ¥{amount.toFixed(2)}
                  </span>
                );
              }
              return `¥${amount.toFixed(2)}`;
            },
            search: false,
          };
        } else if (colConfig.valueType === 'digit') {
          return {
            ...baseColumn,
            sorter: colConfig.sorter ? (a: PayrollEntry, b: PayrollEntry) => {
              const aVal = Number(a[colConfig.dataIndex as keyof PayrollEntry]) || 0;
              const bVal = Number(b[colConfig.dataIndex as keyof PayrollEntry]) || 0;
              return aVal - bVal;
            } : false,
            search: false,
          };
        } else if (colConfig.valueType === 'select' && colConfig.key === 'status') {
          return {
            ...baseColumn,
            render: (_, record, index) => {
              const statusInfo = getPayrollEntryStatusInfo(record.status_lookup_value_id);
              return <StatusTag status={statusInfo.type} text={t(`payroll:${statusInfo.key}`)} />;
            },
          };
        } else if (colConfig.valueType === 'option' && colConfig.key === 'action') {
          return {
            ...baseColumn,
            render: (_, record, index) => (
              <Space size="small">
                {permissions.canViewDetail && (
                  <TableActionButton 
                    actionType="view" 
                    onClick={() => onViewDetails(String(record.id))} 
                    tooltipTitle={t('common:action.view')} 
                  />
                )}
                {permissions.canUpdate && (
                  <TableActionButton 
                    actionType="edit" 
                    onClick={() => onEdit(record)} 
                    tooltipTitle={t('common:action.edit')} 
                  />
                )}
                {permissions.canDelete && (
                  <TableActionButton 
                    actionType="delete" 
                    danger 
                    onClick={() => onDelete(String(record.id))} 
                    tooltipTitle={t('common:action.delete')} 
                  />
                )}
              </Space>
            ),
          };
        } else if (colConfig.valueType === 'text') {
          return {
            ...baseColumn,
            render: (_, record, index) => {
              const value = record[colConfig.dataIndex as keyof PayrollEntry];
              if (colConfig.key === 'employee_name') {
                return String(value || record.employee?.first_name + ' ' + record.employee?.last_name || '-');
              }
              return String(value || '-');
            },
            search: colConfig.search,
          };
        } else {
          // 默认文本渲染
          return {
            ...baseColumn,
            render: (_, record, index) => {
              const value = record[colConfig.dataIndex as keyof PayrollEntry];
              return String(value || '-');
            },
          };
        }
      });
    }

    // 如果没有动态配置，返回空数组或基本列配置
    console.warn('No dynamic table configuration found, returning empty columns');
    return [];
  }, [t, tableColumnsConfig]);

  // 删除确认配置
  const deleteConfirmConfig = useMemo(() => ({
    titleKey: 'payroll_entries:confirm_delete_title',
    contentKey: 'payroll_entries:confirm_delete_content',
    okTextKey: 'common:delete',
    cancelTextKey: 'common:cancel',
    successMessageKey: 'payroll_entries:delete_success',
    errorMessageKey: 'payroll_entries:delete_failure',
  }), []);

  // 导出配置
  const exportConfig = useMemo(() => ({
    filenamePrefix: t('payroll_entries:export_filename_prefix'),
    sheetName: t('payroll_entries:export_sheet_name'),
    buttonText: t('payroll_entries:export_button_text'),
    successMessage: t('payroll_entries:export_success_message'),
  }), [t]);

  // 批量删除配置
  const batchDeleteConfig = useMemo(() => ({
    enabled: true,
    buttonText: t('common:batch_delete'),
    confirmTitle: t('payroll_entries:confirm_delete_title'),
    confirmContent: t('common:message.confirm_batch_delete'),
    confirmOkText: t('common:delete'),
    confirmCancelText: t('common:cancel'),
    successMessage: t('payroll_entries:delete_success'),
    errorMessage: t('payroll_entries:delete_failure'),
    noSelectionMessage: t('common:message.no_selection'),
    onBatchDelete: handleBatchDeleteEntries,
  }), [t, handleBatchDeleteEntries]);

  // 条件渲染检查
  if (!periodId) {
    return <Alert message={t('common:message.invalid_id')} type="error" showIcon />;
  }

  if (loadingPeriod) {
    return <Spin size="large" tip={t('common:loading.loading_details')} />;
  }

  if (isError) {
    return <Alert message={`${t('common:message.error_fetching_details')}: ${(error as any).message}`} type="error" showIcon />;
  }

  if (!payrollPeriod) {
    return <Alert message={t('common:message.not_found')} type="warning" showIcon />;
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面头部 */}
      <Space style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBackToList}
        >
          {t('common:button.back')}
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          {t('payroll_periods:payroll_period_detail_page.title', { id: payrollPeriod?.id || '' })}
        </Title>
      </Space>

      {/* 薪资周期基本信息 */}
              <Card variant="outlined" style={{ marginBottom: 20 }}>
        <Descriptions title={t('payroll_periods:payroll_period_detail_page.basic_info')} bordered column={2}>
          <Descriptions.Item label={t('payroll_periods:payroll_period_detail_page.field_id')}>
            {payrollPeriod?.id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_periods:payroll_period_detail_page.field_name')}>
            {payrollPeriod?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_periods:payroll_period_detail_page.field_frequency')}>
            {payrollPeriod?.frequency_lookup_value_id ? (lookupMaps?.payFrequencyMap?.get(payrollPeriod.frequency_lookup_value_id as number) || payrollPeriod.frequency_lookup_value_id) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_periods:payroll_period_detail_page.field_status')}>
            {payrollPeriod?.status_lookup_value_id ? (lookupMaps?.statusMap?.get(payrollPeriod.status_lookup_value_id as number) || payrollPeriod.status_lookup_value_id) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_periods:payroll_period_detail_page.field_start_date')}>
            {payrollPeriod?.start_date ? format(new Date(payrollPeriod.start_date), 'yyyy-MM-dd') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_periods:payroll_period_detail_page.field_end_date')}>
            {payrollPeriod?.end_date ? format(new Date(payrollPeriod.end_date), 'yyyy-MM-dd') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_periods:payroll_period_detail_page.field_pay_date')}>
            {payrollPeriod?.pay_date ? format(new Date(payrollPeriod.pay_date), 'yyyy-MM-dd') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_periods:table.column_employee_count')}>
            {(payrollPeriod as any)?.employee_count || 0}人
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      {/* 关联的薪资条目列表 */}
      <Title level={4} style={{ marginBottom: 16 }}>
        {t('payroll_periods:payroll_period_detail_page.related_entries_title')}
      </Title>
      
      <StandardListPageTemplate<PayrollEntry>
        translationNamespaces={['payroll_entries', 'payroll', 'common']}
        pageTitleKey=""
        addButtonTextKey="payroll_entries:create_entry"
        dataSource={payrollEntriesData}
        loadingData={loadingEntries}
        permissions={permissions}
        lookupMaps={lookupMaps}
        loadingLookups={loadingLookups}
        errorLookups={errorLookups}
        fetchData={fetchPayrollEntries}
        deleteItem={handleDeleteEntry}
        onAddClick={handleAddEntry}
        onEditClick={handleEditEntry}
        onViewDetailsClick={handleViewEntryDetails}
        generateTableColumns={generatePayrollEntryTableColumns}
        deleteConfirmConfig={deleteConfirmConfig}
        batchDeleteConfig={batchDeleteConfig}
        exportConfig={exportConfig}
        lookupErrorMessageKey="common:message.data_loading_error"
        lookupLoadingMessageKey="common:loading.generic_loading_text"
        lookupDataErrorMessageKey="common:message.data_loading_error"
        rowKey="id"
        total={totalEntries}
        serverSidePagination={true}
        serverSideSorting={true}
        serverSideFiltering={false}
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
      />

      {/* TODO: 添加薪资审核表单模态框 */}
    </div>
  );
};

export default PayrollPeriodDetailPage; 