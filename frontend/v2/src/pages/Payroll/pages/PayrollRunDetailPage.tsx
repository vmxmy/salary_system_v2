import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Descriptions,
  Spin,
  Alert,
  Typography,
  Breadcrumb,
  Card,
  Divider,
  Tag,
  Button,
  Space
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import type { PayrollRun } from '../types/payrollTypes';
import { getPayrollRunById } from '../services/payrollApi';
import PayrollEntriesTable from '../components/PayrollEntriesTable';
import { getPayrollRunStatusDisplay } from '../utils/payrollUtils';

const { Title, /* Paragraph, Text */ } = Typography;

const PayrollRunDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { runId } = useParams<{ runId: string }>();
  const [runDetails, setRunDetails] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRunDetails = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollRunById(id);
      setRunDetails(response.data);
    } catch (err: any) {
      setError(err.message || t('payroll_run_detail_page.error_fetch_details'));
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
        setError(t('payroll_run_detail_page.error_invalid_run_id'));
        setLoading(false);
      }
    } else {
      setError(t('payroll_run_detail_page.error_no_run_id_provided'));
      setLoading(false);
    }
  }, [runId, fetchRunDetails, t]);

  if (loading) {
    return <Spin tip={t('payroll_run_detail_page.spin_loading')} style={{ display: 'block', marginTop: '50px' }} />;
  }

  if (error) {
    return <Alert message={`${t('payroll_run_detail_page.alert_error_prefix')}${error}`} type="error" showIcon style={{ margin: '20px' }} />;
  }

  if (!runDetails) {
    return <Alert message={t('payroll_run_detail_page.alert_not_found')} type="warning" showIcon style={{ margin: '20px' }} />;
  }

  const statusInfo = getPayrollRunStatusDisplay(runDetails.status_lookup_value_id);

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item><Link to="/finance/payroll/runs">{t('payroll_run_detail_page.breadcrumb_runs_management')}</Link></Breadcrumb.Item>
        <Breadcrumb.Item>{t('payroll_run_detail_page.breadcrumb_current_page', { runId: runDetails.id })}</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={3} style={{ marginBottom: 0 }}>
            {t('payroll_run_detail_page.card_title', { runId: runDetails.id })}
          </Title>
          <Space>
            <Link to={`/finance/payroll/runs`}>
                <Button icon={<ArrowLeftOutlined />}>{t('payroll_run_detail_page.button_back_to_list')}</Button>
            </Link>
          </Space>
        </div>

        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_id')}>{runDetails.id}</Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_payroll_period')}>
            {runDetails.payroll_period ? 
              `${runDetails.payroll_period.name} (${t('payroll_run_detail_page.value_period_id_prefix')}${runDetails.payroll_period_id})` : 
              `${t('payroll_run_detail_page.value_period_id_prefix')}${runDetails.payroll_period_id}`}
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_run_date')}>{dayjs(runDetails.run_date).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_status')}>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_employee_count')}>{runDetails.employee_ids?.length || 0}</Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_created_by')}>{runDetails.created_by_user_id || t('payroll_run_detail_page.value_na')}</Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_created_at')}>{runDetails.created_at ? dayjs(runDetails.created_at).format('YYYY-MM-DD HH:mm:ss') : t('payroll_run_detail_page.value_na')}</Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_updated_at')}>{runDetails.updated_at ? dayjs(runDetails.updated_at).format('YYYY-MM-DD HH:mm:ss') : t('payroll_run_detail_page.value_na')}</Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_paid_at')} span={runDetails.paid_at ? 1 : 2}>{runDetails.paid_at ? dayjs(runDetails.paid_at).format('YYYY-MM-DD HH:mm:ss') : t('payroll_run_detail_page.value_not_paid')}</Descriptions.Item>
          <Descriptions.Item label={t('payroll_run_detail_page.desc_label_notes')} span={2}>{runDetails.notes || t('payroll_run_detail_page.value_no_notes')}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Title level={4} style={{ marginTop: '30px', marginBottom: '20px' }}>{t('payroll_run_detail_page.section_title_entries')}</Title>
        <PayrollEntriesTable payrollRunId={runDetails.id} />

      </Card>
    </div>
  );
};

export default PayrollRunDetailPage; 