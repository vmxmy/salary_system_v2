import React from 'react';
import { Table, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {  } from '@ant-design/icons';
import ActionButton from '../../../../components/common/ActionButton';
import type { JobHistoryItem, EmploymentType } from '../../types'; // Assuming EmploymentType is an enum or has a display mapping
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';

const { Text } = Typography;

interface JobHistoryTableProps {
  dataSource: JobHistoryItem[];
  loading: boolean;
  onEdit: (item: JobHistoryItem) => void;
  onDelete: (itemId: number) => void;
}

// Helper to get display label for EmploymentType (can be expanded or moved to a util)
const getEmploymentTypeLabel = (type: EmploymentType) => {
  if (!type) return 'N/A';
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const JobHistoryTable: React.FC<JobHistoryTableProps> = ({ 
  dataSource,
  loading,
  onEdit,
  onDelete,
}) => {
  const { hasPermission } = usePermissions();
  const canEditJobHistory = hasPermission('employee_job_history:edit'); // Example permission
  const canDeleteJobHistory = hasPermission('employee_job_history:delete'); // Example permission

  const columns: ColumnsType<JobHistoryItem> = [
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      sorter: (a, b) => dayjs(a.effectiveDate).valueOf() - dayjs(b.effectiveDate).valueOf(),
      render: (text: string) => dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : 'N/A',
      width: 120,
    },
    {
      title: '部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (text?: string) => text || 'N/A',
      width: 150,
    },
    {
      title: '职位',
      dataIndex: 'positionName',
      key: 'positionName',
      render: (text?: string) => text || 'N/A',
      width: 150,
    },
    {
      title: '雇佣类型',
      dataIndex: 'employmentType',
      key: 'employmentType',
      render: (type: EmploymentType) => <Tag>{getEmploymentTypeLabel(type)}</Tag>,
      width: 130,
    },
    {
      title: '薪资',
      dataIndex: 'salary',
      key: 'salary',
      align: 'right',
      render: (salary?: number) => salary ? salary.toLocaleString() : 'N/A',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (text?: string) => text || '-',
    },
  ];

  if (canEditJobHistory || canDeleteJobHistory) {
    columns.push({
      title: '操作',
      key: 'action',
      align: 'center',
      width: 100,
      render: (_: any, record: JobHistoryItem) => (
        <Space size="small">
          {canEditJobHistory && (
            <ActionButton
              actionType="edit"
              onClick={() => onEdit(record)}
              tooltipTitle={`编辑岗位历史 ${record.id}`}
            />
          )}
          {canDeleteJobHistory && (
            <Popconfirm
              title={`确定删除这条岗位历史记录吗?`}
              onConfirm={() => onDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <ActionButton
                actionType="delete"
                danger
                tooltipTitle={`删除岗位历史 ${record.id}`}
              />
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
      pagination={{
        pageSizeOptions: ['5', '10', '20'],
        showSizeChanger: true,
        defaultPageSize: 5,
        size: 'small',
      }}
      scroll={{ x: 'max-content' }} // Ensures table is scrollable on smaller screens if content overflows
      size="middle"
    />
  );
};

export default JobHistoryTable; 