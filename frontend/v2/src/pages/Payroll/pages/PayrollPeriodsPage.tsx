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
import PageLayout from '../../../components/common/PageLayout';
import type { ColumnsType } from 'antd/es/table';
import { 
  getPayrollPeriods, 
  createPayrollPeriod, 
  updatePayrollPeriod, 
  deletePayrollPeriod
} from '../services/payrollApi';
import PayrollPeriodForm, { type PayrollPeriodFormData } from '../components/PayrollPeriodForm';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { P_PAYROLL_PERIOD_MANAGE } from '../constants/payrollPermissions';
import { getPayrollPeriodNameTranslation } from '../utils/payrollFormatUtils';
import TableActionButton from '../../../components/common/TableActionButton';
import type { PayrollPeriod, ApiListMeta } from '../types/payrollTypes';
import { useTableSearch, useTableExport, useColumnControl, numberSorter, stringSorter, dateSorter } from '../../../components/common/TableUtils';
import { getPayrollPeriodStatusOptions, getPayrollPeriodStatusInfo, type DynamicStatusOption } from '../utils/dynamicStatusUtils';

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

  // 状态选项状态
  const [statusOptions, setStatusOptions] = useState<DynamicStatusOption[]>([]);
  
  // 获取状态显示信息的异步函数
  const getStatusDisplayForPage = useCallback(async (statusId?: number) => {
    const statusInfo = await getPayrollPeriodStatusInfo(statusId);
    return { text: statusInfo.name, color: statusInfo.color };
  }, []);

  const memoizedInitialValues = React.useMemo(() => {
    if (!currentPeriod) {
      return undefined;
    }
    return {
      name: currentPeriod.name,
      start_date: currentPeriod.start_date,
      end_date: currentPeriod.end_date,
      pay_date: currentPeriod.pay_date,
      frequency_lookup_value_id: currentPeriod.frequency_lookup_value_id,
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

  // 加载状态选项
  useEffect(() => {
    const loadStatusOptions = async () => {
      try {
        const options = await getPayrollPeriodStatusOptions();
        setStatusOptions(options);
      } catch (error) {
        console.error('Failed to load status options:', error);
      }
    };
    loadStatusOptions();
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
        pay_date: dayjs(period.pay_date),
        frequency_lookup_value_id: period.frequency_lookup_value_id,
        status_lookup_value_id: period.status_lookup_value_id,
      });
    } else {
      setCurrentPeriod(null);
      form.resetFields();
      // 设置新建时的默认值
      form.setFieldsValue({
        frequency_lookup_value_id: 117, // 默认月度
        status_lookup_value_id: 137, // 默认计划中
      });
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
    console.log('[PayrollPeriodsPage:handleFormFinish] Detailed values:', {
      frequency_lookup_value_id: values.frequency_lookup_value_id,
      status_lookup_value_id: values.status_lookup_value_id,
      pay_date: values.pay_date?.format('YYYY-MM-DD'),
    });
    setModalLoading(true);
    setError(null);

    const apiPayload = {
      name: values.name,
      start_date: values.start_date.format('YYYY-MM-DD'),
      end_date: values.end_date.format('YYYY-MM-DD'),
      pay_date: values.pay_date.format('YYYY-MM-DD'),
      frequency_lookup_value_id: Number(values.frequency_lookup_value_id),
      status_lookup_value_id: Number(values.status_lookup_value_id),
    };
    
    console.log('[PayrollPeriodsPage:handleFormFinish] API Payload:', apiPayload);
    console.log('[PayrollPeriodsPage:handleFormFinish] frequency_lookup_value_id final value:', apiPayload.frequency_lookup_value_id);

    try {
      if (currentPeriod && currentPeriod.id) {
        await updatePayrollPeriod(currentPeriod.id, apiPayload as Partial<PayrollPeriod>);
        message.success("工资期间更新成功！");
      } else {
        await createPayrollPeriod(apiPayload as Partial<PayrollPeriod>);
        message.success("工资期间创建成功！");
      }
      handleModalCancel();
      fetchPeriods(meta?.page || 1, meta?.size || 10); 
      console.log('[PayrollPeriodsPage:handleFormFinish] Success.');
    } catch (err: any) {
      let errorMessage: string;
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.detail.msg) {
          errorMessage = err.response.data.detail.msg;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      } else {
        errorMessage = err.message || (currentPeriod ? "更新失败" : "创建失败");
      }
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
      message.success("工资期间删除成功！");
      if (periods.length === 1 && meta && meta.page > 1) {
        fetchPeriods(meta.page - 1, meta.size);
      } else {
        fetchPeriods(meta?.page || 1, meta?.size || 10);
      }
      console.log('[PayrollPeriodsPage:handleDeletePeriod] Success.');
    } catch (err: any) {
      let errorMessage: string;
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.detail.msg) {
          errorMessage = err.response.data.detail.msg;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      } else {
        errorMessage = err.message || "删除失败";
      }
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
      title: t('payroll_periods_page.table.column_id'),
      dataIndex: 'id',
      key: 'id',
      sorter: numberSorter<PayrollPeriod>('id'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('id'),
      width: 80,
    },
    {
      title: t('payroll_periods_page.table.column_period_name'),
      dataIndex: 'name',
      key: 'name',
      sorter: stringSorter<PayrollPeriod>('name'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('name'),
      width: 200,
    },
    {
      title: t('payroll_periods_page.table.column_start_date'),
      dataIndex: 'start_date',
      key: 'start_date',
      sorter: dateSorter<PayrollPeriod>('start_date'),
      sortDirections: ['descend', 'ascend'],
      width: 130,
      render: (date: string) => date ? format(new Date(date), 'yyyy-MM-dd') : '',
    },
    {
      title: t('payroll_periods_page.table.column_end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      sorter: dateSorter<PayrollPeriod>('end_date'),
      sortDirections: ['descend', 'ascend'],
      width: 130,
      render: (date: string) => date ? format(new Date(date), 'yyyy-MM-dd') : '',
    },
    {
      title: t('payroll_periods_page.table.column_status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      filters: statusOptions.map(option => ({
        text: option.name,
        value: option.id,
      })),
      onFilter: (value, record) => record.status_lookup_value_id === value,
      render: (statusId: number) => {
        // 同步查找状态信息，避免异步渲染问题
        const status = statusOptions.find(opt => opt.id === statusId);
        const statusText = status ? status.name : `未知状态(${statusId})`;
        const statusColor = status ? status.color : 'default';
        return <Tag color={statusColor}>{statusText}</Tag>;
      },
      width: 120,
    },
    {
      title: t('payroll_periods_page.table.column_actions'),
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <TableActionButton
            actionType="edit"
            onClick={() => showModal(record)}
            tooltipTitle={t('periods_page.tooltip_edit_period', { ns: 'payroll' })}
          />
          <Popconfirm
            title="确认删除"
            description={`确定要删除工资期间 "${record.name}" 吗？此操作不可撤销。`}
            onConfirm={() => handleDeletePeriod(record.id)}
            okText={t('button.yes', { ns: 'common' })}
            cancelText={t('button.no', { ns: 'common' })}
          >
            <TableActionButton
              actionType="delete"
              tooltipTitle={t('periods_page.tooltip_delete_period', { ns: 'payroll' })}
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
      filename: "工资期间数据",
      sheetName: "工资期间",
      buttonText: "导出Excel",
      successMessage: "导出成功"
    }
  );
  
  // 添加列控制功能
  const { visibleColumns, ColumnControl } = useColumnControl(
    columns,
    {
      storageKeyPrefix: 'payroll_periods_table',
      buttonText: "列设置",
      tooltipTitle: "自定义列",
      dropdownTitle: "列显示",
      resetText: "重置",
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
    }
  }, [t]);

  return (
    <PermissionGuard requiredPermissions={requiredPermissionsMemo} showError={true}>
      <PageLayout
        title={t('payroll_periods_page.title')}

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
              <Tooltip title="导出Excel">
                <ExportButton />
              </Tooltip>
            </PermissionGuard>
            <ColumnControl />
          </Space>
        }
      >
        {/* Content for PageHeaderLayout children goes here */}
        {error && <Alert message="错误" description={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />}
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
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
          }}
          scroll={{ x: 'max-content' }}
        />
        {isModalVisible && (
          <Modal
            title={currentPeriod ? "编辑工资期间" : t('payroll_periods_page.modal_title_create', { ns: 'common' })}
            open={isModalVisible}
            onCancel={handleModalCancel}
            confirmLoading={modalLoading}
            footer={[
              <Button key="back" onClick={handleModalCancel} disabled={modalLoading}>
                {t('button.cancel', { ns: 'common' })}
              </Button>,
              <Button key="submit" type="primary" loading={modalLoading} onClick={() => form.submit()}>
                {currentPeriod ? t('button.save_changes', { ns: 'common' }) : t('button.create', { ns: 'common' })}
              </Button>,
            ]}
            destroyOnHidden
          >
            {error && <Alert message="错误" description={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />}
            <PayrollPeriodForm 
              form={form} 
              onFinish={handleFormFinish} 
              initialValues={currentPeriod ? memoizedInitialValues : {
                frequency_lookup_value_id: 117,
                status_lookup_value_id: 137
              }} 
              onStartDateChange={handleStartDateChange} 
            />
          </Modal>
        )}
      </PageLayout>
    </PermissionGuard>
  );
};

export default PayrollPeriodsPage; 