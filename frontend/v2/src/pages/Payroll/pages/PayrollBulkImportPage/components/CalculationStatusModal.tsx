import React, { useState, useEffect } from 'react';
import {
  Modal,
  Progress,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Divider,
  Alert,
  Tag,
  Button,
  Steps,
  Card
} from 'antd';
import {
  CalculatorOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;

// 🎯 计算状态枚举
export enum CalculationStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  CALCULATING = 'calculating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 🎯 当前处理的员工信息
export interface CurrentEmployee {
  id: number;
  name: string;
  department: string;
  position: string;
}

// 🎯 计算进度信息
export interface CalculationProgress {
  total: number;
  processed: number;
  current_employee: CurrentEmployee | null;
  status: CalculationStatus;
  stage: string; // 当前阶段：'准备数据' | '基础薪资计算' | '五险一金计算' | '汇总统计'
  start_time: string;
  estimated_remaining_time?: number; // 预计剩余时间（秒）
}

// 🎯 计算结果
export interface CalculationResult {
  success_count: number;
  error_count: number;
  total_processed: number;
  payroll_totals: {
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
    total_employer_cost: number;
  };
  social_insurance_breakdown: {
    employee_totals: {
      social_insurance: number;
      housing_fund: number;
      total: number;
    };
    employer_totals: {
      social_insurance: number;
      housing_fund: number;
      total: number;
    };
  };
  cost_analysis: {
    social_cost_ratio: number;
  };
  errors?: Array<{
    employee_id: number;
    employee_name: string;
    error_message: string;
  }>;
  duration: number; // 计算耗时（秒）
}

// 🎯 组件Props
export interface CalculationStatusModalProps {
  visible: boolean;
  progress: CalculationProgress | null;
  result: CalculationResult | null;
  onClose: () => void;
  onRetry?: () => void;
}

const CalculationStatusModal: React.FC<CalculationStatusModalProps> = ({
  visible,
  progress,
  result,
  onClose,
  onRetry
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  // 🎯 实时更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🎯 计算完成百分比
  const getProgressPercent = (): number => {
    if (!progress) return 0;
    if (progress.status === CalculationStatus.COMPLETED) return 100;
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  // 🎯 获取状态颜色
  const getStatusColor = (status: CalculationStatus): string => {
    switch (status) {
      case CalculationStatus.PREPARING:
        return '#1890ff';
      case CalculationStatus.CALCULATING:
        return '#52c41a';
      case CalculationStatus.COMPLETED:
        return '#52c41a';
      case CalculationStatus.FAILED:
        return '#f5222d';
      default:
        return '#8c8c8c';
    }
  };

  // 🎯 获取状态图标
  const getStatusIcon = (status: CalculationStatus) => {
    switch (status) {
      case CalculationStatus.PREPARING:
        return <LoadingOutlined spin style={{ color: '#1890ff' }} />;
      case CalculationStatus.CALCULATING:
        return <LoadingOutlined spin style={{ color: '#52c41a' }} />;
      case CalculationStatus.COMPLETED:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case CalculationStatus.FAILED:
        return <WarningOutlined style={{ color: '#f5222d' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  // 🎯 获取计算阶段步骤
  const getCalculationSteps = () => {
    if (!progress) return [];
    
    const steps = [
      { title: '准备数据', description: '加载员工信息和配置' },
      { title: '基础薪资计算', description: '计算应发工资和基础扣除' },
      { title: '五险一金计算', description: '计算社保和公积金' },
      { title: '汇总统计', description: '生成最终报告' }
    ];
    
    const stageIndex = steps.findIndex(step => step.title === progress.stage);
    return steps.map((step, index) => ({
      ...step,
      status: index < stageIndex ? 'finish' : index === stageIndex ? 'process' : 'wait'
    }));
  };

  // 🎯 渲染计算进行中的内容
  const renderCalculatingContent = () => {
    if (!progress || (progress.status !== CalculationStatus.CALCULATING && progress.status !== CalculationStatus.PREPARING)) {
      return null;
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {/* 主要进度条 */}
        <div style={{ marginBottom: '24px' }}>
          <Progress
            type="circle"
            percent={getProgressPercent()}
            width={120}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            format={() => (
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{getProgressPercent()}%</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {progress.processed}/{progress.total}
                </div>
              </div>
            )}
          />
        </div>

        {/* 当前处理的员工 */}
        {progress.current_employee && (
          <Card 
            size="small" 
            style={{ 
              marginBottom: '16px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f'
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                <Text strong style={{ fontSize: '14px' }}>
                  正在处理：{progress.current_employee.name}
                </Text>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {progress.current_employee.department} - {progress.current_employee.position}
              </div>
            </Space>
          </Card>
        )}

        {/* 计算阶段步骤 */}
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
            📋 当前阶段：{progress.stage}
          </Text>
          <Steps
            current={getCalculationSteps().findIndex(step => step.status === 'process')}
            size="small"
            direction="horizontal"
            items={getCalculationSteps().map(step => ({
              title: step.title,
              description: step.description
            }))}
          />
        </div>

        {/* 预计剩余时间 */}
        {progress.estimated_remaining_time && (
          <Alert
            message={`预计剩余时间：${Math.ceil(progress.estimated_remaining_time / 60)} 分钟`}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={8}>
            <Statistic
              title="已处理"
              value={progress.processed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="总计"
              value={progress.total}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="剩余"
              value={progress.total - progress.processed}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>
      </div>
    );
  };

  // 🎯 渲染计算完成的结果
  const renderCompletedContent = () => {
    if (!result || !progress || progress.status !== CalculationStatus.COMPLETED) {
      return null;
    }

    const hasErrors = result.error_count > 0;

    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {/* 完成状态 */}
        <div style={{ marginBottom: '24px' }}>
          <CheckCircleOutlined 
            style={{ 
              fontSize: '48px', 
              color: '#52c41a',
              marginBottom: '16px'
            }} 
          />
          <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
            🎉 计算完成！
          </Title>
          <Text type="secondary">
            耗时 {result.duration} 秒，共处理 {result.total_processed} 名员工
          </Text>
        </div>

        {/* 处理结果统计 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Statistic
              title="成功处理"
              value={result.success_count}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="人"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="处理失败"
              value={result.error_count}
              prefix={<WarningOutlined style={{ color: result.error_count > 0 ? '#f5222d' : '#8c8c8c' }} />}
              valueStyle={{ color: result.error_count > 0 ? '#f5222d' : '#8c8c8c' }}
              suffix="人"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="成功率"
              value={((result.success_count / result.total_processed) * 100).toFixed(1)}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix="%"
            />
          </Col>
        </Row>

        <Divider />

        {/* 薪资汇总 */}
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ fontSize: '14px', marginBottom: '12px', display: 'block' }}>
            💰 薪资汇总结果
          </Text>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="应发合计"
                value={result.payroll_totals.total_gross_pay}
                precision={2}
                valueStyle={{ color: '#52c41a', fontSize: '14px' }}
                suffix="元"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="扣发合计"
                value={result.payroll_totals.total_deductions}
                precision={2}
                valueStyle={{ color: '#f5222d', fontSize: '14px' }}
                suffix="元"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="实发合计"
                value={result.payroll_totals.total_net_pay}
                precision={2}
                valueStyle={{ color: '#1890ff', fontSize: '14px' }}
                suffix="元"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="单位成本"
                value={result.payroll_totals.total_employer_cost}
                precision={2}
                valueStyle={{ color: '#722ed1', fontSize: '14px' }}
                suffix="元"
              />
            </Col>
          </Row>
        </div>

        {/* 错误信息 */}
        {hasErrors && result.errors && (
          <Alert
            type="warning"
            message={`发现 ${result.error_count} 个处理错误`}
            description={
              <div style={{ marginTop: '8px', textAlign: 'left' }}>
                {result.errors.slice(0, 3).map((error, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Text code>{error.employee_name}(ID:{error.employee_id})</Text>: {error.error_message}
                  </div>
                ))}
                {result.errors.length > 3 && (
                  <Text type="secondary">... 还有 {result.errors.length - 3} 个错误</Text>
                )}
              </div>
            }
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </div>
    );
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      centered
      width={720}
      style={{ top: 20 }}
      maskClosable={false}
      keyboard={false}
      footer={
        progress?.status === CalculationStatus.COMPLETED ? (
          <Space>
            {onRetry && (
              <Button onClick={onRetry}>
                重新计算
              </Button>
            )}
            <Button type="primary" onClick={onClose}>
              确定
            </Button>
          </Space>
        ) : progress?.status === CalculationStatus.FAILED ? (
          <Space>
            {onRetry && (
              <Button type="primary" onClick={onRetry}>
                重试
              </Button>
            )}
            <Button onClick={onClose}>
              取消
            </Button>
          </Space>
        ) : null
      }
      title={
        <Space>
          <CalculatorOutlined style={{ color: getStatusColor(progress?.status || CalculationStatus.IDLE) }} />
          <span>集成计算引擎运行状态</span>
          <Tag color={getStatusColor(progress?.status || CalculationStatus.IDLE)}>
            {progress?.status === CalculationStatus.PREPARING && '准备中'}
            {progress?.status === CalculationStatus.CALCULATING && '计算中'}
            {progress?.status === CalculationStatus.COMPLETED && '已完成'}
            {progress?.status === CalculationStatus.FAILED && '失败'}
            {progress?.status === CalculationStatus.IDLE && '待机'}
          </Tag>
        </Space>
      }
    >
      {/* 计算进行中 */}
      {renderCalculatingContent()}
      
      {/* 计算完成 */}
      {renderCompletedContent()}
      
      {/* 失败状态 */}
      {progress?.status === CalculationStatus.FAILED && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <WarningOutlined style={{ fontSize: '48px', color: '#f5222d', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#f5222d' }}>计算失败</Title>
          <Text type="secondary">计算过程中发生错误，请检查数据后重试</Text>
        </div>
      )}
      
      {/* 空状态 */}
      {!progress && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <ClockCircleOutlined style={{ fontSize: '48px', color: '#8c8c8c', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#8c8c8c' }}>等待开始</Title>
          <Text type="secondary">计算引擎准备就绪，等待任务开始</Text>
        </div>
      )}
    </Modal>
  );
};

export default CalculationStatusModal; 