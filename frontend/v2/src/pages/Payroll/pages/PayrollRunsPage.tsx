import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  message,
  Card,
  Typography,
  Tooltip,
  Tag,
  Spin,
  Alert,
  Select,
  DatePicker,
  Input,
  Row,
  Col,
  App,
} from 'antd';
import {
  PlusOutlined,
  CalculatorOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

import PayrollCalculationPreview from '../components/PayrollCalculationPreview';
import StatusTag from '../../../components/common/StatusTag';
import TableActionButton from '../../../components/common/TableActionButton';

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

const { Title } = Typography;
const { Option } = Select;

const PayrollRunsPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  // 数据状态
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRun, setEditingRun] = useState<PayrollRun | null>(null);

  // 计算相关状态
  const [calculationPreviewVisible, setCalculationPreviewVisible] = useState(false);
  const [calculationRequest, setCalculationRequest] = useState<CalculationRequest | null>(null);
  const [selectedPeriodForCalculation, setSelectedPeriodForCalculation] = useState<PayrollPeriod | null>(null);

  // 表格列定义
  const columns: ColumnsType<PayrollRun> = [
    {
      title: t('payroll:id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('payroll:payroll_period'),
      dataIndex: ['payroll_period', 'name'],
      key: 'payroll_period_name',
      render: (_, record, index) => record.payroll_period?.name || '-',
    },
    {
      title: t('payroll:run_date'),
      dataIndex: 'run_date',
      key: 'run_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.run_date).unix() - dayjs(b.run_date).unix(),
    },
    {
      title: t('common:label.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120,
      render: (statusId: number) => {
        const statusInfo = getPayrollRunStatusInfo(statusId);
        // Assuming statusInfo.key is a complete key like 'payroll_run_status.pending_calculation'
        // and it resolves to a string in payroll.json
        return <StatusTag status={statusInfo.type} text={t(`payroll:${statusInfo.key}`)} />;
      },
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
    },
    {
      title: t('common:action.title'),
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record, index) => (
        <Space size="small">
          <TableActionButton
            actionType="view"
            onClick={() => handleViewDetails(record.id)}
            tooltipTitle={t('common:view')}
          />
          <TableActionButton
            actionType="edit"
            onClick={() => handleEdit(record)}
            tooltipTitle={t('common:edit')}
          />
          <TableActionButton
            actionType="delete"
            onClick={() => handleDelete(record.id)}
            tooltipTitle={t('common:delete')}
            danger
          />
          <Button
            type="link"
            size="small"
            icon={<CalculatorOutlined />}
            onClick={() => handleCalculate(record)}
            title={t('payroll:auto_calculate')}
          >
            {t('payroll:calculate')}
          </Button>
          <TableActionButton
            actionType="approve"
            icon={<CheckCircleOutlined />}
            onClick={() => handleMarkAsPaid(record)}
            tooltipTitle={t('payroll:mark_as_paid')}
            disabled={record.status_lookup_value_id === 63}
          />
          <TableActionButton
            actionType="download"
            icon={<DownloadOutlined />}
            onClick={() => handleExportBankFile(record)}
            tooltipTitle={t('payroll:export_bank_file')}
          />
        </Space>
      ),
    },
  ];

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [runsResponse, periodsResponse] = await Promise.all([
        getPayrollRuns({ page: 1, size: 100 }),
        getPayrollPeriods({ page: 1, size: 100 }),
      ]);
      setRuns(runsResponse.data || []);
      setPeriods(periodsResponse.data || []);
    } catch (error: any) {
      message.error(t('common:load_failed'));
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 处理创建
  const handleCreate = () => {
    setEditingRun(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (run: PayrollRun) => {
    setEditingRun(run);
    form.setFieldsValue({
      payroll_period_id: run.payroll_period_id,
      run_date: dayjs(run.run_date),
      status_lookup_value_id: run.status_lookup_value_id,
      notes: run.notes,
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = (runId: number) => {
    modal.confirm({
      title: t('payroll:confirm_delete_title'),
      content: t('payroll:confirm_delete_content'),
      okText: t('common:delete'),
      okType: 'danger',
      cancelText: t('common:cancel'),
      onOk: async () => {
        try {
          await deletePayrollRun(runId);
          message.success(t('payroll:delete_success'));
          loadData();
        } catch (error: any) {
          console.error('Delete payroll run error:', error);
          let errorMessage = t('payroll:delete_failed');
          
          // 处理后端返回的具体错误信息
          if (error?.response?.data?.detail?.error?.message) {
            // 优先使用后端返回的用户友好错误消息
            errorMessage = error.response.data.detail.error.message;
          } else if (error?.response?.data?.detail?.error?.details) {
            errorMessage = error.response.data.detail.error.details;
          } else if (error?.response?.status === 409) {
            // 409 冲突错误，通常是外键约束
            errorMessage = `${t('payroll:error_delete_conflict_associated_data')} 可以在"计算日志管理"页面查看和删除相关日志记录。`;
          }
          
          message.error(errorMessage);
        }
      },
    });
  };

  // 处理查看详情
  const handleViewDetails = (runId: number) => {
    navigate(`/finance/payroll/runs/${runId}`);
  };

  // 处理自动计算
  const handleCalculate = (run: PayrollRun) => {
    if (!run.payroll_period) {
      message.error(t('payroll:no_payroll_period'));
      return;
    }

    const request: CalculationRequest = {
      payroll_period_id: run.payroll_period_id,
      async_mode: false, // 默认同步模式
    };

    setCalculationRequest(request);
    setSelectedPeriodForCalculation(run.payroll_period);
    setCalculationPreviewVisible(true);
  };

  // 处理计算确认
  const handleCalculationConfirm = async (results: CalculationResult[]) => {
    try {
      if (!calculationRequest) return;

      // 触发正式计算
      await payrollCalculationApi.triggerCalculation({
        ...calculationRequest,
        is_preview: false,
      });

      message.success(t('payroll:calculation_success'));
      setCalculationPreviewVisible(false);
      loadData(); // 重新加载数据
    } catch (error: any) {
      console.error('Calculation failed:', error);
      let errorMessage = t('payroll:calculation_failed');
      
      if (error?.response?.data?.detail?.error?.details) {
        errorMessage = error.response.data.detail.error.details;
      } else if (error?.response?.data?.detail?.error?.message) {
        errorMessage = error.response.data.detail.error.message;
      }
      
      message.error(errorMessage);
    }
  };

  // 处理标记为已支付
  const handleMarkAsPaid = async (run: PayrollRun) => {
    modal.confirm({
      title: t('payroll:confirm_mark_as_paid_title'),
      content: t('payroll:confirm_mark_as_paid_content'),
      okText: t('common:confirm'),
      cancelText: t('common:cancel'),
      onOk: async () => {
        try {
          await updatePayrollRun(run.id, { status_lookup_value_id: 63 });
          message.success(t('payroll:mark_as_paid_success'));
          loadData();
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
  };

  // 处理导出银行文件
  const handleExportBankFile = async (run: PayrollRun) => {
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
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
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

      setModalVisible(false);
      loadData();
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
  };

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="payroll-runs-page">
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            {t('payroll:payroll_runs')}
          </Title>
          <Space>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => navigate('/finance/payroll/calculation-logs')}
            >
              计算日志管理
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              {t('payroll:create_payroll_run')}
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={runs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common:pagination.total', { total }),
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingRun ? t('payroll:edit_payroll_run') : t('payroll:create_payroll_run')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="payroll_period_id"
            label={t('payroll:payroll_period')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <Select placeholder={t('payroll:select_payroll_period')}>
              {periods.map(period => (
                <Option key={period.id} value={period.id}>
                  {period.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="run_date"
            label={t('payroll:run_date')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status_lookup_value_id"
            label={t('common:label.status')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <Select placeholder={t('payroll:select_status')}>
              {PAYROLL_RUN_STATUS_OPTIONS.map(status => (
                <Option key={status.id} value={status.id}>
                  {t(`payroll:${status.display_name_key}`)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label={t('payroll:notes')}>
            <Input.TextArea rows={3} placeholder={t('payroll:notes_placeholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 计算预览模态框 */}
      <PayrollCalculationPreview
        visible={calculationPreviewVisible}
        onCancel={() => setCalculationPreviewVisible(false)}
        onConfirm={handleCalculationConfirm}
        calculationRequest={calculationRequest}
        payrollPeriodName={selectedPeriodForCalculation?.name}
      />
    </div>
  );
};

export default PayrollRunsPage; 