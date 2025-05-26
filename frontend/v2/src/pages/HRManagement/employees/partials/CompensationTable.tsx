import React from 'react';
import { Table, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import TableActionButton from '../../../../components/common/TableActionButton';
import type { CompensationItem } from '../../types'; // Removed PayFrequency enum import
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useTranslation } from 'react-i18next'; // +
import type { LookupMaps } from '../../../../hooks/useLookupMaps'; // +

const { Text } = Typography;

// Removed getPayFrequencyLabel helper function

interface CompensationTableProps {
  dataSource: CompensationItem[];
  loading: boolean;
  onEdit: (record: CompensationItem) => void;
  onDelete: (id: number) => void;
  lookupMaps: LookupMaps | null; // +
}

const CompensationTable: React.FC<CompensationTableProps> = ({ dataSource, loading, onEdit, onDelete, lookupMaps }) => { // +
  const { t } = useTranslation(['employee', 'common']); // +
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('employee_compensation:edit');
  const canDelete = hasPermission('employee_compensation:delete');
  const naText = ''; // +
  const zeroDecimalText = t('employee:detail_page.common_value.zero_decimal', '0.00'); // +
  const defaultCurrencyText = t('employee:detail_page.compensation_tab.default_currency', 'CNY'); // +

  const columns: ColumnsType<CompensationItem> = [
    {
      title: t('employee:detail_page.compensation_tab.table.column_effective_date', 'Effective Date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      sorter: (a, b) => dayjs(a.effective_date).unix() - dayjs(b.effective_date).unix(),
      render: (text) => dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : naText,
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_basic_salary', 'Basic Salary'),
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      align: 'right',
      sorter: (a, b) => a.basic_salary - b.basic_salary,
      render: (val) => typeof val === 'number' ? val.toFixed(2) : naText,
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_allowances', 'Allowances'),
      dataIndex: 'allowances',
      key: 'allowances',
      align: 'right',
      sorter: (a, b) => (a.allowances || 0) - (b.allowances || 0),
      render: (val) => typeof val === 'number' ? val.toFixed(2) : (val === null || val === undefined ? zeroDecimalText : naText), 
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_total_salary', 'Total Salary'),
      dataIndex: 'total_salary',
      key: 'total_salary',
      align: 'right',
      sorter: (a, b) => (a.total_salary || 0) - (b.total_salary || 0),
      render: (val) => typeof val === 'number' ? val.toFixed(2) : naText,
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_pay_frequency', 'Pay Frequency'),
      dataIndex: 'pay_frequency_lookup_value_id',
      key: 'pay_frequency_lookup_value_id',
      sorter: true,
      render: (id: number) => {
        return lookupMaps?.payFrequencyMap?.get(id) || id?.toString() || naText;
      },
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_currency', 'Currency'),
      dataIndex: 'currency',
      key: 'currency',
      sorter: true,
      render: (text) => text || defaultCurrencyText,
    },
    {
      title: t('employee:detail_page.compensation_tab.table.column_change_reason', 'Reason for Change'),
      dataIndex: 'change_reason', // Corrected: types.ts uses change_reason
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
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <TableActionButton
              actionType="edit"
              onClick={() => onEdit(record)}
              tooltipTitle={t('employee:detail_page.compensation_tab.tooltip_edit_record', '编辑薪资记录')}
            />
          )}
          {canDelete && (
            <Popconfirm
              title={t('employee:detail_page.compensation_tab.delete_confirm.content_table', 'Are you sure you want to delete this record?')}
              onConfirm={() => onDelete(record.id)}
              okText={t('common:button.yes', 'Yes')}
              cancelText={t('common:button.no', 'No')}
            >
              <TableActionButton actionType="delete" danger tooltipTitle={t('employee:detail_page.compensation_tab.tooltip_delete_record', '删除薪资记录')} />
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content' }}
      size="small"
    />
  );
};

export default CompensationTable; 