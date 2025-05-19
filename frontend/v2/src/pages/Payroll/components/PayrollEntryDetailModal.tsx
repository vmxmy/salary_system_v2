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
  const { t } = useTranslation(['common', 'payroll']);
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
          setError(t('payroll:entries_table.error_fetch'));
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
        <Card title={title} variant="borderless" style={{ marginBottom: 16 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common:table.empty_data')} />
        </Card>
      );
    }
    return (
      <Card title={title} variant="borderless" style={{ marginBottom: 16 }}>
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
              <Descriptions.Item label={t('payroll:entries_table.modal.component_name')}>{itemTitle}</Descriptions.Item>
              <Descriptions.Item label={t('payroll:entries_table.modal.amount')}>{item.amount.toFixed(2)}</Descriptions.Item>
              {item.description && <Descriptions.Item label={t('payroll:entries_table.modal.notes')}>{item.description}</Descriptions.Item>}
            </Descriptions>
          );
        })}
      </Card>
    );
  };

  return (
    <Modal
      title={t('payroll:entries_table.modal.title_detail')}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose // Ensures state is reset when modal is closed and re-opened
    >
      {loading && <Spin />}
      {error && <Alert message={t('common:error.genericTitle')} description={error} type="error" showIcon />}
      {entry && !loading && !error && (
        <>
          <Descriptions bordered column={2} title={<Title level={5}>{t('payroll:run_detail_page.section_title_entries')}</Title>} style={{ marginBottom: 20 }}>
            <Descriptions.Item label={t('payroll:entries_table.column.entry_id')}>{entry.id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.employee_id')}>{entry.employee_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.payroll_run_id')}>{entry.payroll_run_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.payroll_period')}>
              {entry.payroll_run?.payroll_period?.name || t('common:notAvailable')}
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.total_earnings')}>{entry.total_earnings?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.total_deductions')}>{entry.total_deductions?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.net_pay')}>{entry.net_pay?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.payment_date')}>{entry.payroll_run?.paid_at ? new Date(entry.payroll_run.paid_at).toLocaleDateString() : t('common:notAvailable')}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.status')}>{entry.status?.display_name || entry.status_lookup_value_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.remarks')} span={2}>{entry.remarks || '-'}</Descriptions.Item>
          </Descriptions>

          {renderDetailsCard(t('payroll:entries_table.modal.earnings_details'), entry.earnings_details)}
          {renderDetailsCard(t('payroll:entries_table.modal.deductions_details'), entry.deductions_details)}
        </>
      )}
    </Modal>
  );
};

export default PayrollEntryDetailModal;