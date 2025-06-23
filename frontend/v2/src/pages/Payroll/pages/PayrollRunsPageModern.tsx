import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Button,
  Space,
  Modal,
  Form,
  message,
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
  Descriptions,
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
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';

import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';
import TableActionButton from '../../../components/common/TableActionButton';
import StatusTag from '../../../components/common/StatusTag';

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

const { Title, Text } = Typography;
const { Option } = Select;

const PayrollRunsPageModern: React.FC = () => {
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
  const [selectedPeriodForCalculation, setSelectedPeriodForCalculation] = useState<PayrollPeriod | null>(null);

  // 表格列定义
  const columns: ProColumns<PayrollRun>[] = useMemo(() => [
    {
      title: t('payroll:id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      render: (_, record) => (
        <Text strong className="typography-caption">#{record.id}</Text>
      ),
    },
    {
      title: t('payroll:payroll_period'),
      dataIndex: ['payroll_period', 'name'],
      key: 'payroll_period_name',
      ellipsis: true,
      render: (_, record) => (
        <div>
          <Text strong>{record.payroll_period?.name || '-'}</Text>
          <br />
          <Text type="secondary" className="typography-caption">
            {record.payroll_period?.start_date && record.payroll_period?.end_date 
              ? `${dayjs(record.payroll_period.start_date).format('MM/DD')} - ${dayjs(record.payroll_period.end_date).format('MM/DD')}`
              : '-'
            }
          </Text>
        </div>
      ),
    },
    {
      title: t('payroll:run_date'),
      dataIndex: 'run_date',
      key: 'run_date',
      width: 120,
      render: (_, record) => (
        <Text className="typography-body">
          {dayjs(record.run_date).format('YYYY-MM-DD')}
        </Text>
      ),
      sorter: (a, b) => dayjs(a.run_date).unix() - dayjs(b.run_date).unix(),
    },
    {
      title: t('common:label.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 140,
      render: (_, record) => {
        const statusInfo = getPayrollRunStatusInfo(record.status_lookup_value_id);
        return (
          <StatusTag 
            status={statusInfo.type} 
            text={t(`payroll:${statusInfo.key}`)} 
          />
        );
      },
    },
    {
      title: t('payroll:employee_count'),
      dataIndex: 'total_employees',
      key: 'total_employees',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={t('payroll:total_employees_tooltip')}>
          <Space>
            <DatabaseOutlined style={{ color: 'var(--color-success)' }} />
            <Text strong style={{ color: 'var(--color-success)' }}>
              {record.total_employees}人
            </Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: t('common:action.title'),
      key: 'actions',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
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
          <Tooltip title={t('payroll:auto_calculate')}>
            <Button
              type="text"
              size="small"
              icon={<CalculatorOutlined />}
              onClick={() => handleCalculate(record)}
              className="action-button"
            />
          </Tooltip>
          <Tooltip title={t('payroll:export_bank_file')}>
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleExportBankFile(record.id)}
              className="action-button"
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [t]);

  // 数据加载
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [runsResponse, periodsResponse] = await Promise.all([
        getPayrollRuns(),
        getPayrollPeriods(),
      ]);
      const runsData = Array.isArray(runsResponse) ? runsResponse : (runsResponse as any).data || [];
      const periodsData = Array.isArray(periodsResponse) ? periodsResponse : (periodsResponse as any).data || [];
      setRuns(runsData);
      setPeriods(periodsData);
    } catch (error: any) {
      message.error(t('common:errors.fetch_failed'));
      console.error('Failed to load payroll runs:', error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 事件处理函数
  const handleCreate = () => {
    setEditingRun(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (run: PayrollRun) => {
    setEditingRun(run);
    form.setFieldsValue({
      payroll_period_id: run.payroll_period_id,
      run_date: dayjs(run.run_date),
      description: (run as any).description,
    });
    setModalVisible(true);
  };

  const handleViewDetails = (runId: number) => {
    navigate(`/payroll/runs/${runId}`);
  };

  const handleDelete = (runId: number) => {
    modal.confirm({
      title: t('common:confirm_delete'),
      content: t('payroll:confirm_delete_run'),
      onOk: async () => {
        try {
          await deletePayrollRun(runId);
          message.success(t('common:delete_success'));
          loadData();
        } catch (error: any) {
          message.error(t('common:delete_failed'));
        }
      },
    });
  };

  const handleCalculate = async (run: PayrollRun) => {
    try {
      setLoading(true);
      const request = {
        run_id: run.id,
        period_id: run.payroll_period_id,
      } as any;
      
      await payrollCalculationApi.triggerCalculation(request);
      message.success(t('payroll:calculation_started'));
      loadData();
    } catch (error: any) {
      message.error(t('payroll:calculation_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportBankFile = async (runId: number) => {
    try {
      const blob = await exportPayrollRunBankFile(runId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_run_${runId}_bank_file.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(t('payroll:export_success'));
    } catch (error: any) {
      message.error(t('payroll:export_failed'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        run_date: values.run_date.format('YYYY-MM-DD'),
      };

      if (editingRun) {
        await updatePayrollRun(editingRun.id, submitData);
        message.success(t('common:update_success'));
      } else {
        await createPayrollRun(submitData);
        message.success(t('common:create_success'));
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(editingRun ? t('common:update_failed') : t('common:create_failed'));
    }
  };

  // 统计数据
  const statistics = useMemo(() => {
    const total = runs.length;
    const pending = runs.filter(run => {
      const statusInfo = getPayrollRunStatusInfo(run.status_lookup_value_id);
      return statusInfo.type === 'processing';
    }).length;
    const completed = runs.filter(run => {
      const statusInfo = getPayrollRunStatusInfo(run.status_lookup_value_id);
      return statusInfo.type === 'success';
    }).length;
    const totalEmployees = runs.reduce((sum, run) => sum + (run.total_employees || 0), 0);

    return [
      {
        title: t('payroll:total_runs'),
        value: total,
        icon: <FileTextOutlined />,
        color: 'var(--color-primary)',
      },
      {
        title: t('payroll:pending_runs'),
        value: pending,
        icon: <PlayCircleOutlined />,
        color: 'var(--color-warning)',
      },
      {
        title: t('payroll:completed_runs'),
        value: completed,
        icon: <CheckCircleOutlined />,
        color: 'var(--color-success)',
      },
      {
        title: t('payroll:total_employees_processed'),
        value: totalEmployees,
        icon: <DatabaseOutlined />,
        color: 'var(--color-info)',
      },
    ];
  }, [runs, t]);

  return (
    <ModernPageTemplate
      title={t('payroll:payroll_runs')}
      headerExtra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          className="modern-button"
        >
          {t('payroll:create_run')}
        </Button>
      }
    >
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statistics.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <ModernCard
              title={stat.title}
              icon={stat.icon}
            >
              <div className="statistic-content">
                <div className="statistic-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            </ModernCard>
          </Col>
        ))}
      </Row>

      {/* 主表格 */}
      <ModernCard>
        <ProTable<PayrollRun>
          columns={columns}
          dataSource={runs}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total} ${t('common:items')}`,
          }}
          scroll={{ x: 1200 }}
          search={false}
          options={{
            reload: loadData,
            density: true,
            fullScreen: true,
            setting: true,
          }}
          toolBarRender={() => [
            <Button
              key="refresh"
              onClick={loadData}
              icon={<DatabaseOutlined />}
            >
              {t('common:refresh')}
            </Button>,
          ]}
        />
      </ModernCard>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingRun ? t('payroll:edit_run') : t('payroll:create_run')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
        >
          <Form.Item
            label={t('payroll:payroll_period')}
            name="payroll_period_id"
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <Select
              placeholder={t('payroll:select_period')}
              showSearch
              optionFilterProp="children"
            >
              {periods.map(period => (
                <Option key={period.id} value={period.id}>
                  {period.name} ({dayjs(period.start_date).format('YYYY-MM-DD')} - {dayjs(period.end_date).format('YYYY-MM-DD')})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('payroll:run_date')}
            name="run_date"
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label={t('common:description')}
            name="description"
          >
            <Input.TextArea rows={3} placeholder={t('payroll:run_description_placeholder')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRun ? t('common:update') : t('common:create')}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                {t('common:cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </ModernPageTemplate>
  );
};

export default PayrollRunsPageModern;