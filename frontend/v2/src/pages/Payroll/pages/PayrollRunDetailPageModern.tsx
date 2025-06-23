import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Descriptions,
  Spin,
  Alert,
  Typography,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Tabs,
  Statistic,
  Progress,
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined,
  CalculatorOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';
import UnifiedTabs from '../../../components/common/UnifiedTabs';
import PayrollEntriesTable from '../components/PayrollEntriesTable';
import StatusTag from '../../../components/common/StatusTag';

import type { PayrollRun } from '../types/payrollTypes';
import { getPayrollRunById, exportPayrollRunBankFile } from '../services/payrollApi';
import { getPayrollRunStatusInfo } from '../utils/payrollUtils';

const { Title, Text } = Typography;

const PayrollRunDetailPageModern: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  
  const [runDetails, setRunDetails] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchRunDetails = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollRunById(id, { include_employee_details: true });
      const data = response.data || response;
      setRunDetails(data);
    } catch (err: any) {
      setError(err.message || t('payroll:error_fetch_details'));
      setRunDetails(null);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    if (runId) {
      const numericRunId = parseInt(runId, 10);
      if (!isNaN(numericRunId)) {
        fetchRunDetails(numericRunId);
      } else {
        setError(t('payroll:error_invalid_run_id'));
        setLoading(false);
      }
    } else {
      setError(t('payroll:error_no_run_id_provided'));
      setLoading(false);
    }
  }, [runId, fetchRunDetails, t]);

  // 生成批次名称
  const generateRunName = (run: PayrollRun): string => {
    const periodName = run.payroll_period?.name || t('payroll:period_id_prefix');
    const runDate = dayjs(run.run_date).format('YYYY-MM-DD');
    return `${periodName} - ${runDate}`;
  };

  const handleExportBankFile = async () => {
    if (!runDetails) return;
    
    try {
      const blob = await exportPayrollRunBankFile(runDetails.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_run_${runDetails.id}_bank_file.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出银行文件失败:', error);
    }
  };

  // 计算统计数据
  const statistics = useMemo(() => {
    if (!runDetails) return [];

    const statusInfo = getPayrollRunStatusInfo(runDetails.status_lookup_value_id);
    const totalEmployees = runDetails.total_employees || 0;
    const processedEmployees = (runDetails as any).processed_employees || 0;
    const progress = totalEmployees > 0 ? (processedEmployees / totalEmployees) * 100 : 0;

    return [
      {
        title: t('payroll:total_employees'),
        value: totalEmployees,
        icon: <TeamOutlined />,
        color: 'var(--color-primary)',
      },
      {
        title: t('payroll:processed_employees'),
        value: processedEmployees,
        icon: <CheckCircleOutlined />,
        color: 'var(--color-success)',
      },
      {
        title: t('payroll:processing_progress'),
        value: `${progress.toFixed(1)}%`,
        icon: <ClockCircleOutlined />,
        color: 'var(--color-info)',
      },
      {
        title: t('payroll:run_status'),
        value: t(`payroll:${statusInfo.key}`),
        icon: statusInfo.type === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />,
        color: statusInfo.type === 'success' ? 'var(--color-success)' : 'var(--color-warning)',
      },
    ];
  }, [runDetails, t]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip={t('common:loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        message={t('common:error')} 
        description={error} 
        type="error" 
        showIcon 
        style={{ margin: '20px' }} 
      />
    );
  }

  if (!runDetails) {
    return (
      <Alert 
        message={t('payroll:run_not_found')} 
        type="warning" 
        showIcon 
        style={{ margin: '20px' }} 
      />
    );
  }

  const statusInfo = getPayrollRunStatusInfo(runDetails.status_lookup_value_id);
  const runName = generateRunName(runDetails);

  // 标签页配置
  const tabItems = [
    {
      key: 'overview',
      label: (
        <Space>
          <FileTextOutlined />
          {t('payroll:overview')}
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <ModernCard title={t('payroll:run_information')}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label={t('payroll:run_id')}>
                  <Text strong>#{runDetails.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('payroll:run_name')}>
                  <Text strong>{runName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('payroll:payroll_period')}>
                  {runDetails.payroll_period?.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('payroll:run_date')}>
                  {dayjs(runDetails.run_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label={t('payroll:status')}>
                  <StatusTag 
                    status={statusInfo.type} 
                    text={t(`payroll:${statusInfo.key}`)} 
                  />
                </Descriptions.Item>
                <Descriptions.Item label={t('payroll:total_employees')}>
                  <Space>
                    <TeamOutlined style={{ color: 'var(--color-primary)' }} />
                    <Text strong>{runDetails.total_employees || 0}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('payroll:period_range')} span={2}>
                  {runDetails.payroll_period ? (
                    <Text>
                      {dayjs(runDetails.payroll_period.start_date).format('YYYY-MM-DD')} 
                      {' 至 '} 
                      {dayjs(runDetails.payroll_period.end_date).format('YYYY-MM-DD')}
                    </Text>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('payroll:description')} span={2}>
                  {(runDetails as any).description || t('common:no_description')}
                </Descriptions.Item>
              </Descriptions>
            </ModernCard>
          </Col>
        </Row>
      ),
    },
    {
      key: 'entries',
      label: (
        <Space>
          <DollarOutlined />
          {t('payroll:payroll_entries')}
          <Tag color="blue">{runDetails.total_employees || 0}</Tag>
        </Space>
      ),
      children: (
        <ModernCard>
          <PayrollEntriesTable 
            payrollRunId={runDetails.id}
          />
        </ModernCard>
      ),
    },
  ];

  return (
    <ModernPageTemplate
      title={runName}
      subtitle={`ID: ${runDetails.id}`}
      headerExtra={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/payroll/runs')}
          >
            {t('common:back')}
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/payroll/runs/${runDetails.id}/edit`)}
          >
            {t('common:edit')}
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportBankFile}
          >
            {t('payroll:export_bank_file')}
          </Button>
        </Space>
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

      {/* 进度条 (如果有处理进度的话) */}
      {(runDetails.total_employees || 0) > 0 && (
        <ModernCard 
          title={t('payroll:processing_progress')} 
          style={{ marginBottom: 24 }}
        >
          <Progress
            percent={((runDetails as any).processed_employees || 0) / (runDetails.total_employees || 1) * 100}
            status={statusInfo.type === 'success' ? 'success' : 'active'}
            showInfo={true}
            format={(percent) => `${(runDetails as any).processed_employees || 0} / ${runDetails.total_employees || 0}`}
          />
        </ModernCard>
      )}

      {/* 详情标签页 */}
      <ModernCard>
        <UnifiedTabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
        />
      </ModernCard>
    </ModernPageTemplate>
  );
};

export default PayrollRunDetailPageModern;