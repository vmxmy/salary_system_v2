import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Tag,
  Button,
  Alert,
  Space,
  Modal, 
  Form,
  message,
  Typography,
  Tooltip,
} from 'antd';
import { PlusOutlined, CheckCircleOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import PermissionGuard from '../../../components/common/PermissionGuard';
import TableActionButton from '../../../components/common/TableActionButton';
import { format } from 'date-fns';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table/interface';
import dayjs from 'dayjs';

import type { PayrollRun, ApiListMeta, PayrollPeriod, UpdatePayrollRunPayload, CreatePayrollRunPayload } from '../types/payrollTypes';
import { 
  getPayrollRuns, 
  createPayrollRun, 
  updatePayrollRun,
  deletePayrollRun,
  exportPayrollRunBankFile,
} from '../services/payrollApi';
import PayrollRunForm, { type PayrollRunFormData } from '../components/PayrollRunForm';
import { getPayrollRunStatusInfo, PAYROLL_RUN_STATUS_OPTIONS } from '../utils/payrollUtils';
import {
  P_PAYROLL_RUN_MANAGE,
  P_PAYROLL_RUN_MARK_AS_PAID,
  P_PAYROLL_RUN_EXPORT_BANK_FILE,
  P_PAYROLL_RUN_VIEW
} from '../constants/payrollPermissions';

const PayrollRunsPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  console.log('[PayrollRunsPage] Rendering. Component instance created/re-rendered.');
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [currentRun, setCurrentRun] = useState<Partial<PayrollRun> | null>(null);
  
  const [form] = Form.useForm<PayrollRunFormData>();
  const navigate = useNavigate();

  const fetchRuns = useCallback(async (page = 1, pageSize = 10, payrollPeriodId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, size: pageSize };
      if (payrollPeriodId) {
        params.payroll_period_id = payrollPeriodId;
      }
      const response = await getPayrollRuns(params);
      setRuns(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      setError(err.message || t('runs_page.error_fetch_runs'));
      setRuns([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const showCreateModal = () => {
    setCurrentRun(null); 
    form.resetFields();
    setModalError(null); 
    setIsModalVisible(true);
  };

  const showEditModal = (run: PayrollRun) => {
    setCurrentRun(run);
    const formValues: PayrollRunFormData & { employee_ids_str?: string } = {
      payroll_period_id: run.payroll_period_id,
      run_date: dayjs(run.run_date),
      status_lookup_value_id: run.status_lookup_value_id,
      employee_ids_str: run.employee_ids?.join(', ') || '',
      notes: run.notes || '',
    };
    form.setFieldsValue(formValues);
    setModalError(null);
    setIsModalVisible(true);
  };

  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
    setModalError(null);
    setCurrentRun(null);
  }, []);

  const handleFormFinish = React.useCallback(async (formData: PayrollRunFormData) => {
    setModalLoading(true);
    setModalError(null);
    let employeeIds: number[] | undefined = undefined;
    if (formData.employee_ids_str && formData.employee_ids_str.trim() !== '') {
      employeeIds = formData.employee_ids_str
        .split(',')
        .map(idStr => parseInt(idStr.trim(), 10))
        .filter(id => !isNaN(id) && id > 0);
      if (employeeIds.length === 0) employeeIds = undefined;
    }
  
    const commonPayload = {
      payroll_period_id: formData.payroll_period_id,
      run_date: formData.run_date.format('YYYY-MM-DD'),
      status_lookup_value_id: formData.status_lookup_value_id,
      employee_ids: employeeIds,
      notes: formData.notes,
    };
  
    try {
      if (currentRun && currentRun.id) {
        const updatePayload: UpdatePayrollRunPayload = { ...commonPayload };
        await updatePayrollRun(currentRun.id, updatePayload);
        message.success(t('runs_page.message_update_success'));
      } else {
        const createPayload: CreatePayrollRunPayload = { ...commonPayload };
        await createPayrollRun(createPayload);
        message.success(t('runs_page.message_create_success'));
      }
      handleModalCancel();
      fetchRuns(meta?.page || 1, meta?.size || 10);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || (currentRun ? t('runs_page.error_update_failed') : t('runs_page.error_create_failed'));
      setModalError(errorMessage);
      message.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  }, [currentRun, meta, fetchRuns, handleModalCancel, t]);

  const handleDeleteRun = async (runId: number) => {
    Modal.confirm({
      title: t('runs_page.popconfirm_delete_title'),
      content: t('runs_page.popconfirm_delete_content'),
      okText: t('runs_page.popconfirm_ok_text'),
      okType: 'danger',
      cancelText: t('runs_page.popconfirm_cancel_text'),
      onOk: async () => {
        try {
          setLoading(true);
          await deletePayrollRun(runId);
          message.success(t('runs_page.message_delete_success'));
          fetchRuns(meta?.page || 1, meta?.size || 10);
        } catch (err: any) {
          const errorMessage = err.response?.data?.detail || err.message || t('runs_page.error_delete_failed');
          message.error(errorMessage);
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const PAID_STATUS_ID = PAYROLL_RUN_STATUS_OPTIONS.find(opt => opt.display_name_key === 'payroll_run_status.paid')?.id || 205;

  const handleMarkAsPaid = async (run: PayrollRun) => {
    if (run.status_lookup_value_id === PAID_STATUS_ID) {
      message.info(t('runs_page.message_already_paid'));
      return;
    }

    Modal.confirm({
      title: t('runs_page.popconfirm_mark_as_paid_title'),
      content: t('runs_page.popconfirm_mark_as_paid_content', { runId: run.id }),
      okText: t('runs_page.popconfirm_mark_as_paid_ok_text'),
      cancelText: t('runs_page.popconfirm_cancel_text'),
      onOk: async () => {
        try {
          setLoading(true);
          const payload: UpdatePayrollRunPayload = {
            status_lookup_value_id: PAID_STATUS_ID,
            paid_at: dayjs().toISOString(),
          };
          await updatePayrollRun(run.id, payload);
          message.success(t('runs_page.message_mark_as_paid_success', { runId: run.id }));
          fetchRuns(meta?.page || 1, meta?.size || 10);
        } catch (err: any) {
          const errorMessage = err.response?.data?.detail || err.message || t('runs_page.error_mark_as_paid_failed');
          message.error(errorMessage);
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleExportBankFile = async (run: PayrollRun) => {
    const exportMessageKey = `export-${run.id}`;
    message.loading({ content: t('runs_page.message_exporting_bank_file', {runId: run.id}), key: exportMessageKey, duration: 0 });

    try {
      const blob = await exportPayrollRunBankFile(run.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('runs_page.default_bank_export_filename_prefix')}${run.id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({ content: t('runs_page.message_export_bank_file_success', {runId: run.id}), key: exportMessageKey, duration: 3 });
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || err.message || t('runs_page.error_export_bank_file_failed_default');
      message.error({ content: t('runs_page.error_export_bank_file_failed_prefix') + errorDetail, key: exportMessageKey, duration: 5 });
    }
  };

  const handleViewDetails = (runId: number) => {
    navigate(`/finance/payroll/runs/${runId}`);
  };

  const handleTableChange = React.useCallback((pagination: TablePaginationConfig) => {
    fetchRuns(pagination.current, pagination.pageSize);
  }, [fetchRuns]);
  
  const columns: ColumnsType<PayrollRun> = React.useMemo(() => [
      {
        title: t('runs_page.table.column.id'),
        dataIndex: 'id',
        key: 'id',
        sorter: (a, b) => a.id - b.id,
      },
      {
        title: t('runs_page.table.column.payroll_period'),
        dataIndex: ['payroll_period', 'name'],
        key: 'payroll_period_name',
        sorter: true,
        render: (name: string, record: PayrollRun) => name || record.payroll_period_id,
      },
      {
        title: t('runs_page.table.column.run_date'),
        dataIndex: 'run_date',
        key: 'run_date',
        sorter: (a, b) => dayjs(a.run_date).unix() - dayjs(b.run_date).unix(),
        render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      },
      {
        title: t('runs_page.table.column.status'),
        dataIndex: 'status_lookup_value_id',
        key: 'status',
        sorter: true,
        render: (statusId?: number) => {
          const statusInfo = getPayrollRunStatusInfo(statusId);
          return <Tag color={statusInfo.color}>{t(statusInfo.key, statusInfo.params)}</Tag>;
        },
      },
      {
        title: t('runs_page.table.column.employee_count'),
        dataIndex: 'employee_ids',
        key: 'employee_count',
        sorter: (a, b) => (a.employee_ids?.length || 0) - (b.employee_ids?.length || 0),
        render: (employee_ids?: number[]) => employee_ids?.length || 0,
      },
      {
        title: t('runs_page.table.column.notes'),
        dataIndex: 'notes',
        key: 'notes',
        sorter: true,
        ellipsis: true,
      },
      {
        title: t('runs_page.table.column.actions'),
        key: 'actions',
        align: 'center',
        render: (_, record: PayrollRun) => (
          <Space size="middle">
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_VIEW]}>
                <TableActionButton 
                  actionType="view" 
                  onClick={() => handleViewDetails(record.id)} 
                  tooltipTitle={t('runs_page.table.action_details')}
                />
            </PermissionGuard>
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]}>
              <TableActionButton actionType="edit" onClick={() => showEditModal(record)} tooltipTitle={t('runs_page.tooltip.edit_run')} />
            </PermissionGuard>
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]}>
              <TableActionButton actionType="delete" danger onClick={() => handleDeleteRun(record.id)} tooltipTitle={t('runs_page.tooltip.delete_run')} />
            </PermissionGuard>
            {record.status_lookup_value_id !== PAID_STATUS_ID && (
              <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MARK_AS_PAID]}>
                  <TableActionButton
                      actionType="approve"
                      onClick={() => handleMarkAsPaid(record)}
                      tooltipTitle={t('runs_page.button.mark_as_paid')}
                  />
              </PermissionGuard>
            )}
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_EXPORT_BANK_FILE]}>
              <TableActionButton
                actionType="download"
                onClick={() => handleExportBankFile(record)}
                tooltipTitle={t('runs_page.button.export_bank_file')}
              />
            </PermissionGuard>
          </Space>
        ),
      },
    ], [PAID_STATUS_ID, t, handleViewDetails, showEditModal, handleDeleteRun, handleMarkAsPaid, handleExportBankFile]);

  return (
    <div style={{ padding: '24px' }}>
      <PageHeaderLayout
        pageTitle={t('runs_page.title')}
        actions={
          <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              shape="round"
            >
              {t('runs_page.button.create_run')}
            </Button>
          </PermissionGuard>
        }
      >
        <></>
      </PageHeaderLayout>

      {error && <Alert message={`${t('runs_page.alert_error_prefix')}${error}`} type="error" closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}
      
      <Table
        columns={columns}
        dataSource={runs}
        rowKey="id"
        loading={loading}
        pagination={{
          current: meta?.page,
          pageSize: meta?.size,
          total: meta?.total,
          showSizeChanger: true,
          showTotal: (total, range) => t('runs_page.pagination_show_total', { range0: range[0], range1: range[1], total }),
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={currentRun ? t('runs_page.modal_title_edit') : t('runs_page.modal_title_create')}
        open={isModalVisible}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading} 
        footer={null} 
        destroyOnClose
        width={650} 
      >
        {modalError && <Alert message={`${t('runs_page.alert_modal_error_prefix')}${modalError}`} type="error" closable onClose={() => setModalError(null)} style={{ marginBottom: 16}}/>}
        <PayrollRunForm
          form={form}
          onFinish={handleFormFinish}
          initialValues={currentRun ? { ...currentRun, employee_ids_str: currentRun.employee_ids?.join(', ') } : {}}
          loading={modalLoading} 
          isEditMode={!!currentRun}
        />
      </Modal>
    </div>
  );
};

export default PayrollRunsPage; 