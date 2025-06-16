import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Tooltip, Button, Space, Modal, message, App } from 'antd';
import { 
  CalculatorOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { QueryParams } from '../../../components/common/StandardListPageTemplate';
import type { PayrollRun, PayrollPeriod } from '../types/payrollTypes';
import type { CalculationRequest, CalculationResult } from '../types/calculationConfig';
import {
  getPayrollRuns,
  createPayrollRun,
  updatePayrollRun,
  deletePayrollRun,
  exportPayrollRunBankFile,
  getPayrollPeriods,
} from '../services/payrollApi';
import { payrollCalculationApi } from '../services/payrollCalculationApi';
import { getPayrollRunStatusInfo, PAYROLL_RUN_STATUS_OPTIONS } from '../utils/payrollUtils';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import TableActionButton from '../../../components/common/TableActionButton';
import StatusTag from '../../../components/common/StatusTag';
import PayrollCalculationPreview from '../components/PayrollCalculationPreview';
import PayrollRunFormModal from '../components/PayrollRunFormModal';

// 薪资执行权限钩子
const usePayrollRunPermissions = () => {
  return useMemo(() => ({
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  }), []);
};

// 生成薪资执行表格列配置的函数
const generatePayrollRunTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof PayrollRun) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  } = {},
  onEdit: (run: PayrollRun) => void,
  onDelete: (runId: string) => void,
  onViewDetails: (runId: string) => void,
  onCalculate: (run: PayrollRun) => void,
  onMarkAsPaid: (run: PayrollRun) => void,
  onExportBankFile: (run: PayrollRun) => void
): ProColumns<PayrollRun>[] => {
  const columns: ProColumns<PayrollRun>[] = [
    {
      title: t('payroll:id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      search: false,
    },
    {
      title: t('payroll:payroll_period'),
      dataIndex: ['payroll_period', 'name'],
      key: 'payroll_period_name',
      render: (_, record, index) => record.payroll_period?.name || '-',
      sorter: (a, b) => {
        const nameA = a.payroll_period?.name || '';
        const nameB = b.payroll_period?.name || '';
        return nameA.localeCompare(nameB);
      },
      ...getColumnSearch('payroll_period'),
    },
    {
      title: t('payroll:run_date'),
      dataIndex: 'run_date',
      key: 'run_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.run_date).unix() - dayjs(b.run_date).unix(),
      search: false,
    },
    {
      title: t('common:label.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120,
      render: (statusId: number) => {
        const statusInfo = getPayrollRunStatusInfo(statusId);
        return <StatusTag status={statusInfo.type} text={t(`payroll:${statusInfo.key}`)} />;
      },
      filters: PAYROLL_RUN_STATUS_OPTIONS.map(status => ({
        text: t(`payroll:${status.display_name_key}`),
        value: status.id,
      })),
      onFilter: (value, record) => record.status_lookup_value_id === value,
    },
    {
      title: t('payroll:employee_count'),
      dataIndex: 'total_employees',
      key: 'total_employees',
      width: 100,
      align: 'center',
      render: (count: number) => (
        <Tooltip title={t('payroll:total_employees_tooltip')}>
          <Space>
            <DatabaseOutlined style={{ color: '#52c41a' }} />
            <span style={{ color: '#52c41a', fontWeight: 500 }}>{count}人</span>
          </Space>
        </Tooltip>
      ),
      search: false,
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 350,
      fixed: 'right',
      render: (_, record, index) => (
        <Space size="small">
          <TableActionButton
            actionType="view"
            onClick={() => onViewDetails(String(record.id))}
            tooltipTitle={t('common:view')}
          />
          <TableActionButton
            actionType="edit"
            onClick={() => onEdit(record)}
            tooltipTitle={t('common:edit')}
          />
          <TableActionButton
            actionType="delete"
            onClick={() => onDelete(String(record.id))}
            tooltipTitle={t('common:delete')}
            danger
          />
          <TableActionButton
            actionType="calculate"
            icon={<CalculatorOutlined />}
            onClick={() => onCalculate(record)}
            tooltipTitle={t('payroll:auto_calculate')}
          />
          <TableActionButton
            actionType="approve"
            icon={<CheckCircleOutlined />}
            onClick={() => onMarkAsPaid(record)}
            tooltipTitle={t('payroll:mark_as_paid')}
            disabled={record.status_lookup_value_id === 63}
          />
          <TableActionButton
            actionType="download"
            icon={<DownloadOutlined />}
            onClick={() => onExportBankFile(record)}
            tooltipTitle={t('payroll:export_bank_file')}
          />
        </Space>
      ),
    },
  ];

  return columns;
};

const PayrollRunsPageV2: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const navigate = useNavigate();
  const { modal, message } = App.useApp();

  // 权限配置
  const permissions = usePayrollRunPermissions();

  // 数据状态
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 模态框状态
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingRun, setEditingRun] = useState<PayrollRun | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // For batch operations
  
  // 计算相关状态
  const [calculationPreviewVisible, setCalculationPreviewVisible] = useState(false);
  const [calculationRequest, setCalculationRequest] = useState<CalculationRequest | null>(null);
  const [selectedPeriodForCalculation, setSelectedPeriodForCalculation] = useState<PayrollPeriod | null>(null);

  // 查找数据钩子
  const { lookupMaps, loadingLookups, errorLookups } = useLookupMaps(); // Removed argument

  // 加载数据
  const fetchData = useCallback(async (params?: QueryParams) => {
    try {
      setLoading(true);
      const [runsResponse, periodsResponse] = await Promise.all([
        getPayrollRuns({ page: 1, size: 100 }),
        getPayrollPeriods({ page: 1, size: 100 }),
      ]);
      setRuns(runsResponse.data || []);
      setPeriods(periodsResponse.data || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      throw error; // 让 StandardListPageTemplate 处理错误
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除项目
  const deleteItem = useCallback(async (id: string) => {
    await deletePayrollRun(Number(id));
  }, []);

  // 批量删除处理函数
  const handleBatchDelete = useCallback(async (keys: React.Key[]) => {
    try {
      await Promise.all(keys.map(key => deletePayrollRun(Number(key))));
      setSelectedRowKeys([]);
      message.success(t('payroll:batch_delete_success'));
      fetchData();
    } catch (error: any) {
      console.error("Batch delete failed:", error);
      let errorMessage = t('payroll:batch_delete_failed');
      if (error?.response?.data?.detail?.error?.details) {
        errorMessage = error.response.data.detail.error.details;
      } else if (error?.response?.data?.detail?.error?.message) {
        errorMessage = error.response.data.detail.error.message;
      }
      message.error(errorMessage);
      throw error; // 重新抛出错误，让 StandardListPageTemplate 知道删除失败
    }
  }, [fetchData, message, t]);

  // 定义批量删除配置，适配 StandardListPageTemplate
  const batchDeleteConfig = useMemo(() => ({
    enabled: permissions.canDelete, // 启用批量删除取决于权限
    buttonText: t('payroll:batch_delete_button_text'),
    confirmTitle: t('payroll:confirm_batch_delete_title'),
    confirmContent: t('payroll:confirm_batch_delete_content'),
    confirmOkText: t('common:delete'),
    confirmCancelText: t('common:cancel'),
    successMessage: t('payroll:batch_delete_success'),
    errorMessage: t('payroll:batch_delete_failed'),
    noSelectionMessage: t('payroll:no_selection_message'),
    onBatchDelete: handleBatchDelete,
  }), [permissions.canDelete, t, handleBatchDelete]);

  // 处理创建
  const handleAddClick = useCallback(() => {
    setEditingRun(null);
    setFormModalVisible(true);
  }, []);

  // 处理编辑
  const handleEdit = useCallback((run: PayrollRun) => {
    setEditingRun(run);
    setFormModalVisible(true);
  }, []);

  // 处理查看详情
  const handleViewDetails = useCallback((runId: string) => {
    navigate(`/finance/payroll/runs/${runId}`);
  }, [navigate]);

  // 处理计算
  const handleCalculate = useCallback((run: PayrollRun) => {
    const period = periods.find(p => p.id === run.payroll_period_id);
    if (!period) {
      message.error(t('payroll:period_not_found'));
      return;
    }

    const request: CalculationRequest = {
      payroll_period_id: run.payroll_period_id,
      // payroll_run_id: run.id, // Removed as it's not in CalculationRequest type
      // recalculate_existing: true, // Removed as it's not in CalculationRequest type
    };

    setCalculationRequest(request);
    setSelectedPeriodForCalculation(period);
    setCalculationPreviewVisible(true);
  }, [periods, message, t]);

  // 处理计算确认
  const handleCalculationConfirm = useCallback(async (results: CalculationResult[]) => {
    try {
      if (!calculationRequest) return;
      
      message.loading({ content: t('payroll:calculating'), key: 'calculate' });
      await payrollCalculationApi.triggerCalculation(calculationRequest);
      message.success({ content: t('payroll:calculation_success'), key: 'calculate' });
      setCalculationPreviewVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Calculation error:', error);
      let errorMessage = t('payroll:calculation_failed');
      
      if (error?.response?.data?.detail?.error?.details) {
        errorMessage = error.response.data.detail.error.details;
      } else if (error?.response?.data?.detail?.error?.message) {
        errorMessage = error.response.data.detail.error.message;
      }
      
      message.error({ content: errorMessage, key: 'calculate' });
    }
  }, [calculationRequest, message, t, fetchData]);

  // 处理标记为已支付
  const handleMarkAsPaid = useCallback(async (run: PayrollRun) => {
    modal.confirm({
      title: t('payroll:confirm_mark_as_paid_title'),
      content: t('payroll:confirm_mark_as_paid_content'),
      okText: t('common:confirm'),
      cancelText: t('common:cancel'),
      onOk: async () => {
        try {
          await updatePayrollRun(run.id, { status_lookup_value_id: 63 });
          message.success(t('payroll:mark_as_paid_success'));
          fetchData();
        } catch (error: any) {
          console.error('Mark as paid error:', error);
          let errorMessage = t('payroll:mark_as_paid_failed');
          
          if (error?.response?.data?.detail?.error?.details) {
            errorMessage = error.response.data.detail.error.details;
          } else if (error?.response?.data?.detail?.error?.message) {
            errorMessage = error.response.data.detail.error.message;
          }
          
          message.error(errorMessage);
        }
      },
    });
  }, [modal, t, message, fetchData]);

  // 处理导出银行文件
  const handleExportBankFile = useCallback(async (run: PayrollRun) => {
    try {
      message.loading({ content: t('payroll:exporting'), key: 'export' });
      const response = await exportPayrollRunBankFile(run.id);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bank_file_payroll_run_${run.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success({ content: t('payroll:export_success'), key: 'export' });
    } catch (error: any) {
      console.error('Export bank file error:', error);
      let errorMessage = t('payroll:export_failed');
      
      if (error?.response?.data?.detail?.error?.details) {
        errorMessage = error.response.data.detail.error.details;
      } else if (error?.response?.data?.detail?.error?.message) {
        errorMessage = error.response.data.detail.error.message;
      }
      
      message.error({ content: errorMessage, key: 'export' });
    }
  }, [message, t]);

  // 处理表单提交
  const handleFormSubmit = useCallback(async (values: any) => {
    try {
      const data = {
        payroll_period_id: values.payroll_period_id,
        run_date: values.run_date.format('YYYY-MM-DD'),
        status_lookup_value_id: values.status_lookup_value_id,
        notes: values.notes,
      };

      if (editingRun) {
        await updatePayrollRun(editingRun.id, data);
        message.success(t('payroll:update_success'));
      } else {
        await createPayrollRun(data);
        message.success(t('payroll:create_success'));
      }

      setFormModalVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Submit form error:', error);
      let errorMessage = editingRun ? t('payroll:update_failed') : t('payroll:create_failed');
      
      if (error?.response?.data?.detail?.error?.details) {
        errorMessage = error.response.data.detail.error.details;
      } else if (error?.response?.data?.detail?.error?.message) {
        errorMessage = error.response.data.detail.error.message;
      }
      
      message.error(errorMessage);
    }
  }, [editingRun, message, t, fetchData]);

  return (
    <>
      <StandardListPageTemplate<PayrollRun>
        translationNamespaces={['payroll', 'common']}
        pageTitleKey="payroll:payroll_runs"
        addButtonTextKey="payroll:create_payroll_run"
        dataSource={runs}
        loadingData={loading}
        permissions={permissions}
        lookupMaps={lookupMaps}
        loadingLookups={loadingLookups}
        errorLookups={errorLookups}
        fetchData={fetchData}
        deleteItem={deleteItem}
        onAddClick={handleAddClick}
        onEditClick={handleEdit}
        onViewDetailsClick={handleViewDetails}
        generateTableColumns={(t, getColumnSearch, lookupMaps, permissions, onEdit, onDelete, onViewDetails) =>
          generatePayrollRunTableColumns(
            t,
            getColumnSearch,
            lookupMaps,
            permissions,
            onEdit,
            onDelete,
            onViewDetails,
            handleCalculate,
            handleMarkAsPaid,
            handleExportBankFile
          )
        }
        deleteConfirmConfig={{
          titleKey: 'payroll:confirm_delete_title',
          contentKey: 'payroll:confirm_delete_content',
          okTextKey: 'common:delete',
          cancelTextKey: 'common:cancel',
          successMessageKey: 'payroll:delete_success',
          errorMessageKey: 'payroll:delete_failed',
        }}
        exportConfig={{
          filenamePrefix: 'payroll_runs',
          sheetName: 'PayrollRuns',
          buttonText: t('common:export'),
          successMessage: t('common:export_success'),
        }}
        lookupErrorMessageKey="common:lookup_load_failed"
        lookupLoadingMessageKey="common:lookup_loading"
        lookupDataErrorMessageKey="common:lookup_data_error"
        rowKey="id"
        extraButtons={[
          <Button
            key="calculation-logs"
            icon={<FileTextOutlined />}
            onClick={() => navigate('/finance/payroll/calculation-logs')}
          >
            计算日志管理
          </Button>
        ]}
        batchDeleteConfig={batchDeleteConfig} // 传递批量删除配置
        selectedRowKeys={selectedRowKeys} // 传递选中的行键
        setSelectedRowKeys={setSelectedRowKeys} // 传递设置选中行键的回调
      />

      {/* 创建/编辑模态框 */}
      <PayrollRunFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)} // Renamed onCancel to onClose
        onSuccess={() => { // Adjusted onSuccess to match () => void
          setFormModalVisible(false);
          fetchData(); // Refresh data after success
        }}
        run={editingRun} // Renamed editingRun to run to match prop name
        // periods={periods} // Removed periods, as PayrollRunFormModal likely fetches its own periods or receives them differently
      />

      {/* 计算预览模态框 */}
      <PayrollCalculationPreview
        visible={calculationPreviewVisible}
        onCancel={() => setCalculationPreviewVisible(false)}
        onConfirm={handleCalculationConfirm}
        calculationRequest={calculationRequest}
        payrollPeriodName={selectedPeriodForCalculation?.name}
      />
    </>
  );
};

export default PayrollRunsPageV2; 