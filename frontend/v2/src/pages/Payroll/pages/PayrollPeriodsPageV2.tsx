import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Tooltip, Button, Space, Modal, message, App, Spin, Alert } from 'antd';
import { DatabaseOutlined, LoadingOutlined, FileAddOutlined, PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import StandardListPageTemplate, { QueryParams } from '../../../components/common/StandardListPageTemplate';
import type { PayrollPeriod } from '../types/payrollTypes';
import { 
  getPayrollPeriods, 
  createPayrollPeriod, 
  updatePayrollPeriod, 
  deletePayrollPeriod,
  getPayrollRuns,
  getPayrollEntries
} from '../services/payrollApi';
import { P_PAYROLL_PERIOD_MANAGE } from '../constants/payrollPermissions';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { getPayrollPeriodStatusOptions, type DynamicStatusOption } from '../utils/dynamicStatusUtils';
import { getPayrollPeriodNameTranslation } from '../utils/payrollFormatUtils';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import TableActionButton from '../../../components/common/TableActionButton';
import { stringSorter, numberSorter, dateSorter, useTableSearch } from '../../../components/common/TableUtils';
import StatusTag from '../../../components/common/StatusTag';
import PayrollPeriodFormModal from '../components/PayrollPeriodFormModal';

// 薪资周期权限钩子
const usePayrollPeriodPermissions = () => {
  return useMemo(() => ({
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  }), []);
};

// 生成薪资周期表格列配置的函数
const generatePayrollPeriodTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof PayrollPeriod) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  } = {},
  onEdit: (period: PayrollPeriod) => void,
  onDelete: (periodId: string) => void,
  onViewDetails: (periodId: string) => void,
  statusOptions: DynamicStatusOption[]
): ProColumns<PayrollPeriod>[] => {
  const columns: ProColumns<PayrollPeriod>[] = [
    {
      title: t('payroll_periods_page.table.column_id'),
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      width: 80,
      valueType: 'digit',
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_period_name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      width: 200,
      valueType: 'text',
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>{record.name}</span>
      ),
      ...getColumnSearch('name'),
    },
    {
      title: t('payroll_periods_page.table.column_frequency'),
      dataIndex: 'frequency_lookup_value_id',
      key: 'frequency',
      render: (_, record) => {
        // 使用lookup映射显示频率
        return lookupMaps?.payFrequencyMap?.get(record.frequency_lookup_value_id as number) || '-';
      },
      filters: (() => {
        if (lookupMaps && lookupMaps.payFrequencyMap && lookupMaps.payFrequencyMap instanceof Map) {
          return [...(lookupMaps.payFrequencyMap.entries() || [])]
            .filter(Boolean)
            .map((entry: [number, string]) => ({
              text: entry[1],
              value: entry[0],
            }));
        }
        return [];
      })(),
      onFilter: (value, record) => record.frequency_lookup_value_id === value,
    },
    {
      title: t('payroll_periods_page.table.column_start_date'),
      dataIndex: 'start_date',
      key: 'start_date',
      sorter: (a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime(),
      width: 130,
      valueType: 'date',
      render: (_, record) => record.start_date ? format(new Date(record.start_date), 'yyyy-MM-dd') : '',
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      sorter: (a, b) => new Date(a.end_date || '').getTime() - new Date(b.end_date || '').getTime(),
      width: 130,
      valueType: 'date',
      render: (_, record) => record.end_date ? format(new Date(record.end_date), 'yyyy-MM-dd') : '',
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_pay_date'),
      dataIndex: 'pay_date',
      key: 'pay_date',
      sorter: (a, b) => new Date(a.pay_date || '').getTime() - new Date(b.pay_date || '').getTime(),
      width: 130,
      valueType: 'date',
      render: (_, record) => record.pay_date ? format(new Date(record.pay_date), 'yyyy-MM-dd') : '',
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = statusOptions.find(opt => opt.id === record.status_lookup_value_id);
        if (!status) return '-';
        
        // 根据状态名称确定状态类型
        let statusType: 'active' | 'inactive' | 'pending' = 'active';
        if (status.name.includes(t('payroll_periods:payroll_period_status.closed')) || status.name.includes(t('payroll_periods:payroll_period_status.closed'))) {
          statusType = 'inactive';
        } else if (status.name.includes(t('payroll_periods:payroll_period_status.open')) || status.name.includes(t('payroll_periods:payroll_period_status.planned'))) {
          statusType = 'pending';
        }
        
        return <StatusTag status={statusType} />;
      },
      filters: statusOptions.map(option => ({
        text: option.name,
        value: option.id,
      })),
      onFilter: (value, record) => record.status_lookup_value_id === value,
    },
    {
      title: t('payroll_periods:table.column_employee_count'),
      dataIndex: 'employee_count',
      key: 'employee_count',
      width: 120,
      align: 'center',
      valueType: 'text',
      render: (_, record) => {
        const employeeCount = (record as any).employee_count ?? 0;
        
        if (employeeCount > 0) {
          return (
            <Tooltip title={t('payroll_periods:table.tooltip.employee_count_has_data')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <DatabaseOutlined style={{ fontSize: '14px', color: '#52c41a' }} />
                <span style={{ fontSize: '12px', color: '#52c41a', fontWeight: '500' }}>
                  {employeeCount}人
                </span>
              </div>
            </Tooltip>
          );
        } else {
          return (
            <Tooltip title={t('payroll_periods:table.tooltip.employee_count_no_data')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <FileAddOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{t('payroll_periods:table.status.no_data')}</span>
              </div>
            </Tooltip>
          );
        }
      },
      search: false,
    },
    {
      title: t('common:action.title'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: string, record: PayrollPeriod) => (
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
    },
  ];
  return columns;
};

const PayrollPeriodsPageV2: React.FC = () => {
  const { t } = useTranslation(['payroll_periods', 'payroll', 'common']);
  const permissions = usePayrollPeriodPermissions();
  const { lookupMaps, loadingLookups, errorLookups } = useLookupMaps();
  const navigate = useNavigate();
  const { message: messageApi } = App.useApp();
  
  // 状态管理
  const [dataSource, setDataSource] = useState<PayrollPeriod[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [statusOptions, setStatusOptions] = useState<DynamicStatusOption[]>([]);

  // 表单模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // For batch operations

  // 服务器端查询参数状态
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    page_size: 50,
    filters: {},
    sorting: [],
    search: '',
  });
  const [totalPayrollPeriods, setTotalPayrollPeriods] = useState(0); // State for total records

  const { getColumnSearch, searchText, searchedColumn } = useTableSearch();

  // 处理新增周期按钮点击
  const handleNewPeriod = useCallback(() => {
    setCurrentPeriod(null);
    setIsModalVisible(true);
  }, []);

  // 定义删除确认对话框配置
  const deleteConfirmConfig = useMemo(() => ({
    titleKey: 'payroll_periods_page.confirm_delete_title',
    contentKey: 'payroll_periods_page.confirm_delete_content',
    okTextKey: 'common:button.delete',
    cancelTextKey: 'common:button.cancel',
    successMessageKey: 'payroll_periods_page.delete_success',
    errorMessageKey: 'payroll_periods_page.delete_failure',
  }), []);

  // 获取数据
  const fetchData = useCallback(async (params?: QueryParams) => {
    setLoadingData(true);
    try {
      const response = await getPayrollPeriods(params || queryParams);
      setDataSource(response.data || []);
      setTotalPayrollPeriods(response.meta?.total || 0); // Corrected: Access total via meta
    } catch (error) {
      setDataSource([]);
      setTotalPayrollPeriods(0);
    } finally {
      setLoadingData(false);
    }
  }, [queryParams]); // Add queryParams to dependency array

  // 批量删除处理函数
  const handleBatchDelete = useCallback(async (keys: React.Key[]) => {
    try {
      await Promise.all(keys.map(key => deletePayrollPeriod(Number(key))));
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      console.error("Batch delete failed:", error);
      throw error;
    }
  }, [fetchData]);

  // 定义批量删除配置，适配 StandardListPageTemplate
  const batchDeleteConfig = useMemo(() => ({
    enabled: permissions.canDelete, // 启用批量删除取决于权限
    buttonText: t('payroll_periods_page.batch_delete_button_text'),
    confirmTitle: t('payroll_periods_page.confirm_batch_delete_title'),
    confirmContent: t('payroll_periods_page.confirm_batch_delete_content'),
    confirmOkText: t('common:button.delete'),
    confirmCancelText: t('common:button.cancel'),
    successMessage: t('payroll_periods_page.batch_delete_success'),
    errorMessage: t('payroll_periods_page.batch_delete_failure'),
    noSelectionMessage: t('payroll_periods_page.no_selection_message'),
    onBatchDelete: handleBatchDelete,
  }), [permissions.canDelete, t, handleBatchDelete]);

  // 定义导出配置
  const exportConfig = useMemo(() => ({
    filenamePrefix: t('payroll_periods_page.export_filename_prefix'),
    sheetName: t('payroll_periods_page.export_sheet_name'),
    buttonText: t('payroll_periods_page.export_button_text'),
    successMessage: t('payroll_periods_page.export_success_message'),
  }), [t]);

  // 加载状态选项
  useEffect(() => {
    const loadStatusOptions = async () => {
      try {
        const options = await getPayrollPeriodStatusOptions();
        setStatusOptions(options);
      } catch (err) {
        console.error("Failed to fetch payroll period status options:", err);
      }
    };
    loadStatusOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 处理删除
  const handleDelete = useCallback(async (periodId: string) => {
    try {
      await deletePayrollPeriod(parseInt(periodId, 10)); // Convert to number
      messageApi.success(t('payroll_periods_page.delete_success'));
      fetchData(); // 重新加载数据
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // 提取具体的错误信息
      let errorMessage = t('payroll_periods_page.delete_failure');
      
      if (error?.response?.data?.detail?.error?.details) {
        // 后端返回的具体错误信息
        errorMessage = error.response.data.detail.error.details;
      } else if (error?.response?.data?.detail?.details) {
        // 备用错误信息格式
        errorMessage = error.response.data.detail.details;
      } else if (error?.response?.status === 409) {
        // 409 冲突错误的通用提示
        errorMessage = '无法删除该薪资周期，因为它包含关联的薪资审核数据。请先删除相关的薪资审核记录。';
      }
      
      messageApi.error(errorMessage);
      throw error; // 重新抛出错误，让 StandardListPageTemplate 知道删除失败
    }
  }, [messageApi, t, fetchData]);

  // 处理编辑
  const handleEdit = useCallback((period: PayrollPeriod) => {
    setCurrentPeriod(period);
    setIsModalVisible(true);
  }, []);

  // 处理查看详情
  const handleViewDetails = useCallback((periodId: string) => {
    navigate(`/finance/payroll/periods/${periodId}`);
  }, [navigate]);

  // 处理搜索
  const handleSearch = useCallback((value: string) => {
    setQueryParams(prev => ({ ...prev, search: value, page: 1 }));
  }, []);

  // 处理表格变化 (排序, 筛选, 分页)
  const handleTableChange = useCallback(
    (pagination: any, filters: Record<string, any | null>, sorter: any, extra: { currentDataSource: PayrollPeriod[]; action: string }) => {
      const newSorting: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
      if (Array.isArray(sorter)) {
        sorter.forEach(s => {
          if (s.columnKey && s.order) {
            newSorting.push({ field: s.columnKey as string, direction: s.order === 'ascend' ? 'asc' : 'desc' });
          }
        });
      } else if (sorter.columnKey && sorter.order) {
        newSorting.push({ field: sorter.columnKey as string, direction: sorter.order === 'ascend' ? 'asc' : 'desc' });
      }

      const newFilters: Record<string, any> = {};
      for (const key in filters) {
        if (filters[key] && filters[key].length > 0) {
          newFilters[key] = filters[key];
        }
      }

      setQueryParams(prev => ({
        ...prev,
        page: pagination.current || 1,
        page_size: pagination.pageSize || 50,
        sorting: newSorting,
        filters: newFilters,
      }));
    },
    []
  );

  // Generate columns here, unconditionally
  const columns = useMemo(
    () => generatePayrollPeriodTableColumns(
      t,
      getColumnSearch,
      lookupMaps,
      permissions, // Use the permissions object directly
      handleEdit,
      handleDelete,
      handleViewDetails,
      statusOptions
    ),
    [t, getColumnSearch, lookupMaps, permissions, handleEdit, handleDelete, handleViewDetails, statusOptions]
  );

  const combinedLoading = loadingData || loadingLookups;

  return (
    <div>
      <StandardListPageTemplate<PayrollPeriod>
        translationNamespaces={['payroll_periods', 'payroll', 'common']}
        pageTitleKey="payroll_periods:page_title"
        addButtonTextKey="payroll_periods:create_period"
        dataSource={dataSource}
        loadingData={combinedLoading}
        permissions={permissions}
        lookupMaps={lookupMaps}
        loadingLookups={loadingLookups}
        errorLookups={errorLookups}
        fetchData={fetchData}
        deleteItem={handleDelete}
        onAddClick={handleNewPeriod}
        onEditClick={handleEdit}
        onViewDetailsClick={handleViewDetails}
        generateTableColumns={(t, getColumnSearch, lookupMaps, permissions, onEdit, onDelete, onViewDetails) =>
          generatePayrollPeriodTableColumns(
            t,
            getColumnSearch,
            lookupMaps,
            permissions,
            onEdit,
            onDelete,
            onViewDetails,
            statusOptions
          )
        }
        deleteConfirmConfig={deleteConfirmConfig}
        paginationConfig={{
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100', '200'],
          showTotal: (total: number) => t('common:pagination.show_total_text', { total }),
          onChange: (page: number, pageSize: number) => {
            // If you have a backend pagination, pass these to fetchData
            // For now, since data is fetched all at once, this controls client-side display
          },
        }}
        rowKey="id"
        batchDeleteConfig={batchDeleteConfig}
        exportConfig={exportConfig}
        lookupErrorMessageKey="common:message.data_loading_error"
        lookupLoadingMessageKey="common:loading.generic_loading_text"
        lookupDataErrorMessageKey="common:message.data_loading_error"
        serverSidePagination={true}
        serverSideSorting={true}
        serverSideFiltering={true}
        onSearch={handleSearch}
        onTableChange={handleTableChange}
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
      />
      <PayrollPeriodFormModal
        visible={isModalVisible}
        period={currentPeriod}
        onClose={() => {
          setIsModalVisible(false);
          setCurrentPeriod(null);
        }}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchData();
        }}
      />
    </div>
  );
};

export default PayrollPeriodsPageV2;