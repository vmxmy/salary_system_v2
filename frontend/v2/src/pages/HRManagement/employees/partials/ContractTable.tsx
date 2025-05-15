import React from 'react';
import { Table, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ContractType, ContractStatus } from '../../types';
import type { ContractItem } from '../../types';
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';

const { Text } = Typography;

// Helper to get display label for enums, can be expanded or moved to a util
const getContractTypeLabel = (type: ContractType) => {
  // This can be mapped to Chinese labels if needed
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getContractStatusLabel = (status: ContractStatus) => {
  // This can be mapped to Chinese labels if needed
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

interface ContractTableProps {
  dataSource: ContractItem[];
  loading: boolean;
  onEdit: (record: ContractItem) => void;
  onDelete: (recordId: string) => void;
}

const ContractTable: React.FC<ContractTableProps> = ({ dataSource, loading, onEdit, onDelete }) => {
  const { hasPermission } = usePermissions();

  const canEditContract = hasPermission('employee_contract:edit');
  const canDeleteContract = hasPermission('employee_contract:delete');

  const columns: ColumnsType<ContractItem> = [
    {
      title: 'Contract Number',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      ellipsis: true,
    },
    {
      title: 'Contract Type',
      dataIndex: 'contractType',
      key: 'contractType',
      render: (type: ContractType) => <Tag>{getContractTypeLabel(type)}</Tag>,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string | dayjs.Dayjs) => dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string | dayjs.Dayjs) => dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: ContractStatus) => {
        let color = 'default';
        if (status === ContractStatus.ACTIVE) color = 'success';
        else if (status === ContractStatus.EXPIRED) color = 'warning';
        else if (status === ContractStatus.TERMINATED) color = 'error';
        else if (status === ContractStatus.PENDING) color = 'processing';
        return <Tag color={color}>{getContractStatusLabel(status)}</Tag>;
      },
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {canEditContract && (
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => onEdit(record)}
              size="small"
            >
              Edit
            </Button>
          )}
          {canDeleteContract && (
            <Popconfirm
              title="Delete this contract?"
              description="This action cannot be undone."
              onConfirm={() => onDelete(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
            >
              <Button type="link" icon={<DeleteOutlined />} danger size="small">
                Delete
              </Button>
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
      pagination={false} // Assuming pagination will be handled by the parent tab if needed for many records
      scroll={{ x: 'max-content' }}
      size="small"
    />
  );
};

export default ContractTable; 