import React, { useEffect, useState, useCallback } from 'react';
import { 
  Button, 
  Modal, 
  Table, 
  Space, 
  Popconfirm, 
  message, 
  Tag, 
  Form,
  Alert,
  Typography
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ActionButton from '../../../components/common/ActionButton';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

import type { PayrollPeriod, ApiListMeta } from '../types/payrollTypes';
import { 
  getPayrollPeriods, 
  createPayrollPeriod, 
  updatePayrollPeriod, 
  deletePayrollPeriod 
} from '../services/payrollApi';
import PayrollPeriodForm, { type PayrollPeriodFormData } from '../components/PayrollPeriodForm';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { P_PAYROLL_PERIOD_MANAGE } from '../constants/payrollPermissions';
import { generatePayrollPeriodName } from '../utils/payrollFormatUtils';

// Define status options keys (can be moved to a shared util if used elsewhere)
// These keys should match what's in your translation files for payroll_period_form.status_option.*
const PERIOD_STATUS_OPTION_KEYS = [
  { id: 101, key: 'payroll_period_form.status_option.draft', color: 'default' },
  { id: 102, key: 'payroll_period_form.status_option.active', color: 'processing' },
  { id: 103, key: 'payroll_period_form.status_option.closed', color: 'success' },
  { id: 104, key: 'payroll_period_form.status_option.archived', color: 'warning' },
];

const PayrollPeriodsPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'translation']);
  console.log('[PayrollPeriodsPage] Rendering. Component instance created/re-rendered.');
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [currentPeriod, setCurrentPeriod] = useState<Partial<PayrollPeriod> | null>(null);
  
  const [form] = Form.useForm<PayrollPeriodFormData>();

  const requiredPermissionsMemo = React.useMemo(() => [P_PAYROLL_PERIOD_MANAGE], []);

  // New getStatusDisplayForPage function using t()
  const getStatusDisplayForPage = useCallback((statusId?: number) => {
    if (statusId === undefined || statusId === null) return { text: t('common.status_na'), color: 'default' };
    const statusOption = PERIOD_STATUS_OPTION_KEYS.find(opt => opt.id === statusId);
    if (statusOption) {
      return { text: t(statusOption.key), color: statusOption.color };
    }
    return { text: t('common.unknown_status_param', { statusId }), color: 'default' };
  }, [t]);

  const memoizedInitialValues = React.useMemo(() => {
    if (!currentPeriod) {
      return undefined;
    }
    return {
      name: currentPeriod.name,
      start_date: currentPeriod.start_date,
      end_date: currentPeriod.end_date,
      status_lookup_value_id: currentPeriod.status_lookup_value_id,
    };
  }, [currentPeriod]);

  const fetchPeriods = useCallback(async (page = 1, pageSize = 10) => {
    console.log(`[PayrollPeriodsPage:fetchPeriods] Called. Page: ${page}, PageSize: ${pageSize}`);
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollPeriods({ page, size: pageSize });
      console.log(`[PayrollPeriodsPage:fetchPeriods] Success. Received ${response.data.length} periods. Meta:`, response.meta);
      setPeriods(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error(`[PayrollPeriodsPage:fetchPeriods] Error fetching periods (page: ${page}):`, err.message, err.response?.data);
      setError(err.message || t('periods_page.error_fetch_periods'));
      setPeriods([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    console.log('[PayrollPeriodsPage:useEffect-fetchPeriods] Triggered. Calling fetchPeriods().');
    fetchPeriods();
  }, []);

  // 监听start_date变化自动生成名称
  useEffect(() => {
    // 只有当创建新周期时才进行自动生成
    if (isModalVisible && !currentPeriod) {
      const startDateField = form.getFieldValue('start_date');
      if (startDateField) {
        const generatedName = generatePayrollPeriodName(startDateField);
        form.setFieldsValue({ name: generatedName });
      }
    }
  }, [form, isModalVisible, currentPeriod]);

  const showModal = useCallback((period?: PayrollPeriod) => {
    console.log('[PayrollPeriodsPage:showModal] Called. Period:', period);
    if (period) {
      setCurrentPeriod(period);
      form.setFieldsValue({
        name: period.name,
        start_date: dayjs(period.start_date),
        end_date: dayjs(period.end_date),
        status_lookup_value_id: period.status_lookup_value_id,
      });
    } else {
      setCurrentPeriod(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  }, [form]);

  const handleModalCancel = useCallback(() => {
    console.log('[PayrollPeriodsPage:handleModalCancel] Called.');
    setIsModalVisible(false);
    setCurrentPeriod(null);
    form.resetFields();
  }, [form]);

  const handleFormFinish = useCallback(async (values: PayrollPeriodFormData) => {
    console.log('[PayrollPeriodsPage:handleFormFinish] Called. Values:', values, 'CurrentPeriod:', currentPeriod);
    setModalLoading(true);
    setError(null); 

    const apiPayload = {
      name: values.name,
      start_date: values.start_date.format('YYYY-MM-DD'),
      end_date: values.end_date.format('YYYY-MM-DD'),
      status_lookup_value_id: values.status_lookup_value_id,
    };

    try {
      if (currentPeriod && currentPeriod.id) {
        await updatePayrollPeriod(currentPeriod.id, apiPayload as Partial<PayrollPeriod>);
        message.success(t('periods_page.message.update_success'));
      } else {
        await createPayrollPeriod(apiPayload as Partial<PayrollPeriod>);
        message.success(t('periods_page.message.create_success'));
      }
      handleModalCancel();
      fetchPeriods(meta?.page || 1, meta?.size || 10); 
      console.log('[PayrollPeriodsPage:handleFormFinish] Success.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || (currentPeriod ? t('periods_page.message.update_failed') : t('periods_page.message.create_failed'));
      console.error('[PayrollPeriodsPage:handleFormFinish] Error:', errorMessage, 'Original error:', err);
      setError(errorMessage); 
      message.error(errorMessage); 
    } finally {
      setModalLoading(false);
    }
  }, [currentPeriod, fetchPeriods, handleModalCancel, meta?.page, meta?.size, t]);

  const handleDeletePeriod = useCallback(async (periodId: number) => {
    console.log('[PayrollPeriodsPage:handleDeletePeriod] Called. PeriodId:', periodId);
    setLoading(true); 
    setError(null);
    try {
      await deletePayrollPeriod(periodId);
      message.success(t('periods_page.message.delete_success'));
      if (periods.length === 1 && meta && meta.page > 1) {
        fetchPeriods(meta.page - 1, meta.size);
      } else {
        fetchPeriods(meta?.page || 1, meta?.size || 10);
      }
      console.log('[PayrollPeriodsPage:handleDeletePeriod] Success.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || t('periods_page.message.delete_failed');
      console.error('[PayrollPeriodsPage:handleDeletePeriod] Error:', errorMessage, 'Original error:', err);
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [periods.length, meta, fetchPeriods, t]);

  const columns = React.useMemo((): ColumnsType<PayrollPeriod> => [
    {
      title: t('periods_page.table.column.id'),
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('periods_page.table.column.period_name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('periods_page.table.column.start_date'),
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.start_date).unix() - dayjs(b.start_date).unix(),
    },
    {
      title: t('periods_page.table.column.end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.end_date).unix() - dayjs(b.end_date).unix(),
    },
    {
      title: t('periods_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      sorter: true,
      render: (statusId?: number) => {
        const statusInfo = getStatusDisplayForPage(statusId);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: t('periods_page.table.column.actions'),
      key: 'actions',
      align: 'center',
      render: (_, record: PayrollPeriod) => (
        <Space size="middle">
          <PermissionGuard requiredPermissions={requiredPermissionsMemo}>
            <ActionButton actionType="edit" onClick={() => showModal(record)} tooltipTitle={t('periods_page.tooltip.edit_period')} />
          </PermissionGuard>
          <PermissionGuard requiredPermissions={requiredPermissionsMemo}>
            <Popconfirm
                title={t('periods_page.popconfirm_delete.title')}
                description={t('periods_page.popconfirm_delete.description', { periodName: record.name })}
                onConfirm={() => handleDeletePeriod(record.id)}
                okText={t('periods_page.popconfirm_delete.ok_text')}
                cancelText={t('periods_page.popconfirm_delete.cancel_text')}
              >
                <ActionButton actionType="delete" tooltipTitle={t('periods_page.tooltip.delete_period')} />
            </Popconfirm>
          </PermissionGuard>
        </Space>
      ),
    },
  ], [requiredPermissionsMemo, showModal, handleDeletePeriod, t, getStatusDisplayForPage]);

  const paginationConfig = React.useMemo(() => ({
    current: meta?.page,
    pageSize: meta?.size,
    total: meta?.total,
    showSizeChanger: true,
    showTotal: (total: number, range: [number, number]) => t('periods_page.pagination_show_total', { range0: range[0], range1: range[1], total }),
  }), [meta?.page, meta?.size, meta?.total, t]);

  // 表单开始日期变化回调函数
  const handleStartDateChange = (date: Dayjs | null) => {
    if (date && !currentPeriod) {
      const generatedName = generatePayrollPeriodName(date);
      form.setFieldsValue({ name: generatedName });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}
      <PageHeaderLayout
        pageTitle={t('periods_page.title')}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()} shape="round">
            {t('periods_page.button.create_period')}
          </Button>
        }
      >
      </PageHeaderLayout>
      <Table
        columns={columns}
        dataSource={periods}
        rowKey="id"
        loading={loading}
        pagination={paginationConfig}
        onChange={(pagination) => fetchPeriods(pagination.current, pagination.pageSize)}
      />
      <Modal
        title={currentPeriod ? t('periods_page.modal_title.edit') : t('periods_page.modal_title.create')}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        destroyOnClose 
        width={600}
      >
        <PayrollPeriodForm
          form={form}
          initialValues={memoizedInitialValues}
          onFinish={handleFormFinish}
          onCancel={handleModalCancel}
          loading={modalLoading}
          isEditMode={!!currentPeriod}
          onStartDateChange={handleStartDateChange}
        />
      </Modal>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Typography.Text type="secondary">
          {t('periods_page.pagination_show_total', { 
            range0: meta ? (meta.page - 1) * meta.size + 1 : 0, 
            range1: meta ? Math.min(meta.page * meta.size, meta.total) : 0, 
            total: meta ? meta.total : 0 
          })}
        </Typography.Text>
      </div>
    </div>
  );
};

export default PayrollPeriodsPage; 