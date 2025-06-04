import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Space, 
  Button, 
  Alert, 
  Table, 
  Tag, 
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  InputNumber,
  Tooltip,
  Popconfirm,
  message
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  EditOutlined,
  EyeOutlined,
  WarningOutlined,
  AuditOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ProCard, ProTable, ProDescriptions } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';

import type { UsePayrollWorkflowReturn } from '../../hooks/usePayrollWorkflow';
import type { PayrollEntry } from '../../types/payrollTypes';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface PayrollReviewStepProps {
  workflow: UsePayrollWorkflowReturn;
}

// 薪资条目状态常量
const PAYROLL_ENTRY_STATUS = {
  PENDING: 'PENDING',      // 待复核
  APPROVED: 'APPROVED',    // 已复核
  REJECTED: 'REJECTED',    // 有异常
  ADJUSTED: 'ADJUSTED'     // 已调整
} as const;

// 异常类型常量
const EXCEPTION_TYPES = {
  CALCULATION_ERROR: 'CALCULATION_ERROR',     // 计算错误
  MISSING_DATA: 'MISSING_DATA',               // 数据缺失
  ABNORMAL_AMOUNT: 'ABNORMAL_AMOUNT',         // 金额异常
  POLICY_VIOLATION: 'POLICY_VIOLATION'        // 政策违规
} as const;

interface PayrollEntryWithStatus extends PayrollEntry {
  review_status?: string;
  exception_type?: string;
  exception_notes?: string;
  reviewer_notes?: string;
  is_selected?: boolean;
  // 添加必需的显示字段
  department_name?: string;
  position_name?: string;
}

/**
 * 工资周期复核步骤组件
 */
export const PayrollReviewStep: React.FC<PayrollReviewStepProps> = ({ workflow }) => {
  const { t } = useTranslation(['payroll', 'common']);

  const {
    currentPayrollRun,
    calculationSummary,
    selectedPeriodId
  } = workflow;

  // 本地状态
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntryWithStatus[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<PayrollEntryWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<PayrollEntryWithStatus | null>(null);
  const [batchReviewForm] = Form.useForm();
  const [adjustForm] = Form.useForm();

  // 加载薪资条目数据
  useEffect(() => {
    if (currentPayrollRun?.id) {
      loadPayrollEntries();
    }
  }, [currentPayrollRun?.id]);

  /**
   * 加载薪资条目数据
   */
  const loadPayrollEntries = async () => {
    if (!currentPayrollRun?.id) return;

    setLoading(true);
    try {
      // 这里应该调用API获取薪资条目数据
      // const response = await payrollWorkflowApi.getPayrollEntries(currentPayrollRun.id);
      
      // 模拟数据，实际应该从API获取
      const mockData: PayrollEntryWithStatus[] = [
        {
          id: 1,
          payroll_run_id: currentPayrollRun.id,
          payroll_period_id: selectedPeriodId || 1,
          employee_id: 101,
          employee_name: '张三',
          department_name: '技术部',
          position_name: '软件工程师',
          gross_pay: 15000,
          total_deductions: 3500,
          net_pay: 11500,
          status_lookup_value_id: 1,
          review_status: PAYROLL_ENTRY_STATUS.PENDING,
          earnings_details: {
            base_salary: { amount: 12000, name: '基本工资' },
            performance_bonus: { amount: 2000, name: '绩效奖金' },
            overtime_pay: { amount: 1000, name: '加班费' }
          },
          deductions_details: {
            social_insurance: { amount: 1500, name: '社保' },
            housing_fund: { amount: 1200, name: '公积金' },
            personal_tax: { amount: 800, name: '个税' }
          }
        },
        {
          id: 2,
          payroll_run_id: currentPayrollRun.id,
          payroll_period_id: selectedPeriodId || 1,
          employee_id: 102,
          employee_name: '李四',
          department_name: '技术部',
          position_name: '高级工程师',
          gross_pay: 22000,
          total_deductions: 5500,
          net_pay: 16500,
          status_lookup_value_id: 1,
          review_status: PAYROLL_ENTRY_STATUS.REJECTED,
          exception_type: EXCEPTION_TYPES.ABNORMAL_AMOUNT,
          exception_notes: '个税计算异常，超出正常范围',
          earnings_details: {
            base_salary: { amount: 18000, name: '基本工资' },
            performance_bonus: { amount: 3000, name: '绩效奖金' },
            overtime_pay: { amount: 1000, name: '加班费' }
          },
          deductions_details: {
            social_insurance: { amount: 2200, name: '社保' },
            housing_fund: { amount: 1800, name: '公积金' },
            personal_tax: { amount: 1500, name: '个税' }
          }
        }
      ];

      setPayrollEntries(mockData);
    } catch (error) {
      message.error('加载薪资数据失败');
      console.error('加载薪资数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取状态标签颜色
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case PAYROLL_ENTRY_STATUS.APPROVED: return 'green';
      case PAYROLL_ENTRY_STATUS.REJECTED: return 'red';
      case PAYROLL_ENTRY_STATUS.ADJUSTED: return 'blue';
      default: return 'orange';
    }
  };

  /**
   * 获取状态显示文本
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case PAYROLL_ENTRY_STATUS.APPROVED: return '已复核';
      case PAYROLL_ENTRY_STATUS.REJECTED: return '有异常';
      case PAYROLL_ENTRY_STATUS.ADJUSTED: return '已调整';
      default: return '待复核';
    }
  };

  /**
   * 检查是否有异常数据
   */
  const hasExceptions = () => {
    return payrollEntries.some(entry => 
      entry.review_status === PAYROLL_ENTRY_STATUS.REJECTED ||
      entry.exception_type
    );
  };

  /**
   * 获取统计信息
   */
  const getStatistics = () => {
    const total = payrollEntries.length;
    const approved = payrollEntries.filter(e => e.review_status === PAYROLL_ENTRY_STATUS.APPROVED).length;
    const rejected = payrollEntries.filter(e => e.review_status === PAYROLL_ENTRY_STATUS.REJECTED).length;
    const pending = payrollEntries.filter(e => e.review_status === PAYROLL_ENTRY_STATUS.PENDING).length;
    
    return { total, approved, rejected, pending };
  };

  /**
   * 处理单个条目复核
   */
  const handleReviewEntry = (entry: PayrollEntryWithStatus) => {
    setCurrentEntry(entry);
    setReviewModalVisible(true);
  };

  /**
   * 处理单个条目调整
   */
  const handleAdjustEntry = (entry: PayrollEntryWithStatus) => {
    setCurrentEntry(entry);
    adjustForm.setFieldsValue({
      gross_pay: entry.gross_pay,
      total_deductions: entry.total_deductions,
      net_pay: entry.net_pay,
      adjustment_reason: ''
    });
    setAdjustModalVisible(true);
  };

  /**
   * 处理批量复核
   */
  const handleBatchReview = () => {
    if (selectedEntries.length === 0) {
      message.warning('请先选择要复核的条目');
      return;
    }
    setReviewModalVisible(true);
  };

  /**
   * 表格列定义
   */
  const columns: ProColumns<PayrollEntryWithStatus>[] = [
    {
      title: '选择',
      dataIndex: 'is_selected',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedEntries.includes(record)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedEntries([...selectedEntries, record]);
            } else {
              setSelectedEntries(selectedEntries.filter(item => item.id !== record.id));
            }
          }}
        />
      )
    },
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      width: 100,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.department_name}</div>
        </div>
      )
    },
    {
      title: '职位',
      dataIndex: 'position_name',
      width: 120
    },
    {
      title: '应发工资',
      dataIndex: 'gross_pay',
      width: 100,
      align: 'right',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '扣款合计',
      dataIndex: 'total_deductions',
      width: 100,
      align: 'right',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '实发工资',
      dataIndex: 'net_pay',
      width: 100,
      align: 'right',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '复核状态',
      dataIndex: 'review_status',
      width: 100,
      render: (_, record) => (
        <div>
          <Tag color={getStatusColor(record.review_status || PAYROLL_ENTRY_STATUS.PENDING)}>
            {getStatusText(record.review_status || PAYROLL_ENTRY_STATUS.PENDING)}
          </Tag>
          {record.exception_type && (
            <Tooltip title={record.exception_notes}>
              <WarningOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleReviewEntry(record)}
            />
          </Tooltip>
          <Tooltip title="复核">
            <Button 
              type="link" 
              size="small" 
              icon={<AuditOutlined />}
              onClick={() => handleReviewEntry(record)}
            />
          </Tooltip>
          <Tooltip title="调整">
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleAdjustEntry(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (!currentPayrollRun) {
    return (
      <Alert
        message="请先完成前面的步骤"
        description="需要先选择薪资周期并完成工资计算，才能进行复核操作。"
        type="info"
        showIcon
      />
    );
  }

  const statistics = getStatistics();

  return (
    <>
      {/* 复核概览 */}
      <ProCard title="复核概览" style={{ marginBottom: 24 }}>
        <ProDescriptions column={4}>
          <ProDescriptions.Item label="总条目数">
            <Text strong style={{ fontSize: '16px' }}>{statistics.total}</Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="已复核">
            <Text style={{ color: '#52c41a', fontSize: '16px', fontWeight: 500 }}>
              {statistics.approved}
            </Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="有异常">
            <Text style={{ color: '#ff4d4f', fontSize: '16px', fontWeight: 500 }}>
              {statistics.rejected}
            </Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="待复核">
            <Text style={{ color: '#fa8c16', fontSize: '16px', fontWeight: 500 }}>
              {statistics.pending}
            </Text>
          </ProDescriptions.Item>
        </ProDescriptions>
        
        {hasExceptions() && (
          <Alert
            message="发现异常数据"
            description="存在需要处理的异常薪资数据，请及时处理后再进行批量复核。"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </ProCard>

      {/* 操作工具栏 */}
      <ProCard style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            onClick={handleBatchReview}
            disabled={selectedEntries.length === 0}
          >
            批量复核 ({selectedEntries.length})
          </Button>
          <Button onClick={loadPayrollEntries} icon={<ReloadOutlined />}>
            刷新数据
          </Button>
          <Button>导出异常数据</Button>
        </Space>
      </ProCard>

      {/* 薪资数据表格 */}
      <ProTable<PayrollEntryWithStatus>
        headerTitle="薪资明细数据"
        dataSource={payrollEntries}
        columns={columns}
        loading={loading}
        rowKey="id"
        search={false}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        scroll={{ x: 800 }}
      />

      {/* 复核模态框 */}
      <Modal
        title={selectedEntries.length > 1 ? `批量复核 (${selectedEntries.length}条)` : '复核薪资数据'}
        open={reviewModalVisible}
        onOk={() => {
          batchReviewForm.validateFields().then(values => {
            console.log('复核表单数据:', values);
            // 这里应该调用API提交复核结果
            message.success('复核完成');
            setReviewModalVisible(false);
            batchReviewForm.resetFields();
            setSelectedEntries([]);
            loadPayrollEntries();
          });
        }}
        onCancel={() => {
          setReviewModalVisible(false);
          batchReviewForm.resetFields();
        }}
        width={600}
      >
        <Form form={batchReviewForm} layout="vertical">
          <Form.Item
            name="review_result"
            label="复核结果"
            rules={[{ required: true, message: '请选择复核结果' }]}
          >
            <Select placeholder="请选择复核结果">
              <Select.Option value="approved">复核通过</Select.Option>
              <Select.Option value="rejected">发现异常</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="exception_type"
            label="异常类型"
            dependencies={['review_result']}
            rules={[
              ({ getFieldValue }) => ({
                required: getFieldValue('review_result') === 'rejected',
                message: '发现异常时必须选择异常类型'
              })
            ]}
          >
            <Select placeholder="请选择异常类型">
              <Select.Option value={EXCEPTION_TYPES.CALCULATION_ERROR}>计算错误</Select.Option>
              <Select.Option value={EXCEPTION_TYPES.MISSING_DATA}>数据缺失</Select.Option>
              <Select.Option value={EXCEPTION_TYPES.ABNORMAL_AMOUNT}>金额异常</Select.Option>
              <Select.Option value={EXCEPTION_TYPES.POLICY_VIOLATION}>政策违规</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reviewer_notes"
            label="复核备注"
            rules={[{ required: true, message: '请填写复核备注' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请详细描述复核情况、发现的问题或处理建议..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 调整模态框 */}
      <Modal
        title="调整薪资数据"
        open={adjustModalVisible}
        onOk={() => {
          adjustForm.validateFields().then(values => {
            console.log('调整表单数据:', values);
            // 这里应该调用API提交调整数据
            message.success('调整完成');
            setAdjustModalVisible(false);
            adjustForm.resetFields();
            loadPayrollEntries();
          });
        }}
        onCancel={() => {
          setAdjustModalVisible(false);
          adjustForm.resetFields();
        }}
        width={600}
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            name="gross_pay"
            label="应发工资"
            rules={[{ required: true, message: '请输入应发工资' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            name="total_deductions"
            label="扣款合计"
            rules={[{ required: true, message: '请输入扣款合计' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            name="net_pay"
            label="实发工资"
            rules={[{ required: true, message: '请输入实发工资' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            name="adjustment_reason"
            label="调整原因"
            rules={[{ required: true, message: '请填写调整原因' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="请详细说明调整的原因和依据..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}; 