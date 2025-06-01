import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
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
import PageLayout from '../../../components/common/PageLayout';
import PermissionGuard from '../../../components/common/PermissionGuard';
import TableActionButton from '../../../components/common/TableActionButton';
import { format } from 'date-fns';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../../../components/common/EnhancedProTable';
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

// ✅ 调试开关：设置为true时使用模拟数据，跳过真实API调用
const USE_MOCK_API = false; // 可以临时改为true进行调试

const PayrollRunsPage: React.FC = () => {
  const { t } = useTranslation(['payroll_runs', 'common']);
  
  const fetchCallCountRef = useRef(0);
  
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

  console.log('[PayrollRunsPage] 🔄 Current state:', {
    runsCount: runs.length,
    loading,
    error,
    meta,
    isModalVisible,
    modalLoading,
    fetchCallCount: fetchCallCountRef.current
  });

  // ✅ 使用useRef保存最新值，避免依赖问题
  const metaRef = useRef(meta);
  const currentRunRef = useRef(currentRun);
  
  // 更新ref值
  metaRef.current = meta;
  currentRunRef.current = currentRun;

  const fetchRuns = useCallback(async (page = 1, pageSize = 10, payrollPeriodId?: number) => {
    fetchCallCountRef.current += 1;
    const fetchStartTime = Date.now();
    
    // ✅ 检测潜在的无限循环
    if (fetchCallCountRef.current > 10) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, size: pageSize };
      if (payrollPeriodId) {
        params.payroll_period_id = payrollPeriodId;
      }
      
      let response;
      
      if (USE_MOCK_API) {
        // ✅ 模拟API调用，用于调试
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟1秒延迟
        response = {
          data: [
            {
              id: 1,
              payroll_period_id: 1,
              payroll_period: { 
                id: 1, 
                name: t('payroll:auto_20241_323032'),
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                pay_date: '2024-02-05',
                frequency_lookup_value_id: 101,
                is_active: true
              } as PayrollPeriod,
              run_date: '2024-01-15',
              status_lookup_value_id: 201,
              total_employees: 10,
              notes: t('payroll:auto_text_e6a8a1'),
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            } as PayrollRun
          ],
          meta: { page: 1, size: 10, total: 1, totalPages: 1 }
        };
      } else {
        // 真实API调用
        response = await getPayrollRuns(params);
      }
      
      const fetchEndTime = Date.now();
      console.log('[PayrollRunsPage] ✅ API response received:', {
        dataCount: response.data?.length || 0,
        meta: response.meta,
        fullResponse: response
      });
      setRuns(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      const fetchEndTime = Date.now();
      console.error('[PayrollRunsPage] ❌ API request failed:', {
        error: err,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        timestamp: new Date().toISOString()
      });
      // 移除t函数的使用，使用固定字符串避免依赖问题
      setError(err.message || 'Failed to fetch payroll runs');
      setRuns([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []); // ❌ 移除t依赖，避免无限重渲染

  useEffect(() => {
    fetchRuns();
  }, []); // ✅ 确保只在组件挂载时执行一次，不依赖fetchRuns

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
      if (currentRunRef.current && currentRunRef.current.id) {
        const updatePayload: UpdatePayrollRunPayload = { ...commonPayload };
        await updatePayrollRun(currentRunRef.current.id, updatePayload);
        message.success('Update successful');
      } else {
        const createPayload: CreatePayrollRunPayload = { ...commonPayload };
        await createPayrollRun(createPayload);
        message.success('Create successful');
      }
      handleModalCancel();
      fetchRuns(metaRef.current?.page || 1, metaRef.current?.size || 10);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || (currentRunRef.current ? 'Update failed' : 'Create failed');
      setModalError(errorMessage);
      message.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  }, [handleModalCancel]); // ✅ 只依赖稳定的handleModalCancel

  const handleDeleteRun = async (runId: number) => {
    Modal.confirm({
      title: 'Delete Confirmation',
      content: 'Are you sure you want to delete this payroll run?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await deletePayrollRun(runId);
          message.success('Delete successful');
          fetchRuns(metaRef.current?.page || 1, metaRef.current?.size || 10);
        } catch (err: any) {
          const errorMessage = err.response?.data?.detail || err.message || 'Delete failed';
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
      message.info('Already marked as paid');
      return;
    }

    Modal.confirm({
      title: 'Mark as Paid Confirmation',
      content: `Are you sure you want to mark run ${run.id} as paid?`,
      okText: 'Mark as Paid',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          const payload: UpdatePayrollRunPayload = {
            status_lookup_value_id: PAID_STATUS_ID,
            paid_at: dayjs().toISOString(),
          };
          await updatePayrollRun(run.id, payload);
          message.success(`Run ${run.id} marked as paid successfully`);
          fetchRuns(metaRef.current?.page || 1, metaRef.current?.size || 10);
        } catch (err: any) {
          const errorMessage = err.response?.data?.detail || err.message || 'Mark as paid failed';
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
    message.loading({ content: `Exporting bank file for run ${run.id}...`, key: exportMessageKey, duration: 0 });

    try {
      const blob = await exportPayrollRunBankFile(run.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_run_${run.id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({ content: `Bank file for run ${run.id} exported successfully`, key: exportMessageKey, duration: 3 });
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || err.message || 'Export failed';
      message.error({ content: 'Export bank file failed: ' + errorDetail, key: exportMessageKey, duration: 5 });
    }
  };

  const handleViewDetails = (runId: number) => {
    navigate(`/finance/payroll/runs/${runId}`);
  };


  
  // 生成批次名称的函数
  const generateRunName = (run: PayrollRun): string => {
    const periodName = run.payroll_period?.name || t('payroll:auto_id_run_payroll_period_id__e591a8');
    const runDate = dayjs(run.run_date).format('YYYY-MM-DD');
    return `${periodName} - ${runDate}`;
  };

  const columns: ProColumns<PayrollRun>[] = React.useMemo(() => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: (a: PayrollRun, b: PayrollRun) => a.id - b.id,
        width: 80,
        valueType: 'digit',
      },
      {
        title: 'Batch Name',
        key: 'batch_name',
        sorter: true,
        valueType: 'text',
        render: (_, record: PayrollRun) => generateRunName(record),
      },
      {
        title: 'Payroll Period',
        dataIndex: ['payroll_period', 'name'],
        key: 'payroll_period_name',
        sorter: true,
        valueType: 'text',
        render: (_, record: PayrollRun) => record.payroll_period?.name || record.payroll_period_id,
      },
      {
        title: 'Run Date',
        dataIndex: 'run_date',
        key: 'run_date',
        sorter: (a: PayrollRun, b: PayrollRun) => dayjs(a.run_date).unix() - dayjs(b.run_date).unix(),
        valueType: 'date',
        render: (_, record: PayrollRun) => dayjs(record.run_date).format('YYYY-MM-DD'),
      },
      {
        title: 'Status',
        dataIndex: 'status_lookup_value_id',
        key: 'status',
        sorter: true,
        valueType: 'select',
        render: (_, record: PayrollRun) => {
          const statusInfo = getPayrollRunStatusInfo(record.status_lookup_value_id);
          return <Tag color={statusInfo.color}>{statusInfo.key}</Tag>;
        },
      },
      {
        title: 'Employee Count',
        dataIndex: 'total_employees',
        key: 'employee_count',
        sorter: (a: PayrollRun, b: PayrollRun) => (a.total_employees || 0) - (b.total_employees || 0),
        valueType: 'digit',
        render: (_, record: PayrollRun) => record.total_employees || 0,
      },
      {
        title: 'Notes',
        dataIndex: 'notes',
        key: 'notes',
        sorter: true,
        ellipsis: true,
        valueType: 'text',
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center',
        valueType: 'option',
        render: (_, record: PayrollRun) => (
          <Space size="middle">
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_VIEW]}>
                <TableActionButton 
                  actionType="view" 
                  onClick={() => handleViewDetails(record.id)} 
                  tooltipTitle="View Details"
                />
            </PermissionGuard>
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]}>
              <TableActionButton actionType="edit" onClick={() => showEditModal(record)} tooltipTitle="Edit Run" />
            </PermissionGuard>
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]}>
              <TableActionButton actionType="delete" danger onClick={() => handleDeleteRun(record.id)} tooltipTitle="Delete Run" />
            </PermissionGuard>
            {record.status_lookup_value_id !== PAID_STATUS_ID && (
              <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MARK_AS_PAID]}>
                  <TableActionButton
                      actionType="approve"
                      onClick={() => handleMarkAsPaid(record)}
                      tooltipTitle="Mark as Paid"
                  />
              </PermissionGuard>
            )}
            <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_EXPORT_BANK_FILE]}>
              <TableActionButton
                actionType="download"
                onClick={() => handleExportBankFile(record)}
                tooltipTitle="Export Bank File"
              />
            </PermissionGuard>
          </Space>
        ),
      },
    ], [PAID_STATUS_ID, handleViewDetails, showEditModal, handleDeleteRun, handleMarkAsPaid, handleExportBankFile]); // ✅ 移除t依赖

  return (
    <PageLayout
      title="Payroll Runs"
      
      actions={
        <PermissionGuard requiredPermissions={[P_PAYROLL_RUN_MANAGE]}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
            shape="round"
          >
            Create New Run
          </Button>
        </PermissionGuard>
      }
    >
      {error && <Alert message={`Error: ${error}`} type="error" closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}
      
      <EnhancedProTable<PayrollRun>
        columns={columns}
        dataSource={runs}
        rowKey="id"
        loading={loading}
        pagination={{
          current: meta?.page,
          pageSize: meta?.size,
          total: meta?.total,
          showSizeChanger: true,
          showTotal: (total: number, range: [number, number]) => 
            t('payroll:auto__range_0_range_1___total__e7acac'),
        }}

        scroll={{ x: 'max-content' }}
        enableAdvancedFeatures={true}
        showToolbar={true}
        search={false}
      />

      <Modal
        title={currentRun ? 'Edit Payroll Run' : 'Create New Payroll Run'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading} 
        footer={null} 
        destroyOnClose={true}
        width={650} 
      >
        {modalError && <Alert message={`Modal Error: ${modalError}`} type="error" closable onClose={() => setModalError(null)} style={{ marginBottom: 16}}/>}
        {isModalVisible && (
          <PayrollRunForm
            form={form}
            onFinish={handleFormFinish}
            initialValues={currentRun ? { ...currentRun, employee_ids_str: currentRun.employee_ids?.join(', ') } : {}}
            loading={modalLoading} 
            isEditMode={!!currentRun}
          />
        )}
      </Modal>
    </PageLayout>
  );
};

export default PayrollRunsPage; 