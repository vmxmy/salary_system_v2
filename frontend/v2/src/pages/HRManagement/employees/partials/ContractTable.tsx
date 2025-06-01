import React from 'react';
import { Button, Popconfirm, Space, Tag, Typography } from 'antd';
import TableActionButton from '../../../../components/common/TableActionButton';
import type { ContractItem } from '../../types';
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import type { LookupMaps } from '../../../../hooks/useLookupMaps';
import EnhancedProTable from '../../../../components/common/EnhancedProTable';
import type { ProColumns } from '@ant-design/pro-components';

const { Text } = Typography;

interface ContractTableProps {
  dataSource: ContractItem[];
  loading: boolean;
  onEdit: (record: ContractItem) => void;
  onDelete: (recordId: number) => void;
  lookupMaps: LookupMaps | null;
}

const ContractTable: React.FC<ContractTableProps> = ({ dataSource, loading, onEdit, onDelete, lookupMaps }) => {
  const { t } = useTranslation(['employee', 'common']);
  const { hasPermission } = usePermissions();

  const canEditContract = hasPermission('employee_contract:edit');
  const canDeleteContract = hasPermission('employee_contract:delete');
  const naText = '';

  const columns: ProColumns<ContractItem>[] = [
    {
      title: t('employee:detail_page.contracts_tab.table.column_contract_number'),
      dataIndex: 'contract_number',
      key: 'contract_number',
      sorter: true,
      ellipsis: true,
    },
    {
      title: t('employee:detail_page.contracts_tab.table.column_contract_type'),
      dataIndex: 'contract_type_lookup_value_id',
      key: 'contract_type_lookup_value_id',
      sorter: true,
      render: (_, record) => {
        const id = record.contract_type_lookup_value_id;
        const typeText = lookupMaps?.contractTypeMap?.get(id) || String(id);
        return <Tag>{typeText || naText}</Tag>;
      },
    },
    {
      title: t('employee:detail_page.contracts_tab.table.column_start_date'),
      dataIndex: 'start_date',
      key: 'start_date',
      sorter: true,
      render: (_, record) => {
        const date = record.start_date;
        return dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD'): naText;
      },
    },
    {
      title: t('employee:detail_page.contracts_tab.table.column_end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      sorter: true,
      render: (_, record) => {
        const date = record.end_date;
        return dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD'): naText;
      },
    },
    {
      title: t('employee:detail_page.contracts_tab.table.column_status'),
      dataIndex: 'contract_status_lookup_value_id',
      key: 'contract_status_lookup_value_id',
      sorter: true,
      render: (_, record) => {
        const id = record.contract_status_lookup_value_id;
        const statusText = lookupMaps?.contractStatusMap?.get(id) || String(id);
        let color = 'default';
        if (statusText && statusText.includes(t('common:status.active'))) color = 'success';
        else if (statusText && statusText.includes(t('common:status.expired'))) color = 'warning';
        else if (statusText && statusText.includes(t('common:status.terminated'))) color = 'error';
        
        return <Tag color={color}>{statusText || naText}</Tag>;
      },
    },
    {
      title: t('common:label.remarks'),
      dataIndex: 'remarks',
      key: 'remarks',
      sorter: true,
      ellipsis: true,
    },
    {
      title: t('common:label.actions'),
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {canEditContract && (
            <TableActionButton
              actionType="edit"
              onClick={() => onEdit(record)}
              tooltipTitle={t('employee:detail_page.contracts_tab.tooltip_edit_contract')}
            />
          )}
          {canDeleteContract && (
            <Popconfirm
              title={t('employee:detail_page.contracts_tab.delete_confirm.title_popconfirm')}
              description={t('common:modal.confirm_delete.content')}
              onConfirm={() => onDelete(record.id)}
              okText={t('common:button.yes_delete')}
              cancelText={t('common:button.cancel')}
            >
              <TableActionButton actionType="delete" danger tooltipTitle={t('employee:detail_page.contracts_tab.tooltip_delete_contract')} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <EnhancedProTable<ContractItem>
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

export default ContractTable; 