import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Tooltip, Button, Space, Modal, message } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { PayrollRun, UpdatePayrollRunPayload } from '../types/payrollTypes';
import { 
  getPayrollRuns, 
  deletePayrollRun,
  updatePayrollRun,
  exportPayrollRunBankFile
} from '../services/payrollApi';
import {
  P_PAYROLL_RUN_MANAGE,
  P_PAYROLL_RUN_MARK_AS_PAID,
  P_PAYROLL_RUN_EXPORT_BANK_FILE,
  P_PAYROLL_RUN_VIEW
} from '../constants/payrollPermissions';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { getPayrollRunStatusInfo, PAYROLL_RUN_STATUS_OPTIONS } from '../utils/payrollUtils';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import TableActionButton from '../../../components/common/TableActionButton';
import { stringSorter, numberSorter, dateSorter, useTableSearch } from '../../../components/common/TableUtils';
import PayrollRunFormModal from '../components/PayrollRunFormModal';

// 薪资计算批次权限钩子
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

// 生成薪资计算批次表格列配置的函数
const generatePayrollRunTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof PayrollRun) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (run: PayrollRun) => void,
  onDelete: (runId: string) => void,
  onViewDetails: (runId: string) => void,
  onMarkAsPaid: (run: PayrollRun) => void,
  onExportBankFile: (run: PayrollRun) => void
): ProColumns<PayrollRun>[] => {
  const PAID_STATUS_ID = PAYROLL_RUN_STATUS_OPTIONS.find(opt => opt.display_name_key === 'payroll_run_status.paid')?.id || 205;

  // 生成批次名称的函数
  const generateRunName = (run: PayrollRun): string => {
    const periodName = run.payroll_period?.name || t('payroll:auto_id_run_payroll_period_id__e591a8');
    const runDate = dayjs(run.run_date).format('YYYY-MM-DD');
    return `${periodName} - ${runDate}`;
  };

  const columns: ProColumns<PayrollRun>[] = [
    {
      title: t('runs_page.table.column.id'),
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      width: 80,
      valueType: 'digit',
      search: false,
    },
    {
      title: t('runs_page.table.column.batch_name'),
      key: 'batch_name',
      sorter: true,
      valueType: 'text',
      render: (_, record) => generateRunName(record),
      ...getColumnSearch('id'), // 使用 id 作为搜索字段的替代
    },
    {
      title: t('runs_page.table.column.payroll_period'),
      dataIndex: ['payroll_period', 'name'],
      key: 'payroll_period_name',
      sorter: true,
      valueType: 'text',
      render: (_, record) => record.payroll_period?.name || record.payroll_period_id,
    },
    {
      title: t('runs_page.table.column.run_date'),
      dataIndex: 'run_date',
      key: 'run_date',
      sorter: (a, b) => dayjs(a.run_date).unix() - dayjs(b.run_date).unix(),
      valueType: 'date',
      render: (_, record) => dayjs(record.run_date).format('YYYY-MM-DD'),
      search: false,
    },
    {
      title: t('runs_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      sorter: true,
      valueType: 'select',
      render: (_, record) => {
        const statusInfo = getPayrollRunStatusInfo(record.status_lookup_value_id);
        const statusText = statusInfo.params ? (t as any)(statusInfo.key, statusInfo.params) : t(statusInfo.key);
        return <Tag color={statusInfo.color}>{statusText}</Tag>;
      },
      filters: PAYROLL_RUN_STATUS_OPTIONS.map(option => ({
        text: t(option.display_name_key),
        value: option.id,
      })),
      onFilter: (value, record) => record.status_lookup_value_id === value,
    },
    {
      title: t('runs_page.table.column.employee_count'),
      dataIndex: 'total_employees',
      key: 'employee_count',
      sorter: (a, b) => (a.total_employees || 0) - (b.total_employees || 0),
      valueType: 'digit',
      render: (_, record) => record.total_employees || 0,
      search: false,
    },
    {
      title: t('runs_page.table.column.notes'),
      dataIndex: 'notes',
      key: 'notes',
      sorter: true,
      ellipsis: true,
      valueType: 'text',
      ...getColumnSearch('notes'),
    },
    {
      title: t('common:action.title'),
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_VIEW]}>
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(String(record.id))} 
              tooltipTitle={t('runs_page.table.action_details')}
            />
          </PermissionGuard>
          <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]}>
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(record)} 
              tooltipTitle={t('runs_page.tooltip.edit_run')} 
            />
          </PermissionGuard>
          <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]}>
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(String(record.id))} 
              tooltipTitle={t('runs_page.tooltip.delete_run')} 
            />
          </PermissionGuard>
          {record.status_lookup_value_id !== PAID_STATUS_ID && (
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MARK_AS_PAID]}>
              <TableActionButton
                actionType="approve"
                onClick={() => onMarkAsPaid(record)}
                tooltipTitle={t('runs_page.button.mark_as_paid')}
              />
            </PermissionGuard>
          )}
          <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_EXPORT_BANK_FILE]}>
            <TableActionButton
              actionType="download"
              onClick={() => onExportBankFile(record)}
              tooltipTitle={t('runs_page.button.export_bank_file')}
            />
          </PermissionGuard>
        </Space>
      ),
    },
  ];
  return columns;
};

const PayrollRunsPageV2: React.FC = () => {
  const { t } = useTranslation(['payroll_runs', 'pageTitle', 'common']);
  const permissions = usePayrollRunPermissions();
  const { lookupMaps, loadingLookups, errorLookups } = useLookupMaps();
  const navigate = useNavigate();
  
  // 状态管理
  const [dataSource, setDataSource] = useState<PayrollRun[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  
  // 表单模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRun, setCurrentRun] = useState<PayrollRun | null>(null);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    const fetchStartTime = Date.now();
    
    try {
      const response = await getPayrollRuns({
        page: 1,
        size: 100,
      });
      
      const fetchEndTime = Date.now();
      console.log('[PayrollRunsPageV2] ✅ API response received:', {
        hasData: !!response.data,
        dataCount: response.data?.length || 0,
        response
      });
      
      if (response.data) {
        setDataSource(response.data);
      } else {
        setDataSource([]);
      }
    } catch (error: any) {
      const fetchEndTime = Date.now();
      console.error('[PayrollRunsPageV2] ❌ Error details:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });
      message.error(t('runs_page.error_fetch_runs'));
      setDataSource([]);
    } finally {
      setLoadingData(false);
    }
  }, [t]);

  // 删除项目
  const deleteItem = useCallback(async (id: string) => {
    await deletePayrollRun(Number(id));
  }, []);

  // 处理新增
  const handleAddClick = useCallback(() => {
    setCurrentRun(null);
    setIsModalVisible(true);
  }, []);

  // 处理编辑
  const handleEditClick = useCallback((run: PayrollRun) => {
    setCurrentRun(run);
    setIsModalVisible(true);
  }, []);

  // 处理查看详情
  const handleViewDetailsClick = useCallback((id: string) => {
    navigate(`/finance/payroll/runs/${id}`);
  }, [navigate]);

  // 处理标记为已支付
  const handleMarkAsPaid = useCallback(async (run: PayrollRun) => {
    const PAID_STATUS_ID = PAYROLL_RUN_STATUS_OPTIONS.find(opt => opt.display_name_key === 'payroll_run_status.paid')?.id || 205;
    
    if (run.status_lookup_value_id === PAID_STATUS_ID) {
      message.info(t('runs_page.message.already_paid'));
      return;
    }

    Modal.confirm({
      title: t('runs_page.popconfirm.mark_as_paid_title'),
      content: t('runs_page.popconfirm.mark_as_paid_content', { runId: run.id }),
      okText: t('runs_page.popconfirm.mark_as_paid_ok_text'),
      cancelText: t('runs_page.popconfirm.delete_cancel_text'),
      onOk: async () => {
        try {
          const payload: UpdatePayrollRunPayload = {
            status_lookup_value_id: PAID_STATUS_ID,
            paid_at: dayjs().toISOString(),
          };
          await updatePayrollRun(run.id, payload);
          message.success(t('runs_page.message.mark_as_paid_success', { runId: run.id }));
          fetchData();
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || error.message || t('runs_page.error.mark_as_paid_failed');
          message.error(errorMessage);
        }
      },
    });
  }, [t, fetchData]);

  // 处理导出银行文件
  const handleExportBankFile = useCallback(async (run: PayrollRun) => {
    const exportMessageKey = `export-${run.id}`;
    message.loading({ 
      content: t('runs_page.message.exporting_bank_file', { runId: run.id }), 
      key: exportMessageKey, 
      duration: 0 
    });

    try {
      const blob = await exportPayrollRunBankFile(run.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `$t('runs_page.default_bank_export_filename_prefix')${run.id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({ 
        content: t('runs_page.message.export_bank_file_success', { runId: run.id }), 
        key: exportMessageKey, 
        duration: 3 
      });
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.message || t('runs_page.error.export_bank_file_failed_default');
      message.error({ 
        content: t('runs_page.error.export_bank_file_failed_prefix') + errorDetail, 
        key: exportMessageKey, 
        duration: 5 
      });
    }
  }, [t]);

  // 表单成功回调
  const handleFormSuccess = useCallback(() => {
    setIsModalVisible(false);
    setCurrentRun(null);
    fetchData();
  }, [fetchData]);

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]} showError={true}>
      <StandardListPageTemplate<PayrollRun>
        translationNamespaces={['payroll_runs', 'pageTitle', 'common']}
        pageTitleKey="pageTitle:payroll_runs"
        addButtonTextKey="runs_page.button.create_run"
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
        generateTableColumns={(t, getColumnSearch, lookupMaps, permissions, onEdit, onDelete, onViewDetails) =>
          generatePayrollRunTableColumns(
            t,
            getColumnSearch,
            lookupMaps,
            permissions,
            onEdit,
            onDelete,
            onViewDetails,
            handleMarkAsPaid,
            handleExportBankFile
          )
        }
        deleteConfirmConfig={{
          titleKey: 'runs_page.popconfirm.delete_title',
          contentKey: 'runs_page.popconfirm.delete_content',
          okTextKey: 'runs_page.popconfirm.delete_ok_text',
          cancelTextKey: 'runs_page.popconfirm.delete_cancel_text',
          successMessageKey: 'runs_page.message.delete_success',
          errorMessageKey: 'runs_page.error.delete_failed',
        }}
        batchDeleteConfig={{
          enabled: true,
          buttonText: t('payroll:auto_text_e689b9'),
          confirmTitle: t('payroll:auto_text_e7a1ae'),
          confirmContent: t('payroll:auto____e7a1ae'),
          confirmOkText: t('payroll:auto_text_e7a1ae'),
          confirmCancelText: t('payroll:auto_text_e58f96'),
          successMessage: t('payroll:auto_text_e689b9'),
          errorMessage: t('payroll:auto_text_e689b9'),
          noSelectionMessage: t('payroll:auto_text_e8afb7'),
        }}
        exportConfig={{
          filenamePrefix: t('payroll:auto_text_e896aa'),
          sheetName: t('payroll:auto_text_e8aea1'),
          buttonText: t('payroll:auto_excel_e5afbc'),
          successMessage: t('payroll:auto_text_e896aa'),
        }}
        lookupErrorMessageKey="runs_page.error_fetch_runs"
        lookupLoadingMessageKey="runs_page.loading_runs"
        lookupDataErrorMessageKey="runs_page.lookup_data_error"
        rowKey="id"
      />

      {isModalVisible && (
        <PayrollRunFormModal
          visible={isModalVisible}
          run={currentRun}
          onClose={() => {
            setIsModalVisible(false);
            setCurrentRun(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </PermissionGuard>
  );
};

export default PayrollRunsPageV2;