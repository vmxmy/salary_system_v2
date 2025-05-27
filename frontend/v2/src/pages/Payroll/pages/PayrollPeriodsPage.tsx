import React, { useEffect, useState, useCallback } from 'react';
import { 
  Button, 
  Modal, 
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
import { PlusOutlined, DatabaseOutlined, FileAddOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { format } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import ActionButton from '../../../components/common/ActionButton';
import PageLayout from '../../../components/common/PageLayout';
import type { ProColumns } from '@ant-design/pro-components';
import { 
  getPayrollPeriods, 
  createPayrollPeriod, 
  updatePayrollPeriod, 
  deletePayrollPeriod,
  getPayrollRuns,
  getPayrollEntries
} from '../services/payrollApi';
import PayrollPeriodForm, { type PayrollPeriodFormData } from '../components/PayrollPeriodForm';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { P_PAYROLL_PERIOD_MANAGE } from '../constants/payrollPermissions';
import { getPayrollPeriodNameTranslation } from '../utils/payrollFormatUtils';
import TableActionButton from '../../../components/common/TableActionButton';
import type { PayrollPeriod, ApiListMeta } from '../types/payrollTypes';
import { useTableSearch, useTableExport, useColumnControl, numberSorter, stringSorter, dateSorter } from '../../../components/common/TableUtils';
import { getPayrollPeriodStatusOptions, getPayrollPeriodStatusInfo, type DynamicStatusOption } from '../utils/dynamicStatusUtils';
import EnhancedProTable from '../../../components/common/EnhancedProTable';

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
  
  // 添加薪资周期数据统计状态
  const [periodDataStats, setPeriodDataStats] = useState<Record<number, { count: number; loading: boolean }>>({});
  
  // 获取状态显示信息的异步函数
  const getStatusDisplayForPage = useCallback(async (statusId?: number) => {
    const statusInfo = await getPayrollPeriodStatusInfo(statusId);
    return { text: statusInfo.name, color: statusInfo.color };
  }, []);

  // 获取薪资周期数据统计的函数 - 使用PayrollRun的total_employees字段
  const fetchPeriodDataStats = useCallback(async (periodIds: number[]) => {
    console.log('🔍 开始获取薪资周期数据统计...');
    
    // 初始化加载状态
    const initialStats: Record<number, { count: number; loading: boolean }> = {};
    periodIds.forEach(id => {
      initialStats[id] = { count: 0, loading: true };
    });
    setPeriodDataStats(initialStats);
    
    // 并发获取所有周期的数据统计
    const statsPromises = periodIds.map(async (periodId) => {
      try {
        console.log(`📊 获取周期 ${periodId} 的数据统计...`);
        
        // 获取该周期下的所有payroll_run（后端已经计算好total_employees）
        const runsResponse = await getPayrollRuns({
          period_id: periodId,
          size: 100 // 获取该周期下的所有run
        });
        
        let totalCount = 0;
        
        // 如果有payroll_run，直接使用后端计算好的total_employees字段
        if (runsResponse.data && runsResponse.data.length > 0) {
          // 直接累加所有run的total_employees（这是最简单快速的方法）
          // 注意：这可能会重复计算同一员工在多个run中的情况，但通常一个周期只有一个run
          totalCount = runsResponse.data.reduce((sum, run) => {
            return sum + (run.total_employees || 0);
          }, 0);
          
          console.log(`📊 周期 ${periodId} 的run列表:`, runsResponse.data.map(run => ({
            id: run.id,
            total_employees: run.total_employees,
            run_date: run.run_date
          })));
          console.log(`📊 周期 ${periodId} 累计员工数: ${totalCount}`);
          
          // 如果该周期有多个run，我们需要去重统计（但这种情况很少见）
          if (runsResponse.data.length > 1) {
            console.log(`⚠️ 周期 ${periodId} 有多个run，可能存在员工重复计算`);
            // 如果真的需要精确去重，可以在这里添加去重逻辑
            // 但为了性能，我们暂时使用简单累加
          }
        }
        
        console.log(`📊 周期 ${periodId} 有 ${totalCount} 个员工的薪资记录`);
        return { periodId, count: totalCount };
      } catch (error) {
        console.error(`❌ 获取周期 ${periodId} 数据统计失败:`, error);
        return { periodId, count: 0 };
      }
    });
    
    try {
      const results = await Promise.all(statsPromises);
      
      // 更新统计数据
      const newStats: Record<number, { count: number; loading: boolean }> = {};
      results.forEach(({ periodId, count }) => {
        newStats[periodId] = { count, loading: false };
      });
      
      setPeriodDataStats(newStats);
      console.log('✅ 薪资周期数据统计获取完成:', newStats);
    } catch (error) {
      console.error('❌ 获取薪资周期数据统计失败:', error);
      // 设置所有为非加载状态
      const errorStats: Record<number, { count: number; loading: boolean }> = {};
      periodIds.forEach(id => {
        errorStats[id] = { count: 0, loading: false };
      });
      setPeriodDataStats(errorStats);
    }
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
      
      // 获取每个周期的数据统计
      if (response.data.length > 0) {
        const periodIds = response.data.map(p => p.id);
        fetchPeriodDataStats(periodIds);
      }
    } catch (err: any) {
      console.error(`[PayrollPeriodsPage:fetchPeriods] Error fetching periods (page: ${page}):`, err.message, err.response?.data);
      setError(err.message || t('periods_page.error_fetch_periods'));
      setPeriods([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [t, fetchPeriodDataStats]);

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
      title: t('payroll_periods_page.table.column_status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: statusOptions.reduce((acc, option) => {
        acc[option.id] = { text: option.name, status: option.color };
        return acc;
      }, {} as Record<number, { text: string; status: string }>),
      render: (_, record) => {
        // 同步查找状态信息，避免异步渲染问题
        const status = statusOptions.find(opt => opt.id === record.status_lookup_value_id);
        const statusText = status ? status.name : `未知状态(${record.status_lookup_value_id})`;
        const statusColor = status ? status.color : 'default';
        return <Tag color={statusColor}>{statusText}</Tag>;
      },
      search: false,
    },
    {
      title: '员工人数',
      dataIndex: 'data_stats',
      key: 'data_stats',
      width: 120,
      align: 'center',
      valueType: 'text',
      render: (_, record) => {
        // 获取数据统计信息
        const dataStats = periodDataStats[record.id];
        const isLoadingStats = dataStats?.loading ?? true;
        const recordCount = dataStats?.count ?? 0;
        
        // 确定数据状态图标和颜色
        if (isLoadingStats) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <LoadingOutlined style={{ fontSize: '12px', color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#1890ff' }}>统计中</span>
            </div>
          );
        } else if (recordCount > 0) {
          return (
            <Tooltip title={`该薪资周期共有 ${recordCount} 个员工的薪资记录`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <DatabaseOutlined style={{ fontSize: '14px', color: '#52c41a' }} />
                <span style={{ fontSize: '12px', color: '#52c41a', fontWeight: '500' }}>
                  {recordCount}人
                </span>
              </div>
            </Tooltip>
          );
        } else {
          return (
            <Tooltip title="该薪资周期暂无员工薪资记录">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <FileAddOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>无数据</span>
              </div>
            </Tooltip>
          );
        }
      },
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_actions'),
      key: 'actions',
      align: 'center',
      width: 120,
      valueType: 'option',
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
  
  // ProTable 内置了导出和列控制功能，无需单独配置

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
          <PermissionGuard requiredPermissions={requiredPermissionsMemo}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              {t('button.create', { ns: 'common' })}
            </Button>
          </PermissionGuard>
        }
      >
        {/* Content for PageHeaderLayout children goes here */}
        {error && <Alert message="错误" description={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />}
        <EnhancedProTable<PayrollPeriod>
          columns={columns}
          dataSource={periods}
          rowKey="id"
          loading={loading}
          pagination={{
            current: meta?.page || 1,
            pageSize: meta?.size || 10,
            total: meta?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page: number, pageSize: number) => fetchPeriods(page, pageSize),
            showTotal: (total: number, range: [number, number]) => 
              `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
          }}
          scroll={{ x: 'max-content' }}
          enableAdvancedFeatures={true}
          showToolbar={true}
          search={false}
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