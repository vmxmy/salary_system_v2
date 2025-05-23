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
  Input,
  DatePicker,
  Typography,
  Select,
  Tooltip
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { format } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import ActionButton from '../../../components/common/ActionButton';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import type { ColumnsType } from 'antd/es/table';
import { 
  getPayrollPeriods, 
  createPayrollPeriod, 
  updatePayrollPeriod, 
  deletePayrollPeriod,
  testTranslations
} from '../services/payrollApi';
import PayrollPeriodForm, { type PayrollPeriodFormData } from '../components/PayrollPeriodForm';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { P_PAYROLL_PERIOD_MANAGE } from '../constants/payrollPermissions';
import { getPayrollPeriodNameTranslation } from '../utils/payrollFormatUtils';
import TableActionButton from '../../../components/common/TableActionButton';
import type { PayrollPeriod, ApiListMeta } from '../types/payrollTypes';
import { useTableSearch, useTableExport, useColumnControl, numberSorter, stringSorter, dateSorter } from '../../../components/common/TableUtils';
import { PAYROLL_PERIOD_STATUS_OPTIONS, getPayrollPeriodStatusInfo } from '../utils/payrollUtils';

const PayrollPeriodsPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  console.log('[PayrollPeriodsPage] Rendering. Component instance created/re-rendered.');
  // 添加调试日志，检查翻译内容
  console.log('[PayrollPeriodsPage] Translation check:', {
    addPeriodBtn: t('periods_page.button.add_period'),
    title: t('periods_page.title'),
    nsCheck: t('periods_page.button.add_period', { ns: 'payroll' })
  });
  
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [currentPeriod, setCurrentPeriod] = useState<Partial<PayrollPeriod> | null>(null);
  
  const [form] = Form.useForm<PayrollPeriodFormData>();

  const requiredPermissionsMemo = React.useMemo(() => [P_PAYROLL_PERIOD_MANAGE], []);

  // 使用新的getPayrollPeriodStatusInfo函数
  const getStatusDisplayForPage = useCallback((statusId?: number) => {
    const statusInfo = getPayrollPeriodStatusInfo(statusId);
    return { text: t(statusInfo.key, statusInfo.params), color: statusInfo.color };
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
        // 使用新的函数获取翻译键和参数
        const translationInfo = getPayrollPeriodNameTranslation(startDateField);
        // 使用t函数进行翻译，并确保结果是字符串
        const generatedName = t(translationInfo.key, translationInfo.params) as string;
        form.setFieldsValue({ name: generatedName });
      }
    }
  }, [form, isModalVisible, currentPeriod, t]);

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

  // 添加表格搜索功能
  const { getColumnSearch } = useTableSearch();

  const columns: ColumnsType<PayrollPeriod> = [
    {
      title: t('periods_page.table.column.id'),
      dataIndex: 'id',
      key: 'id',
      sorter: numberSorter<PayrollPeriod>('id'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('id'),
      width: 80,
    },
    {
      title: t('periods_page.table.column.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: stringSorter<PayrollPeriod>('name'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('name'),
      width: 200,
    },
    {
      title: t('periods_page.table.column.start_date'),
      dataIndex: 'start_date',
      key: 'start_date',
      sorter: dateSorter<PayrollPeriod>('start_date'),
      sortDirections: ['descend', 'ascend'],
      width: 130,
      render: (date: string) => date ? format(new Date(date), 'yyyy-MM-dd') : '',
    },
    {
      title: t('periods_page.table.column.end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      sorter: dateSorter<PayrollPeriod>('end_date'),
      sortDirections: ['descend', 'ascend'],
      width: 130,
      render: (date: string) => date ? format(new Date(date), 'yyyy-MM-dd') : '',
    },
    {
      title: t('periods_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      filters: PAYROLL_PERIOD_STATUS_OPTIONS.map(option => ({
        text: t(option.display_name_key),
        value: option.id,
      })),
      onFilter: (value, record) => record.status_lookup_value_id === value,
      render: (statusId: number) => {
        const status = getStatusDisplayForPage(statusId);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
      width: 120,
    },
    {
      title: t('periods_page.table.column.actions'),
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <TableActionButton
            actionType="edit"
            onClick={() => showModal(record)}
            tooltipTitle={t('periods_page.tooltip.edit_period')}
          />
          <Popconfirm
            title={t('periods_page.confirm.delete_title')}
            description={t('periods_page.confirm.delete_description', { periodName: record.name })}
            onConfirm={() => handleDeletePeriod(record.id)}
            okText={t('common:action.yes')}
            cancelText={t('common:action.no')}
          >
            <TableActionButton
              actionType="delete"
              tooltipTitle={t('periods_page.tooltip.delete_period')}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  // 添加表格导出功能
  const { ExportButton } = useTableExport(
    periods || [], 
    columns, 
    {
      filename: t('periods_page.export.filename'),
      sheetName: t('periods_page.export.sheetName'),
      buttonText: t('periods_page.export.buttonText'),
      successMessage: t('periods_page.export.successMessage')
    }
  );
  
  // 添加列控制功能
  const { visibleColumns, ColumnControl } = useColumnControl(
    columns,
    {
      storageKeyPrefix: 'payroll_periods_table',
      buttonText: t('periods_page.columnControl.buttonText'),
      tooltipTitle: t('periods_page.columnControl.tooltipTitle'),
      dropdownTitle: t('periods_page.columnControl.dropdownTitle'),
      resetText: t('periods_page.columnControl.resetText'),
      requiredColumns: ['id', 'name', 'actions'] // ID、名称和操作列必须显示
    }
  );

  const pageTitle = t('periods_page.title');
  const actions = (
    <PermissionGuard requiredPermissions={requiredPermissionsMemo}>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
        {t('button.create', { ns: 'common' })}
      </Button>
    </PermissionGuard>
  );

  // 表单开始日期变化回调函数
  const handleStartDateChange = (date: Dayjs | null) => {
    if (date && !currentPeriod) {
      const translationInfo = getPayrollPeriodNameTranslation(date);
      const generatedName = t(translationInfo.key, translationInfo.params) as string;
      form.setFieldsValue({ name: generatedName });
    }
  };

  // 国际化加载诊断代码 - 可以在生产环境中删除
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[PayrollPeriodsPage] i18n loaded namespaces:', i18n.options.ns);
      console.log('[PayrollPeriodsPage] i18n current language:', i18n.language);
      
      // 测试翻译函数的结果
      const testResults = testTranslations();
      console.log('[PayrollPeriodsPage] Translation test results from utility:', testResults);
    }
  }, [t]);

  return (
    <PermissionGuard requiredPermissions={requiredPermissionsMemo} showError={true}>
      <PageHeaderLayout
        pageTitle={<Typography.Title level={4} style={{ margin: 0 }}>{t('periods_page.title')}</Typography.Title>}
        actions={
          <Space>
            <PermissionGuard requiredPermissions={requiredPermissionsMemo}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
              >
                {t('button.create', { ns: 'common' })}
              </Button>
            </PermissionGuard>
            <PermissionGuard requiredPermissions={requiredPermissionsMemo}>
              <Tooltip title={t('periods_page.export.tooltipTitle')}>
                <ExportButton />
              </Tooltip>
            </PermissionGuard>
            <ColumnControl />
          </Space>
        }
      >
        {/* Content for PageHeaderLayout children goes here */}
        {error && <Alert message={t('common.error_alert_title')} description={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />}
        <Table
          columns={visibleColumns}
          dataSource={periods}
          rowKey="id"
          loading={loading}
          pagination={{
            current: meta?.page || 1,
            pageSize: meta?.size || 10,
            total: meta?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => fetchPeriods(page, pageSize),
            showTotal: (total, range) => t('common.pagination_total', { start: range[0], end: range[1], total }),
          }}
          scroll={{ x: 'max-content' }}
        />
        {isModalVisible && (
          <Modal
            title={currentPeriod ? t('periods_page.modal.title_edit') : t('periods_page.modal.title_add')}
            open={isModalVisible}
            onCancel={handleModalCancel}
            confirmLoading={modalLoading}
            footer={[
              <Button key="back" onClick={handleModalCancel} disabled={modalLoading}>
                {t('common.button_cancel')}
              </Button>,
              <Button key="submit" type="primary" loading={modalLoading} onClick={() => form.submit()}>
                {currentPeriod ? t('common.button_save_changes') : t('common.button_create')}
              </Button>,
            ]}
            destroyOnHidden
          >
            {error && <Alert message={t('common.error_alert_title')} description={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />}
            <PayrollPeriodForm 
              form={form} 
              onFinish={handleFormFinish} 
              initialValues={memoizedInitialValues} 
              onStartDateChange={handleStartDateChange} 
            />
          </Modal>
        )}
      </PageHeaderLayout>
    </PermissionGuard>
  );
};

export default PayrollPeriodsPage; 