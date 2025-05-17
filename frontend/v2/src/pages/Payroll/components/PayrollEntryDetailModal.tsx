import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Spin, Alert, Typography, Card, Empty, Tooltip } from 'antd';
import { getPayrollEntryById } from '../services/payrollApi';
import type { PayrollEntry, ApiSingleResponse, PayrollItemDetail } from '../types/payrollTypes';
import { useTranslation } from 'react-i18next';
import usePayrollConfigStore from '../../../store/payrollConfigStore';

const { Title } = Typography;

interface PayrollEntryDetailModalProps {
  entryId: number | null;
  visible: boolean;
  onClose: () => void;
}

const PayrollEntryDetailModal: React.FC<PayrollEntryDetailModalProps> = ({ entryId, visible, onClose }) => {
  const { t } = useTranslation();
  const [entry, setEntry] = useState<PayrollEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { getDefinitionByName } = usePayrollConfigStore();

  useEffect(() => {
    if (entryId && visible) {
      setLoading(true);
      setError(null);
      getPayrollEntryById(entryId)
        .then((response: ApiSingleResponse<PayrollEntry>) => {
          setEntry(response.data);
        })
        .catch((err) => {
          console.error("Error fetching payroll entry details:", err);
          setError(t('payroll.entryDetailModal.fetchError'));
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!visible) {
      // Reset state when modal is closed
      setEntry(null);
      setError(null);
    }
  }, [entryId, visible, t]);

  const renderDetailsCard = (title: string, details: PayrollItemDetail[] | undefined | null) => {
    if (!details || details.length === 0) {
      return (
        <Card title={title} bordered={false} style={{ marginBottom: 16 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('payroll.entryDetailModal.noDetails')} />
        </Card>
      );
    }
    return (
      <Card title={title} bordered={false} style={{ marginBottom: 16 }}>
        {details.map((item, index) => {
          const definition = getDefinitionByName(item.name);
          const displayName = definition?.name || item.name;
          const itemTitle = definition ? (
            <Tooltip title={`Code: ${item.name} | Type: ${definition.type} | Data Type: ${definition.data_type}`}>
              {displayName}
            </Tooltip>
          ) : displayName;

          return (
            <Descriptions key={index} bordered column={1} size="small" style={{ marginBottom: 10 }}>
              <Descriptions.Item label={t('payroll.entryDetailModal.componentName')}>{itemTitle}</Descriptions.Item>
              <Descriptions.Item label={t('payroll.entryDetailModal.amount')}>{item.amount.toFixed(2)}</Descriptions.Item>
              {item.description && <Descriptions.Item label={t('payroll.entryDetailModal.notes')}>{item.description}</Descriptions.Item>}
            </Descriptions>
          );
        })}
      </Card>
    );
  };

  return (
    <Modal
      title={t('payroll.entryDetailModal.title')}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose // Ensures state is reset when modal is closed and re-opened
    >
      {loading && <Spin />}
      {error && <Alert message={t('error.genericTitle')} description={error} type="error" showIcon />}
      {entry && !loading && !error && (
        <>
          <Descriptions bordered column={2} title={<Title level={5}>{t('payroll.entryDetailModal.summaryTitle')}</Title>} style={{ marginBottom: 20 }}>
            <Descriptions.Item label={t('payroll.entry.id')}>{entry.id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.employeeId')}>{entry.employee_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.payrollRunId')}>{entry.payroll_run_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.payrollPeriod')}>
              {entry.payroll_run?.payroll_period?.name || t('common.notAvailable')}
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.totalEarnings')}>{entry.total_earnings?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.totalDeductions')}>{entry.total_deductions?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.netPay')}>{entry.net_pay?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.paymentDate')}>{entry.payroll_run?.paid_at ? new Date(entry.payroll_run.paid_at).toLocaleDateString() : t('common.notAvailable')}</Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.status')}>{entry.status?.display_name || entry.status_lookup_value_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll.entry.remarks')} span={2}>{entry.remarks || '-'}</Descriptions.Item>
          </Descriptions>

          {renderDetailsCard(t('payroll.entry.earningsDetails'), entry.earnings_details)}
          {renderDetailsCard(t('payroll.entry.deductionsDetails'), entry.deductions_details)}
        </>
      )}
    </Modal>
  );
};

export default PayrollEntryDetailModal; 