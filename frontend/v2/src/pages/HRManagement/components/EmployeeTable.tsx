import React, { useState, useRef, useEffect } from 'react';
import { Space, Button, Tag, Popconfirm, Tooltip, Input } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface';
import { useTranslation } from 'react-i18next';
import type { Employee } from '../types';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Dayjs } from 'dayjs';
import EmployeeName from '../../../components/common/EmployeeName';
import TableActionButton from '../../../components/common/TableActionButton';
import EnhancedProTable from '../../../components/common/EnhancedProTable';
import type { ProColumns } from '@ant-design/pro-components';

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  total: number;
  columns: ProColumns<Employee>[]; // 新增：接收外部传入的列配置
  currentPage?: number;
  pageSize?: number;
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (selectedRowKeys: React.Key[], selectedRows: Employee[]) => void;
  onPageChange: (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<Employee> | SorterResult<Employee>[], extra: TableCurrentDataSource<Employee>) => void;
  onDelete: (employeeId: string) => void;
  // Added Lookup Maps
  genderLookupMap?: Map<number, string>;
  statusLookupMap?: Map<number, string>;
  educationLevelLookupMap?: Map<number, string>;
  employmentTypeLookupMap?: Map<number, string>;
  maritalStatusLookupMap?: Map<number, string>;
  politicalStatusLookupMap?: Map<number, string>;
  contractTypeLookupMap?: Map<number, string>;
  departmentLookupMap?: Map<string, string>;
  personnelCategoryMap?: Map<string, string>;
  onEdit: (employee: Employee) => void;
  onViewDetails: (employeeId: string) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  loading,
  total,
  columns, // 接收外部传入的列配置
  currentPage,
  pageSize,
  selectedRowKeys,
  onSelectionChange,
  onPageChange,
  onDelete,
  genderLookupMap,
  statusLookupMap,
  educationLevelLookupMap,
  employmentTypeLookupMap,
  maritalStatusLookupMap,
  politicalStatusLookupMap,
  contractTypeLookupMap,
  departmentLookupMap,
  personnelCategoryMap,
  onEdit,
  onViewDetails,
}) => {
  const { t } = useTranslation('employee');
  const { hasPermission } = usePermissions();
  
  // 添加调试代码，打印employees数据
  useEffect(() => {
    if (employees && employees.length > 0) {
      console.log('[员工列表数据调试] 第一条记录:', employees[0]);
      console.log('[员工列表数据调试] 所有字段名:', Object.keys(employees[0]));
      
      // 检查所有员工记录是否有position_name字段
      const hasPositionName = employees.some(emp => emp.position_name);
      const hasActualPositionName = employees.some(emp => emp.actual_position_name);
      const hasBankName = employees.some(emp => emp.bank_name);
      const hasBankAccount = employees.some(emp => emp.bank_account_number);
      console.log(`[员工列表数据调试] 是否存在position_name字段: ${hasPositionName}`);
      console.log(`[员工列表数据调试] 是否存在actual_position_name字段: ${hasActualPositionName}`);
      console.log(`[员工列表数据调试] 是否存在bank_name字段: ${hasBankName}`);
      console.log(`[员工列表数据调试] 是否存在bank_account_number字段: ${hasBankAccount}`);
    }
  }, [employees]);

  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Employee> | SorterResult<Employee>[],
    extra: TableCurrentDataSource<Employee>
  ) => {
    // 直接传递所有参数给父组件的onPageChange处理器
    onPageChange(paginationConfig, filters, sorter, extra);
  };

  return (
    <div className="employee-table-container">
      <EnhancedProTable<Employee>
        columns={columns} // 直接使用外部传入的列配置
        dataSource={employees}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100', '200'],
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        rowKey="id"
        bordered
        scroll={{ x: 'max-content' }}
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectionChange,
        }}
      />
    </div>
  );
};

export default EmployeeTable; 