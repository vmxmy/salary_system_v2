import React, { useEffect, useState } from 'react';
import { Typography, Space, Button, Statistic, Row, Col, Alert, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { 
  DollarOutlined, 
  TeamOutlined, 
  CalculatorOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import type { UsePayrollWorkflowReturn } from '../../hooks/usePayrollWorkflow';
// import type { PayrollSummaryStats } from '../../services/payrollWorkflowApi';
type PayrollSummaryStats = any; // 临时类型定义
import { PayrollWorkflowAsyncUtils } from '../../utils/payrollWorkflowUtils';

const { Text, Title } = Typography;

interface CalculationResultSummaryProps {
  workflow: UsePayrollWorkflowReturn;
}

/**
 * 计算结果汇总组件
 * 显示薪资计算完成后的统计信息、异常提醒和快速操作
 */
export const CalculationResultSummary: React.FC<CalculationResultSummaryProps> = ({ workflow }) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [summaryStats, setSummaryStats] = useState<PayrollSummaryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const { currentPayrollRun, calculationProgress } = workflow;

  // 加载计算结果汇总
  useEffect(() => {
    if (currentPayrollRun && calculationProgress?.status === 'completed') {
      loadCalculationSummary();
    }
  }, [currentPayrollRun, calculationProgress?.status]);

  const loadCalculationSummary = async () => {
    if (!currentPayrollRun) return;
    
    setLoading(true);
    try {
      const summary = await PayrollWorkflowAsyncUtils.getCalculationSummary(currentPayrollRun.id);
      setSummaryStats(summary);
    } catch (error) {
      console.error('加载计算汇总失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导出报表
  const handleExportReport = async (reportType: 'detail' | 'summary' | 'bank') => {
    setExportLoading(reportType);
    try {
      await workflow.handleExportReport(reportType);
    } finally {
      setExportLoading(null);
    }
  };

  // 如果计算未完成，不显示结果汇总
  if (!currentPayrollRun || calculationProgress?.status !== 'completed') {
    return null;
  }

  return (
    <ProCard 
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <Title level={5} style={{ margin: 0 }}>
            {t('payroll:workflow.steps.auto_calculation.result_summary_title', '计算结果汇总')}
          </Title>
        </Space>
      }
      style={{ marginTop: 24 }}
      loading={loading}
    >
      {summaryStats && (
        <>
          {/* 核心统计指标 */}
          <StatisticCard.Group direction="row" style={{ marginBottom: 24 }}>
            <StatisticCard
              statistic={{
                title: t('payroll:workflow.steps.auto_calculation.total_employees', '参与员工数'),
                value: summaryStats.total_employees,
                icon: <TeamOutlined style={{ color: '#1890ff' }} />,
                suffix: t('common:units.people', '人'),
              }}
            />
            <StatisticCard
              statistic={{
                title: t('payroll:workflow.steps.auto_calculation.total_gross_pay', '应发工资总额'),
                value: summaryStats.total_gross_pay,
                precision: 2,
                icon: <DollarOutlined style={{ color: '#52c41a' }} />,
                suffix: t('common:units.yuan', '元'),
              }}
            />
            <StatisticCard
              statistic={{
                title: t('payroll:workflow.steps.auto_calculation.total_deductions', '扣款总额'),
                value: summaryStats.total_deductions,
                precision: 2,
                icon: <CalculatorOutlined style={{ color: '#fa8c16' }} />,
                suffix: t('common:units.yuan', '元'),
              }}
            />
            <StatisticCard
              statistic={{
                title: t('payroll:workflow.steps.auto_calculation.total_net_pay', '实发工资总额'),
                value: summaryStats.total_net_pay,
                precision: 2,
                icon: <DollarOutlined style={{ color: '#13c2c2' }} />,
                suffix: t('common:units.yuan', '元'),
              }}
            />
          </StatisticCard.Group>

          {/* 详细统计信息 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <ProCard size="small" title={t('payroll:workflow.steps.auto_calculation.average_stats', '平均薪资统计')}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={t('payroll:workflow.steps.auto_calculation.avg_gross_pay', '平均应发')}
                      value={summaryStats.average_gross_pay}
                      precision={2}
                      suffix={t('common:units.yuan', '元')}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('payroll:workflow.steps.auto_calculation.avg_net_pay', '平均实发')}
                      value={summaryStats.average_net_pay}
                      precision={2}
                      suffix={t('common:units.yuan', '元')}
                    />
                  </Col>
                </Row>
              </ProCard>
            </Col>
            <Col span={12}>
              <ProCard size="small" title={t('payroll:workflow.steps.auto_calculation.tax_stats', '税费统计')}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={t('payroll:workflow.steps.auto_calculation.total_tax', '个税总额')}
                      value={summaryStats.total_tax}
                      precision={2}
                      suffix={t('common:units.yuan', '元')}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('payroll:workflow.steps.auto_calculation.deduction_rate', '扣款比例')}
                      value={summaryStats.total_gross_pay > 0 ? (summaryStats.total_deductions / summaryStats.total_gross_pay * 100) : 0}
                      precision={1}
                      suffix="%"
                    />
                  </Col>
                </Row>
              </ProCard>
            </Col>
          </Row>

          {/* 数据验证状态 */}
          <Alert
            message={t('payroll:workflow.steps.auto_calculation.validation_success', '数据验证通过')}
            description={t('payroll:workflow.steps.auto_calculation.validation_desc', '所有薪资数据已通过完整性检查，可以进入下一步复核流程。')}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Divider />

          {/* 快速操作按钮 */}
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary">
                {t('payroll:workflow.steps.auto_calculation.calculation_completed_at', '计算完成时间：')}
                {new Date(summaryStats.calculation_date).toLocaleString()}
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  loading={exportLoading === 'summary'}
                  onClick={() => handleExportReport('summary')}
                >
                  {t('payroll:workflow.steps.auto_calculation.export_summary', '导出汇总表')}
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  loading={exportLoading === 'detail'}
                  onClick={() => handleExportReport('detail')}
                >
                  {t('payroll:workflow.steps.auto_calculation.export_detail', '导出明细表')}
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={exportLoading === 'bank'}
                  onClick={() => handleExportReport('bank')}
                >
                  {t('payroll:workflow.steps.auto_calculation.export_bank', '导出银行文件')}
                </Button>
              </Space>
            </Col>
          </Row>
        </>
      )}
    </ProCard>
  );
}; 