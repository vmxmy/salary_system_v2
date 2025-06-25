import React from 'react';
import { Tag, Space } from 'antd';
import type { ProColumns, ProTableProps } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import TableActionButton from '../../../../components/common/TableActionButton';
import type { PageUser } from '../hooks/useUserManagementLogic';

interface UsersTableProps {
  loading: boolean;
  dataSource: PageUser[];
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
  onEdit: (user: PageUser) => void;
  onDelete: (userId: string) => void;
  t: (key: string) => string;
}

// 生成用户表格列配置的函数
const generateUserTableColumns = (
  t: (key: string) => string,
  permissions: UsersTableProps['permissions'],
  onEdit: UsersTableProps['onEdit'],
  onDelete: UsersTableProps['onDelete']
): ProColumns<PageUser>[] => [
  {
    title: t('user:table.column.id'),
    dataIndex: 'id',
    width: 80,
    sorter: (a, b) => a.id - b.id,
  },
  {
    title: t('user:table.column.username'),
    dataIndex: 'username',
    sorter: (a, b) => a.username.localeCompare(b.username),
    copyable: true,
  },
  {
    title: t('user:table.column.roles'),
    dataIndex: 'roles',
    search: false,
    render: (_, record) => (
      <Space wrap>
        {record.roles.map((role, index) => (
          <Tag color="blue" key={index}>
            {role}
          </Tag>
        ))}
      </Space>
    ),
  },
  {
    title: t('user:table.column.is_active'),
    dataIndex: 'is_active',
    width: 100,
    render: (_, record) => (
      record.is_active ? 
        <Tag color="green">{t('common:table.value.active')}</Tag> :
        <Tag color="red">{t('common:table.value.inactive')}</Tag>
    ),
    filters: [
      { text: t('common:table.value.active'), value: true },
      { text: t('common:table.value.inactive'), value: false },
    ],
    onFilter: (value, record) => record.is_active === value,
  },
  {
    title: t('user:table.column.created_at'),
    dataIndex: 'created_at',
    valueType: 'dateTime',
    width: 180,
    search: false,
  },
  {
    title: t('common:action.title'),
    key: 'action',
    width: 120,
    fixed: 'right',
    render: (_, record) => (
      <Space size="small">
        {permissions.canEdit && (
          <TableActionButton
            actionType="edit"
            onClick={() => onEdit(record)}
            tooltipTitle={t('user:tooltip.edit_user')}
          />
        )}
        {permissions.canDelete && (
          <TableActionButton
            actionType="delete"
            danger
            onClick={() => onDelete(String(record.id))}
            tooltipTitle={t('user:tooltip.delete_user')}
          />
        )}
      </Space>
    ),
  },
];

const UsersTable: React.FC<UsersTableProps> = ({
  loading,
  dataSource,
  permissions,
  onEdit,
  onDelete,
  t,
}) => {
  const columns = generateUserTableColumns(t, permissions, onEdit, onDelete);

  return (
    <ProTable<PageUser>
      loading={loading}
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      search={false}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
      }}
      options={{
        density: true,
        fullScreen: true,
        reload: false, // Reload is handled by the parent component
      }}
      cardBordered
    />
  );
};

export default UsersTable; 