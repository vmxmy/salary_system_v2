import React from 'react';
import { Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../../../../components/common/EnhancedProTable';
import TableActionButton from '../../../../components/common/TableActionButton';
import type { CompensationItem } from '../../types';
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import type { LookupMaps } from '../../../../hooks/useLookupMaps';

const { Text } = Typography;

interface CompensationTableProps {
  dataSource: CompensationItem[];
  loading: boolean;
  onEdit: (record: CompensationItem) => void;
  onDelete: (id: number) => void;
  lookupMaps: LookupMaps | null;
}

const CompensationTable: React.FC<CompensationTableProps> = ({ dataSource, loading, onEdit, onDelete, lookupMaps }) => {
  const { t } = useTranslation(['employee', 'common']);
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('employee_compensation:edit');
  const canDelete = hasPermission('employee_compensation:delete');
  const naText = '';
  const zeroDecimalText = t('employee:detail_page.common_value.zero_decimal', '0.00');
  const defaultCurrencyText = t('employee:detail_page.compensation_tab.default_currency', 'CNY');

  const columns: ProColumns<CompensationItem>[] = [
    {
      title: t('employee:detail_page.compensation_tab.table.column_effective_date', 'Effective Date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      sorter: (a, b) => dayjs(a.effective_date).unix() - dayjs(b.effective_date).unix(),
      render: (_, record, index) => dayjs(record.effective_date).isValid() ? dayjs(record.effective_date).format('YYYY-MM-DD'): naText,
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_basic_salary', 'Basic Salary'),
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      align: 'right',
      sorter: (a, b) => a.basic_salary - b.basic_salary,
      render: (_, record, index) => typeof record.basic_salary === 'number' ? record.basic_salary.toFixed(2) : naText,
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_allowances', 'Allowances'),
      dataIndex: 'allowances',
      key: 'allowances',
      align: 'right',
      sorter: (a, b) => (a.allowances || 0) - (b.allowances || 0),
      render: (_, record, index) => typeof record.allowances === 'number' ? record.allowances.toFixed(2) : (record.allowances === null || record.allowances === undefined ? zeroDecimalText : naText),
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_total_salary', 'Total Salary'),
      dataIndex: 'total_salary',
      key: 'total_salary',
      align: 'right',
      sorter: (a, b) => (a.total_salary || 0) - (b.total_salary || 0),
      render: (_, record, index) => typeof record.total_salary === 'number' ? record.total_salary.toFixed(2) : naText,
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_pay_frequency', 'Pay Frequency'),
      dataIndex: 'pay_frequency_lookup_value_id',
      key: 'pay_frequency_lookup_value_id',
      sorter: true,
      render: (_, record, index) => {
        return lookupMaps?.payFrequencyMap?.get(record.pay_frequency_lookup_value_id) || record.pay_frequency_lookup_value_id?.toString() || naText;
      },
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_currency', 'Currency'),
      dataIndex: 'currency',
      key: 'currency',
      sorter: true,
      render: (_, record, index) => record.currency || defaultCurrencyText,
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_change_reason', 'Reason for Change'),
      dataIndex: 'change_reason',
      key: 'change_reason',
      sorter: true,
      ellipsis: true,
    },
    {
      title: t('common:label.remarks', 'Remarks'),
      dataIndex: 'remarks',
      key: 'remarks',
      sorter: true,
      ellipsis: true,
    },
  ];

  if (canEdit || canDelete) {
    columns.push({
      title: t('common:label.actions', 'Actions'),
      key: 'actions',
      align: 'center',
      fixed: 'right',
      width: 120,
      render: (_, record, index) => (
        <Space size="small">
          {canEdit && (
            <TableActionButton
              actionType="edit"
              onClick={() => onEdit(record)}
              tooltipTitle={t('employee:detail_page.compensation_tab.tooltip_edit_record')}
            />
          )}
          {canDelete && (
            <Popconfirm
              title={t('employee:detail_page.compensation_tab.delete_confirm.content_table', 'Are you sure you want to delete this record?')}
              onConfirm={() => onDelete(record.id)}
              okText={t('common:button.yes', 'Yes')}
              cancelText={t('common:button.no', 'No')}
            >
              <TableActionButton actionType="delete" danger tooltipTitle={t('employee:detail_page.compensation_tab.tooltip_delete_record')} />
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return (
    <EnhancedProTable<CompensationItem>
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content' }}
      size="small"
      enableAdvancedFeatures={true}
      showToolbar={true}
      search={false}
      title={t('employee:detail_page.compensation_tab.table_title')}
    />
  );
};

export default CompensationTable; 