import React from 'react';
import { Table, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ActionButton from '../../../../components/common/ActionButton';
import type { ContractItem } from '../../types';
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import type { LookupMaps } from '../../../../hooks/useLookupMaps';

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
  const naText = t('employee:detail_page.common_value.na', 'N/A');

  const columns: ColumnsType<ContractItem> = [
    {
      title: t('employee:detail_page.contracts_tab.table.column_contract_number', '合同编号'),
      dataIndex: 'contract_number',
      key: 'contract_number',
      ellipsis: true,
    },
    {
      title: t('employee:detail_page.contracts_tab.table.column_contract_type', '合同类型'),
      dataIndex: 'contract_type_lookup_value_id',
      key: 'contract_type_lookup_value_id',
      render: (id: number) => {
        const typeText = lookupMaps?.contractTypeMap?.get(id) || String(id);
        return <Tag>{typeText || naText}</Tag>;
      },
    },
    {
      title: t('employee:detail_page.contracts_tab.table.column_start_date', '开始日期'),
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string | dayjs.Dayjs) => dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD') : naText,
    },
    {
      title: t('employee:detail_page.contracts_tab.table.column_end_date', '结束日期'),
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string | dayjs.Dayjs) => dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD') : naText,
    },
    {
      title: t('employee:detail_page.contracts_tab.table.column_status', '状态'),
      dataIndex: 'contract_status_lookup_value_id',
      key: 'contract_status_lookup_value_id',
      render: (id: number) => {
        const statusText = lookupMaps?.contractStatusMap?.get(id) || String(id);
        let color = 'default';
        if (statusText && statusText.includes(t('common:status.active','激活'))) color = 'success';
        else if (statusText && statusText.includes(t('common:status.expired','已过期'))) color = 'warning';
        else if (statusText && statusText.includes(t('common:status.terminated', '已终止'))) color = 'error';
        
        return <Tag color={color}>{statusText || naText}</Tag>;
      },
    },
    {
      title: t('common:label.remarks', '备注'),
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: t('common:label.actions', '操作'),
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {canEditContract && (
            <ActionButton
              actionType="edit"
              onClick={() => onEdit(record)}
              tooltipTitle={t('employee:detail_page.contracts_tab.tooltip_edit_contract', '编辑合同')}
            />
          )}
          {canDeleteContract && (
            <Popconfirm
              title={t('employee:detail_page.contracts_tab.delete_confirm.title_popconfirm', '删除此合同？')}
              description={t('common:modal.confirm_delete.content', '此操作无法撤销。')}
              onConfirm={() => onDelete(record.id)}
              okText={t('common:button.yes_delete', '是的，删除')}
              cancelText={t('common:button.cancel', '取消')}
            >
              <ActionButton actionType="delete" danger tooltipTitle={t('employee:detail_page.contracts_tab.tooltip_delete_contract', '删除合同')} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

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

export default ContractTable; 