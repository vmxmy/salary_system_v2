import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Statistic, Row, Col, Card, Alert, Spin, message, Descriptions, Tag } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, CalculatorOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { CalculationResult, CalculationRequest } from '../types/calculationConfig';
import { payrollCalculationApi } from '../services/payrollCalculationApi';

interface PayrollCalculationPreviewProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (results: CalculationResult[]) => void;
  calculationRequest: CalculationRequest | null;
  payrollPeriodName?: string;
}

const PayrollCalculationPreview: React.FC<PayrollCalculationPreviewProps> = ({
  visible,
  onCancel,
  onConfirm,
  calculationRequest,
  payrollPeriodName
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [confirming, setConfirming] = useState(false);

  // 计算汇总数据
  const summary = React.useMemo(() => {
    if (!results.length) return null;

    return {
      totalEmployees: results.length,
      totalGrossSalary: results.reduce((sum, item) => sum + item.gross_salary, 0),
      totalNetSalary: results.reduce((sum, item) => sum + item.net_salary, 0),
      totalTax: results.reduce((sum, item) => sum + item.tax_amount, 0),
      totalSocialInsuranceEmployee: results.reduce((sum, item) => sum + item.social_insurance_employee, 0),
      totalSocialInsuranceEmployer: results.reduce((sum, item) => sum + item.social_insurance_employer, 0),
      totalHousingFundEmployee: results.reduce((sum, item) => sum + item.housing_fund_employee, 0),
      totalHousingFundEmployer: results.reduce((sum, item) => sum + item.housing_fund_employer, 0),
    };
  }, [results]);

  // 表格列定义
  const columns: ColumnsType<CalculationResult> = [
    {
      title: t('payroll:employee_name'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120,
      fixed: 'left',
    },
    {
      title: t('payroll:basic_salary'),
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      width: 100,
      align: 'right',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: t('payroll:gross_salary'),
      dataIndex: 'gross_salary',
      key: 'gross_salary',
      width: 100,
      align: 'right',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: t('payroll:tax_amount'),
      dataIndex: 'tax_amount',
      key: 'tax_amount',
      width: 100,
      align: 'right',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: t('payroll:social_insurance_employee'),
      dataIndex: 'social_insurance_employee',
      key: 'social_insurance_employee',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: t('payroll:housing_fund_employee'),
      dataIndex: 'housing_fund_employee',
      key: 'housing_fund_employee',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: t('payroll:net_salary'),
      dataIndex: 'net_salary',
      key: 'net_salary',
      width: 100,
      align: 'right',
      fixed: 'right',
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          ¥{amount.toLocaleString()}
        </span>
      ),
    },
  ];

  // 加载预览数据
  const loadPreviewData = async () => {
    if (!calculationRequest) return;

    try {
      setLoading(true);
      const response = await payrollCalculationApi.previewCalculation(calculationRequest);
      setResults(response.data);
    } catch (error: any) {
      message.error(t('payroll:calculation_preview.load_failed'));
      console.error('Failed to load calculation preview:', error);
    } finally {
      setLoading(false);
    }
  };

  // 确认计算
  const handleConfirm = async () => {
    try {
      setConfirming(true);
      onConfirm(results);
    } catch (error) {
      message.error(t('payroll:calculation_preview.confirm_failed'));
    } finally {
      setConfirming(false);
    }
  };

  // 当模态框打开且有计算请求时加载数据
  useEffect(() => {
    if (visible && calculationRequest) {
      loadPreviewData();
    }
  }, [visible, calculationRequest]);

  return (
    <Modal
      title={
        <Space>
          <CalculatorOutlined />
          {t('payroll:calculation_preview.title')}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('common:cancel')}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={confirming}
          disabled={!results.length}
          onClick={handleConfirm}
        >
          {t('payroll:calculation_preview.confirm_calculation')}
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {/* 计算信息 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label={t('payroll:payroll_period')}>
              {payrollPeriodName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:calculation_preview.calculation_mode')}>
              <Tag color={calculationRequest?.async_mode ? 'orange' : 'blue'}>
                {calculationRequest?.async_mode ? t('payroll:calculation_preview.async_mode') : t('payroll:calculation_preview.sync_mode')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:calculation_preview.employee_count')}>
              <Space>
                <UserOutlined />
                {calculationRequest?.employee_ids?.length || t('payroll:calculation_preview.all_employees')}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:calculation_preview.calculation_time')}>
              {new Date().toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 汇总统计 */}
        {summary && (
          <Card
            title={t('payroll:calculation_preview.summary')}
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={t('payroll:calculation_preview.total_employees')}
                  value={summary.totalEmployees}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('payroll:calculation_preview.total_gross_salary')}
                  value={summary.totalGrossSalary}
                  precision={2}
                  prefix="¥"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('payroll:calculation_preview.total_net_salary')}
                  value={summary.totalNetSalary}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('payroll:calculation_preview.total_tax')}
                  value={summary.totalTax}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Statistic
                  title={t('payroll:calculation_preview.total_social_insurance_employee')}
                  value={summary.totalSocialInsuranceEmployee}
                  precision={2}
                  prefix="¥"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('payroll:calculation_preview.total_social_insurance_employer')}
                  value={summary.totalSocialInsuranceEmployer}
                  precision={2}
                  prefix="¥"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('payroll:calculation_preview.total_housing_fund_employee')}
                  value={summary.totalHousingFundEmployee}
                  precision={2}
                  prefix="¥"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('payroll:calculation_preview.total_housing_fund_employer')}
                  value={summary.totalHousingFundEmployer}
                  precision={2}
                  prefix="¥"
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* 提示信息 */}
        <Alert
          message={t('payroll:calculation_preview.preview_notice')}
          description={t('payroll:calculation_preview.preview_description')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 计算结果表格 */}
        <Table
          columns={columns}
          dataSource={results}
          rowKey="employee_id"
          scroll={{ x: 800, y: 400 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common:pagination.total', { total }),
          }}
          size="small"
        />
      </Spin>
    </Modal>
  );
};

export default PayrollCalculationPreview; 