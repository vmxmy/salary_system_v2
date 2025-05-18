import React from 'react';
import { Table, Space, Button, Tag, Popconfirm } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Employee, LookupItem } from '../types'; // LookupItem might not be needed here anymore unless for other direct use
// import { EmploymentStatus } from '../types'; // No longer needed as we use statusLookupMap
import { usePermissions } from '../../../hooks/usePermissions';
import type { Dayjs } from 'dayjs'; // Import Dayjs
import ActionButton from '../../../components/common/ActionButton'; // Import ActionButton

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
  departmentLookupMap: Map<number, string>; // Added
  jobTitleLookupMap: Map<number, string>; // Added
  onEdit: (employeeId: string) => void; // Added
  onViewDetails: (employeeId: string) => void; // Added
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
  departmentLookupMap, // Added
  jobTitleLookupMap, // Added
  onEdit, // Added
  onViewDetails, // Added
}) => {
  const { t } = useTranslation('employee');
  const { hasPermission } = usePermissions();

  const columns: ColumnsType<Employee> = [
    {
      title: t('list_page.table.column.full_name'),
      key: 'fullName',
      render: (_, record: Employee) => `${record.first_name || ''} ${record.last_name || ''}`.trim(),
    },
    {
      title: t('list_page.table.column.employee_code'),
      dataIndex: 'employee_code',
      key: 'employee_code',
    },
    {
      title: t('list_page.table.column.gender'),
      dataIndex: 'gender_lookup_value_id',
      key: 'gender',
      render: (genderId: number | undefined) => {
        if (genderId === undefined || genderId === null) return t('list_page.table.cell_empty');
        return genderLookupMap.get(genderId) || t('list_page.table.unknown.gender_param', { genderId });
      },
    },
    {
      title: t('list_page.table.column.department'),
      dataIndex: 'department_id',
      key: 'department_id',
      render: (departmentId?: number) => {
        if (departmentId === undefined || departmentId === null) return t('list_page.table.cell_empty');
        return departmentLookupMap?.get(departmentId) || String(departmentId);
      },
    },
    {
      title: t('list_page.table.column.job_title'),
      dataIndex: 'job_title_id',
      key: 'job_title_id',
      render: (jobTitleId?: number) => {
        if (jobTitleId === undefined || jobTitleId === null) return t('list_page.table.cell_empty');
        return jobTitleLookupMap?.get(jobTitleId) || String(jobTitleId);
      },
    },
    {
      title: t('list_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      render: (statusId: number | undefined) => {
        if (statusId === undefined || statusId === null) return <Tag>{t('list_page.table.unknown.status_raw')}</Tag>;
        const statusText = statusLookupMap.get(statusId) || t('list_page.table.unknown.status_param', { statusId });
        let color = 'default';
        // Simplified color logic based on common statuses, can be expanded
        // Assumes statusLookupMap returns values that can be compared or are keys for translation
        if (statusText.includes(t('list_page.table.status_text.active'))) color = 'green'; 
        else if (statusText.includes(t('list_page.table.status_text.inactive'))) color = 'red';
        else if (statusText.includes(t('list_page.table.status_text.probation'))) color = 'blue';
        else if (statusText.includes(t('list_page.table.status_text.on_leave'))) color = 'orange';
        return <Tag color={color}>{statusText}</Tag>; 
      },
    },
    {
      title: t('list_page.table.column.hire_date'),
      dataIndex: 'hire_date',
      key: 'hire_date',
      render: (date: string | Dayjs | undefined) => {
        if (!date) return t('list_page.table.cell_empty');
        // Check if it's a Dayjs object (has toLocaleDateString) or a string that needs parsing
        if (typeof date === 'string') {
          try {
            return new Date(date).toLocaleDateString();
          } catch (e) {
            return String(date); // Fallback if date string is invalid
          }
        }
        // If it's a Dayjs object (or something that behaves like it for our purpose)
        if (date && typeof (date as any).toLocaleDateString === 'function') {
            return (date as any).toLocaleDateString();
        }
        try {
            return (date as Dayjs).format('YYYY-MM-DD'); // If it's Dayjs
        } catch (e) {
            return String(date); // Fallback
        }
      },
    },
    {
      title: t('list_page.table.column.actions'),
      key: 'action',
      render: (_, record: Employee) => (
        <Space size="small">
          {hasPermission('P_EMPLOYEE_VIEW_DETAIL') && (
            <ActionButton 
              actionType="view"
              onClick={() => onViewDetails(String(record.id))}
              tooltipTitle={t('list_page.table.action.view_details')}
            />
          )}
          {hasPermission('P_EMPLOYEE_UPDATE') && (
            <ActionButton 
              actionType="edit"
              onClick={() => onEdit(String(record.id))}
              tooltipTitle={t('list_page.table.action.edit')}
            />
          )}
          {hasPermission('P_EMPLOYEE_DELETE') && (
            <Popconfirm
              title={t('list_page.delete_confirm.content')}
              onConfirm={() => onDelete(String(record.id))}
              okText={t('list_page.delete_confirm.ok_text')}
              cancelText={t('list_page.delete_confirm.cancel_text')}
            >
              <ActionButton 
                actionType="delete"
                tooltipTitle={t('list_page.table.action.delete')}
                danger
              />
            </Popconfirm>
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