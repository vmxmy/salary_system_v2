import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  Table,
  Button,
  Space,
  Alert,
  Radio,
  Checkbox,
  Divider,
  Tag,
  message,
  Spin,
  Tooltip
} from 'antd';
import {
  EditOutlined,
  PlusOutlined,
  MinusOutlined,
  PercentageOutlined,
  CalculatorOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollRunResponse } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';

const { Option } = Select;
const { TextArea } = Input;

interface BatchAdjustmentModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  payrollRun: PayrollRunResponse;
}

interface AdjustmentRule {
  id: string;
  type: 'absolute' | 'percentage' | 'formula';
  component: string;
  componentName: string;
  operation: 'add' | 'subtract' | 'multiply' | 'set';
  value: number;
  condition?: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
    value: any;
  };
  description: string;
}

interface PayrollComponent {
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  category: string;
}

export const BatchAdjustmentModal: React.FC<BatchAdjustmentModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  payrollRun
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [adjustmentRules, setAdjustmentRules] = useState<AdjustmentRule[]>([]);
  const [availableComponents, setAvailableComponents] = useState<PayrollComponent[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  // 初始化数据
  useEffect(() => {
    if (visible) {
      fetchComponents();
      fetchEmployees();
    }
  }, [visible]);

  // 获取薪资组件
  const fetchComponents = async () => {
    try {
      const response = await simplePayrollApi.getPayrollComponents();
      setAvailableComponents(response.data || []);
    } catch (error) {
      message.error(t('simplePayroll:batchAdjust.errors.fetchComponents'));
    }
  };

  // 获取员工列表
  const fetchEmployees = async () => {
    try {
      const response = await simplePayrollApi.getPayrollEntries({ payroll_run_id: payrollRun.id });
      const employees = response.data?.items || [];
      setAllEmployees(employees);
      setSelectedEmployees(employees.map((emp: any) => emp.employee_code));
    } catch (error) {
      message.error(t('simplePayroll:batchAdjust.errors.fetchEmployees'));
    }
  };

  // 添加调整规则
  const addAdjustmentRule = () => {
    const newRule: AdjustmentRule = {
      id: `rule_${Date.now()}`,
      type: 'absolute',
      component: '',
      componentName: '',
      operation: 'add',
      value: 0,
      description: ''
    };
    setAdjustmentRules([...adjustmentRules, newRule]);
  };

  // 删除调整规则
  const removeAdjustmentRule = (ruleId: string) => {
    setAdjustmentRules(adjustmentRules.filter(rule => rule.id !== ruleId));
  };

  // 更新调整规则
  const updateAdjustmentRule = (ruleId: string, updates: Partial<AdjustmentRule>) => {
    setAdjustmentRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };

  // 预览调整结果
  const previewAdjustments = async () => {
    if (adjustmentRules.length === 0) {
      message.warning(t('simplePayroll:batchAdjust.warnings.noRules'));
      return;
    }

    try {
      setLoading(true);
      const preview = await simplePayrollApi.previewBatchAdjustment({
        payroll_run_id: payrollRun.id,
        employee_codes: selectedEmployees,
        adjustment_rules: adjustmentRules
      });
      setPreviewData(preview.affected_entries || []);
      setShowPreview(true);
    } catch (error: any) {
      message.error(error.message || t('simplePayroll:batchAdjust.errors.preview'));
    } finally {
      setLoading(false);
    }
  };

  // 执行批量调整
  const handleSubmit = async () => {
    if (!showPreview) {
      message.warning(t('simplePayroll:batchAdjust.warnings.previewFirst'));
      return;
    }

    try {
      setLoading(true);
      const result = await simplePayrollApi.executeBatchAdjustment({
        payroll_run_id: payrollRun.id,
        employee_codes: selectedEmployees,
        adjustment_rules: adjustmentRules,
        description: form.getFieldValue('description') || '批量调整'
      });

      message.success(t('simplePayroll:batchAdjust.messages.success', {
        count: result.affected_count
      }));
      onSuccess();
      handleClose();
    } catch (error: any) {
      message.error(error.message || t('simplePayroll:batchAdjust.errors.execute'));
    } finally {
      setLoading(false);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    form.resetFields();
    setAdjustmentRules([]);
    setPreviewData([]);
    setShowPreview(false);
    setSelectedEmployees([]);
    onCancel();
  };

  // 调整规则表格列
  const ruleColumns = [
    {
      title: t('simplePayroll:batchAdjust.columns.component'),
      dataIndex: 'componentName',
      key: 'component',
      width: 120,
      render: (text: string, record: AdjustmentRule) => (
        <Select
          value={record.component}
          onChange={(value) => {
            const component = availableComponents.find(c => c.code === value);
            updateAdjustmentRule(record.id, {
              component: value,
              componentName: component?.name || ''
            });
          }}
          placeholder={t('simplePayroll:batchAdjust.placeholders.selectComponent')}
          style={{ width: '100%' }}
        >
          {availableComponents.map(comp => (
            <Option key={comp.code} value={comp.code}>
              <Space>
                <Tag color={comp.type === 'EARNING' ? 'green' : 'orange'}>
                  {comp.type === 'EARNING' ? '收入' : '扣除'}
                </Tag>
                {comp.name}
              </Space>
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: t('simplePayroll:batchAdjust.columns.operation'),
      dataIndex: 'operation',
      key: 'operation',
      width: 100,
      render: (value: string, record: AdjustmentRule) => (
        <Select
          value={value}
          onChange={(val) => updateAdjustmentRule(record.id, { operation: val })}
          style={{ width: '100%' }}
        >
          <Option value="add">
            <Space><PlusOutlined />增加</Space>
          </Option>
          <Option value="subtract">
            <Space><MinusOutlined />减少</Space>
          </Option>
          <Option value="multiply">
            <Space><PercentageOutlined />乘以</Space>
          </Option>
          <Option value="set">
            <Space><EditOutlined />设为</Space>
          </Option>
        </Select>
      )
    },
    {
      title: t('simplePayroll:batchAdjust.columns.value'),
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (value: number, record: AdjustmentRule) => (
        <InputNumber
          value={value}
          onChange={(val) => updateAdjustmentRule(record.id, { value: val || 0 })}
          style={{ width: '100%' }}
          precision={2}
          min={0}
          formatter={(val) => record.operation === 'multiply' ? `${val}%` : `¥ ${val}`}
          parser={(val) => parseFloat(val?.replace(/¥\s?|%/g, '') || '0')}
        />
      )
    },
    {
      title: t('simplePayroll:batchAdjust.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string, record: AdjustmentRule) => (
        <Input
          value={value}
          onChange={(e) => updateAdjustmentRule(record.id, { description: e.target.value })}
          placeholder={t('simplePayroll:batchAdjust.placeholders.description')}
        />
      )
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 80,
      render: (_: any, record: AdjustmentRule) => (
        <Button
          type="link"
          danger
          icon={<MinusOutlined />}
          onClick={() => removeAdjustmentRule(record.id)}
          size="small"
        >
          删除
        </Button>
      )
    }
  ];

  // 预览表格列
  const previewColumns = [
    {
      title: t('simplePayroll:batchAdjust.preview.employeeCode'),
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 100
    },
    {
      title: t('simplePayroll:batchAdjust.preview.employeeName'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120
    },
    {
      title: t('simplePayroll:batchAdjust.preview.component'),
      dataIndex: 'component_name',
      key: 'component_name',
      width: 120
    },
    {
      title: t('simplePayroll:batchAdjust.preview.oldValue'),
      dataIndex: 'old_value',
      key: 'old_value',
      width: 100,
      render: (value: number) => `¥${value.toFixed(2)}`
    },
    {
      title: t('simplePayroll:batchAdjust.preview.newValue'),
      dataIndex: 'new_value',
      key: 'new_value',
      width: 100,
      render: (value: number) => `¥${value.toFixed(2)}`
    },
    {
      title: t('simplePayroll:batchAdjust.preview.difference'),
      dataIndex: 'difference',
      key: 'difference',
      width: 100,
      render: (value: number) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {value >= 0 ? '+' : ''}¥{value.toFixed(2)}
        </span>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <CalculatorOutlined />
          {t('simplePayroll:batchAdjust.title')}
          <Tag color="blue">{payrollRun.period_name}</Tag>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={1200}
      footer={null}
      maskClosable={false}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          {/* 基本信息 */}
          <Alert
            message={t('simplePayroll:batchAdjust.info.title')}
            description={t('simplePayroll:batchAdjust.info.description', {
              period: payrollRun.period_name,
              entries: payrollRun.total_entries
            })}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 员工选择 */}
          <Form.Item label={t('simplePayroll:batchAdjust.employeeSelection.title')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Button
                  size="small"
                  onClick={() => setSelectedEmployees(allEmployees.map(emp => emp.employee_code))}
                >
                  {t('simplePayroll:batchAdjust.employeeSelection.selectAll')}
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedEmployees([])}
                >
                  {t('simplePayroll:batchAdjust.employeeSelection.clearAll')}
                </Button>
                <span style={{ color: '#666', fontSize: '12px' }}>
                  {t('simplePayroll:batchAdjust.employeeSelection.selected', {
                    count: selectedEmployees.length,
                    total: allEmployees.length
                  })}
                </span>
              </Space>
              
              <Select
                mode="multiple"
                value={selectedEmployees}
                onChange={setSelectedEmployees}
                placeholder={t('simplePayroll:batchAdjust.employeeSelection.placeholder')}
                style={{ width: '100%' }}
                maxTagCount={5}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                }
              >
                {allEmployees.map(emp => (
                  <Option key={emp.employee_code} value={emp.employee_code}>
                    {emp.employee_code} - {emp.employee_name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Form.Item>

          <Divider>{t('simplePayroll:batchAdjust.rules.title')}</Divider>

          {/* 调整规则 */}
          <div style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 8 }}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addAdjustmentRule}
              >
                {t('simplePayroll:batchAdjust.rules.add')}
              </Button>
              <Tooltip title={t('simplePayroll:batchAdjust.rules.help')}>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            </Space>

            <Table
              columns={ruleColumns}
              dataSource={adjustmentRules}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: t('simplePayroll:batchAdjust.rules.empty')
              }}
            />
          </div>

          {/* 操作说明 */}
          <Form.Item
            name="description"
            label={t('simplePayroll:batchAdjust.description.label')}
          >
            <TextArea
              rows={3}
              placeholder={t('simplePayroll:batchAdjust.description.placeholder')}
            />
          </Form.Item>

          {/* 预览结果 */}
          {showPreview && (
            <>
              <Divider>{t('simplePayroll:batchAdjust.preview.title')}</Divider>
              <Alert
                message={t('simplePayroll:batchAdjust.preview.summary', {
                  count: previewData.length
                })}
                type="success"
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={previewColumns}
                dataSource={previewData}
                rowKey={(record) => `${record.employee_code}_${record.component_code}`}
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ y: 300 }}
              />
            </>
          )}

          {/* 操作按钮 */}
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={handleClose}>
                {t('common:cancel')}
              </Button>
              <Button
                type="default"
                onClick={previewAdjustments}
                disabled={adjustmentRules.length === 0 || selectedEmployees.length === 0}
                loading={loading}
              >
                {t('simplePayroll:batchAdjust.actions.preview')}
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={!showPreview}
                loading={loading}
              >
                {t('simplePayroll:batchAdjust.actions.execute')}
              </Button>
            </Space>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
}; 