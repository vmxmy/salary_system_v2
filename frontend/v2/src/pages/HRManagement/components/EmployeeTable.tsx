import React from 'react';
import { Table, Space, Button, Tag } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { Link } from 'react-router-dom';
import type { Employee, LookupItem } from '../types'; // LookupItem might not be needed here anymore unless for other direct use
// import { EmploymentStatus } from '../types'; // No longer needed as we use statusLookupMap
import { usePermissions } from '../../../hooks/usePermissions';
import type { Dayjs } from 'dayjs'; // Import Dayjs

interface EmployeeTableProps {
  employees: Employee[]; 
  loading: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void; 
  onDelete: (employeeId: string) => void; 
  // Added Lookup Maps
  genderLookupMap: Map<number, string>;
  statusLookupMap: Map<number, string>;
  educationLevelLookupMap: Map<number, string>;
  employmentTypeLookupMap: Map<number, string>;
  maritalStatusLookupMap: Map<number, string>;
  politicalStatusLookupMap: Map<number, string>;
  contractTypeLookupMap: Map<number, string>;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  loading,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onDelete,
  // Destructure new props
  genderLookupMap,
  statusLookupMap,
  // educationLevelLookupMap, // Add if used in columns
  // employmentTypeLookupMap, // Add if used in columns
  // maritalStatusLookupMap,    // Add if used in columns
  // politicalStatusLookupMap,  // Add if used in columns
  // contractTypeLookupMap,     // Add if used in columns
}) => {
  const { hasPermission } = usePermissions();

  const columns: ColumnsType<Employee> = [
    {
      title: '姓名',
      key: 'fullName',
      render: (_, record: Employee) => `${record.first_name || ''} ${record.last_name || ''}`.trim(),
    },
    {
      title: '工号',
      dataIndex: 'employee_code',
      key: 'employee_code',
    },
    {
      title: '性别',
      dataIndex: 'gender_lookup_value_id',
      key: 'gender',
      render: (genderId: number | undefined) => {
        if (genderId === undefined || genderId === null) return '-';
        return genderLookupMap.get(genderId) || `未知 (${genderId})`;
      },
    },
    {
      title: '部门',
      dataIndex: 'departmentName', 
      key: 'departmentName',
    },
    {
      title: '职位',
      dataIndex: 'positionName', 
      key: 'positionName',
    },
    {
      title: '状态',
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      render: (statusId: number | undefined) => {
        if (statusId === undefined || statusId === null) return <Tag>未知</Tag>;
        const statusText = statusLookupMap.get(statusId) || `未知 (${statusId})`;
        let color = 'default';
        // Simplified color logic based on common statuses, can be expanded
        if (statusText.includes('在职')) color = 'green'; // includes for cases like '在职 (xxx)' if map fails
        else if (statusText.includes('离职')) color = 'red';
        else if (statusText.includes('试用期')) color = 'blue';
        else if (statusText.includes('休假')) color = 'orange';
        return <Tag color={color}>{statusText}</Tag>; 
      },
    },
    {
      title: '入职日期',
      dataIndex: 'hire_date',
      key: 'hire_date',
      render: (date: string | Dayjs | undefined) => {
        if (!date) return '-';
        // Check if it's a Dayjs object (has toLocaleDateString) or a string that needs parsing
        if (typeof date === 'string') {
          return new Date(date).toLocaleDateString();
        }
        // If it's a Dayjs object (or something that behaves like it for our purpose)
        if (date && typeof (date as any).toLocaleDateString === 'function') {
            return (date as any).toLocaleDateString();
        }
        // Fallback for Dayjs objects if the above check isn't robust enough
        // or if it's already a pre-formatted string that doesn't need Date() parsing.
        // This part might need adjustment based on actual `hire_date` type from API.
        // For now, assuming Dayjs object or ISO string.
        try {
            return (date as Dayjs).format('YYYY-MM-DD'); // If it's Dayjs
        } catch (e) {
            return String(date); // Fallback
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Employee) => (
        <Space size="middle">
          {hasPermission('employee:view') && (
            <Link to={`/hr/employees/${record.id}`}>查看详情</Link>
          )}
          {hasPermission('employee:edit') && (
            <Link to={`/hr/employees/${record.id}/edit`}>编辑</Link>
          )}
          {hasPermission('employee:delete') && (
            <Button type="link" danger onClick={() => onDelete(record.id)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleTableChange = (paginationConfig: TablePaginationConfig, _filters: any, _sorter: any) => {
    onPageChange(paginationConfig.current || 1, paginationConfig.pageSize || 10);
  };

  return (
    <Table<Employee> 
      columns={columns}
      dataSource={employees} 
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      onChange={handleTableChange} 
      rowKey="id"
      scroll={{ x: 'max-content' }} 
    />
  );
};

export default EmployeeTable; 