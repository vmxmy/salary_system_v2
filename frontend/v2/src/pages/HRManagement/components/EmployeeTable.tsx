import React, { useState, useRef, useEffect } from 'react';
import { Table, Space, Button, Tag, Popconfirm, Tooltip, Input } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, PlusSquareOutlined, MinusSquareOutlined, DownloadOutlined, SettingOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, FilterConfirmProps, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Employee } from '../types';
// import { EmploymentStatus } from '../types'; // No longer needed as we use statusLookupMap
import { usePermissions } from '../../../hooks/usePermissions';
import type { Dayjs } from 'dayjs'; // Import Dayjs
import EmployeeName from '../../../components/common/EmployeeName';
import TableActionButton from '../../../components/common/TableActionButton';
import { useTableSearch, numberSorter, stringSorter, useTableExport, useColumnControl } from '../../../components/common/TableUtils';
import Highlighter from 'react-highlight-words';
// ActionButton is being replaced by standard AntD Buttons with icons

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  total: number;
  currentPage?: number; // Made optional
  pageSize?: number;    // Made optional
  onPageChange: (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<Employee> | SorterResult<Employee>[], extra: TableCurrentDataSource<Employee>) => void; // Signature updated
  onDelete: (employeeId: string) => void;
  // Added Lookup Maps
  genderLookupMap: Map<number, string>;
  statusLookupMap: Map<number, string>;
  educationLevelLookupMap: Map<number, string>;
  employmentTypeLookupMap: Map<number, string>;
  maritalStatusLookupMap: Map<number, string>;
  politicalStatusLookupMap: Map<number, string>;
  contractTypeLookupMap: Map<number, string>;
  departmentLookupMap: Map<string, string>;
  personnelCategoryMap: Map<string, string>;
  onEdit: (employee: Employee) => void;
  onViewDetails: (employeeId: string) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  loading,
  total,
  currentPage,
  pageSize,
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
  
  // 使用通用表格搜索组件
  const { getColumnSearch, searchText, searchedColumn, searchInput, setSearchText } = useTableSearch();

  // 姓名列的搜索配置
  const getFullNameSearchProps = () => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`${t('list_page.table.search_placeholder_prefix')} ${t('list_page.table.column.full_name')}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => {
            confirm();
            // 与通用搜索组件行为一致
            if (selectedKeys[0]) {
              searchedColumn === 'fullName' ? null : selectedKeys[0] && searchText !== selectedKeys[0] && setSearchText(selectedKeys[0]);
            }
          }}
          style={{ marginBottom: 8, display: 'block', width: '100%' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              // 与通用搜索组件行为一致
              if (selectedKeys[0]) {
                searchedColumn === 'fullName' ? null : selectedKeys[0] && searchText !== selectedKeys[0] && setSearchText(selectedKeys[0]);
              }
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {t('list_page.table.search_button')}
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              setSearchText('');
            }}
            size="small"
            style={{ width: 90 }}
          >
            {t('list_page.table.reset_button')}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            {t('common:button.close', '关闭')}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: any, record: Employee) => {
      // 将姓和名组合来进行搜索
      const fullName = `${record.last_name || ''}${record.first_name || ''}`;
      return fullName.toLowerCase().includes((value as string).toLowerCase());
    },
    filterDropdownProps: {
      onOpenChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text: any, record: Employee) => {
      const fullName = `${record.last_name || ''}${record.first_name || ''}`;
      return searchedColumn === 'fullName' ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={fullName}
        />
      ) : (
        <EmployeeName
          employeeId={record.id}
          employeeName={fullName}
          showId={false}
          className="employee-table-name"
        />
      );
    }
  });

  const columns: ColumnsType<Employee> = [
    {
      title: t('list_page.table.column.full_name'),
      key: 'fullName',
      dataIndex: 'last_name', 
      fixed: 'left',
      width: 180,
      sorter: (a, b) => {
        const nameA = `${a.last_name || ''}${a.first_name || ''}`.trim().toLowerCase();
        const nameB = `${b.last_name || ''}${b.first_name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      },
      ...getFullNameSearchProps(),
    },
    {
      title: t('list_page.table.column.employee_code'),
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 120,
      align: 'center',
      sorter: stringSorter<Employee>('employee_code'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('employee_code'),
    },
    {
      title: t('list_page.table.column.id_number'),
      dataIndex: 'id_number',
      key: 'id_number',
      width: 180,
      align: 'center',
      sorter: stringSorter<Employee>('id_number'),
      ...getColumnSearch('id_number'),
    },
    {
      title: t('list_page.table.column.gender'),
      dataIndex: 'gender_lookup_value_id',
      key: 'gender',
      width: 80, // Adjusted width
      align: 'center',
      render: (genderId: number | undefined | null) => {
        if (genderId === undefined || genderId === null) return t('list_page.table.cell_empty');
        // genderLookupMap is guaranteed by EmployeeListPage's conditional rendering of EmployeeTable
        return genderLookupMap.get(genderId) || t('list_page.table.unknown.gender_param', { genderId });
      },
      filters: genderLookupMap ? Array.from(genderLookupMap.entries()).map(([id, name]) => ({ text: name, value: id })) : [],
      onFilter: (value, record) => record.gender_lookup_value_id === value,
    },
    {
      title: t('list_page.table.column.ethnicity'),
      dataIndex: 'ethnicity',
      key: 'ethnicity',
      width: 100,
      align: 'center',
      sorter: stringSorter<Employee>('ethnicity'),
      ...getColumnSearch('ethnicity'),
    },
    {
      title: t('list_page.table.column.date_of_birth'),
      dataIndex: 'date_of_birth',
      key: 'date_of_birth',
      width: 120,
      align: 'center',
      render: (date: string | Dayjs | undefined) => {
        if (!date) return t('list_page.table.cell_empty');
        try {
            return new Date(date as string).toLocaleDateString();
        } catch (e) {
            return String(date);
        }
      },
      sorter: (a, b) => {
        const dateA = a.date_of_birth ? new Date(a.date_of_birth as string).getTime() : 0;
        const dateB = b.date_of_birth ? new Date(b.date_of_birth as string).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: t('list_page.table.column.education_level'),
      dataIndex: 'education_level_lookup_value_id',
      key: 'education_level',
      width: 120,
      align: 'center',
      render: (educationLevelId: number | undefined | null) => {
        if (educationLevelId === undefined || educationLevelId === null) return t('list_page.table.cell_empty');
        return educationLevelLookupMap.get(educationLevelId) || t('list_page.table.unknown.education_level_param', { educationLevelId });
      },
      filters: educationLevelLookupMap ? Array.from(educationLevelLookupMap.entries()).map(([id, name]) => ({ text: name, value: id })) : [],
      onFilter: (value, record) => record.education_level_lookup_value_id === value,
    },
    {
      title: t('list_page.table.column.first_work_date'),
      dataIndex: 'first_work_date',
      key: 'first_work_date',
      width: 130,
      align: 'center',
      render: (date: string | Dayjs | undefined) => {
        if (!date) return t('list_page.table.cell_empty');
        try {
            return new Date(date as string).toLocaleDateString();
        } catch (e) {
            return String(date);
        }
      },
      sorter: (a, b) => {
        const dateA = a.first_work_date ? new Date(a.first_work_date as string).getTime() : 0;
        const dateB = b.first_work_date ? new Date(b.first_work_date as string).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: t('list_page.table.column.interrupted_service_years'),
      dataIndex: 'interrupted_service_years',
      key: 'interrupted_service_years',
      width: 120,
      align: 'center',
      sorter: numberSorter<Employee>('interrupted_service_years'),
    },
    {
      title: t('list_page.table.column.department'),
      dataIndex: 'department_id',
      key: 'department_id',
      width: 180,
      render: (departmentId: number | string | undefined) => {
        const key = String(departmentId);
        return departmentLookupMap.get(key) || key || '';
      },
      sorter: (a, b) => {
        const deptA = a.department_id !== undefined && departmentLookupMap
          ? (departmentLookupMap.get(String(a.department_id)) || '')
          : '';
        const deptB = b.department_id !== undefined && departmentLookupMap
          ? (departmentLookupMap.get(String(b.department_id)) || '')
          : '';
        return deptA.localeCompare(deptB);
      },
      filters: departmentLookupMap 
        ? Array.from(departmentLookupMap.entries()).map(([id, name]) => ({ text: name, value: id })) 
        : [],
      onFilter: (value, record) => record.department_id === value,
    },
    {
      title: t('list_page.table.column.personnel_category'),
      dataIndex: 'personnel_category_id',
      key: 'personnel_category_id',
      width: 180,
      render: (categoryId: number | string | undefined) => {
        const key = String(categoryId);
        return personnelCategoryMap.get(key) || key || '';
      },
      sorter: (a, b) => {
        const catA = a.personnel_category_id !== undefined && personnelCategoryMap 
          ? (personnelCategoryMap.get(String(a.personnel_category_id)) || '') 
          : '';
        const catB = b.personnel_category_id !== undefined && personnelCategoryMap 
          ? (personnelCategoryMap.get(String(b.personnel_category_id)) || '')
          : '';
        return catA.localeCompare(catB);
      },
      filters: personnelCategoryMap 
        ? Array.from(personnelCategoryMap.entries()).map(([id, name]) => ({ text: name, value: id }))
        : [],
      onFilter: (value, record) => {
        if (!record.personnel_category_id) return false;
        return String(record.personnel_category_id) === String(value);
      },
    },
    {
      title: t('list_page.table.column.actual_position_start_date'),
      dataIndex: 'current_position_start_date',
      key: 'current_position_start_date',
      width: 130,
      align: 'center',
      render: (date: string | Dayjs | undefined) => {
        if (!date) return t('list_page.table.cell_empty');
        try {
            return new Date(date as string).toLocaleDateString();
        } catch (e) {
            return String(date);
        }
      },
      sorter: (a, b) => {
        const dateA = a.current_position_start_date ? new Date(a.current_position_start_date as string).getTime() : 0;
        const dateB = b.current_position_start_date ? new Date(b.current_position_start_date as string).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: t('list_page.table.column.career_position_level_date'),
      dataIndex: 'career_position_level_date',
      key: 'career_position_level_date',
      width: 130,
      align: 'center',
      render: (date: string | Dayjs | undefined) => {
        if (!date) return t('list_page.table.cell_empty');
        try {
            return new Date(date as string).toLocaleDateString();
        } catch (e) {
            return String(date);
        }
      },
      sorter: (a, b) => {
        const dateA = a.career_position_level_date ? new Date(a.career_position_level_date as string).getTime() : 0;
        const dateB = b.career_position_level_date ? new Date(b.career_position_level_date as string).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: t('list_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120, // Adjusted width
      align: 'center',
      render: (statusId: number | undefined | null) => {
        if (statusId === undefined || statusId === null) return <Tag>{t('list_page.table.unknown.status_raw')}</Tag>;
        const statusText = statusLookupMap.get(statusId) || t('list_page.table.unknown.status_param', { statusId });
        let color: 'success' | 'error' | 'processing' | 'warning' | 'default' = 'default';
        
        const activeText = t('list_page.table.status_text.active');
        const inactiveText = t('list_page.table.status_text.inactive');
        const probationText = t('list_page.table.status_text.probation');
        const onLeaveText = t('list_page.table.status_text.on_leave');

        if (statusText === activeText) color = 'success';
        else if (statusText === inactiveText) color = 'error';
        else if (statusText === probationText) color = 'processing';
        else if (statusText === onLeaveText) color = 'warning';
        
        return <Tag color={color}>{statusText}</Tag>;
      },
      filters: Array.from(statusLookupMap.entries()).map(([id, name]) => ({ text: name, value: id })),
      onFilter: (value, record) => record.status_lookup_value_id === value,
    },
    {
      title: t('list_page.table.column.hire_date'),
      dataIndex: 'hire_date',
      key: 'hire_date',
      width: 130, // Adjusted width
      align: 'center',
      render: (date: string | Dayjs | undefined) => {
        if (!date) return t('list_page.table.cell_empty');
        // Standardize date display
        try {
            return new Date(date as string).toLocaleDateString(); // Assuming date is string or Dayjs convertible to string
        } catch (e) {
            return String(date);
        }
      },
      sorter: (a, b) => {
        const dateA = a.hire_date ? new Date(a.hire_date as string).getTime() : 0;
        const dateB = b.hire_date ? new Date(b.hire_date as string).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: t('list_page.table.column.actions'),
      key: 'action',
      fixed: 'right', // 固定操作列在右侧
      width: 120,     // 给操作列一个合适的宽度
      align: 'center',
      render: (_, record: Employee) => (
        <Space size="middle">
          {hasPermission('P_EMPLOYEE_VIEW_DETAIL') && (
            <TableActionButton
              actionType="view"
              onClick={() => onViewDetails(String(record.id))}
              tooltipTitle={t('list_page.table.action.view_details')}
              aria-label={t('list_page.table.action.view_details')}
            />
          )}
          {hasPermission('P_EMPLOYEE_UPDATE') && (
            <TableActionButton
              actionType="edit"
              onClick={() => onEdit(record)}
              tooltipTitle={t('list_page.table.action.edit')}
              aria-label={t('list_page.table.action.edit')}
            />
          )}
          {hasPermission('P_EMPLOYEE_DELETE') && (
            <Popconfirm
              title={t('list_page.delete_confirm.content')}
              onConfirm={() => onDelete(String(record.id))}
              okText={t('list_page.delete_confirm.ok_text')}
              cancelText={t('list_page.delete_confirm.cancel_text')}
            >
              <TableActionButton
                actionType="delete" 
                danger
                tooltipTitle={t('list_page.table.action.delete')}
                aria-label={t('list_page.table.action.delete')}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];



  // 添加表格导出功能
  const { ExportButton } = useTableExport(
    employees || [], 
    columns,
    {
      filename: t('list_page.export.filename'),
      sheetName: t('list_page.export.sheet_name'),
      // buttonText is a prop for ExportButton component, not an option for the hook here
      // successMessage is also likely handled by the component or a notification service
    }
  );

  // 添加列控制功能
  const { visibleColumns, ColumnControl } = useColumnControl(
    columns,
    {
      storageKeyPrefix: 'employee_table',
      // buttonText, tooltipTitle, dropdownTitle, resetText are props for ColumnControl component
      requiredColumns: ['fullName', 'actions'] // 姓名和操作列始终显示
    }
  );

  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Employee> | SorterResult<Employee>[],
    extra: TableCurrentDataSource<Employee>
  ) => {
    // Directly pass all arguments to the parent's onPageChange handler
    onPageChange(paginationConfig, filters, sorter, extra);
  };

  return (
    <div className="employee-table-container">
      <Table
        columns={visibleColumns}
        dataSource={employees}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100', '200'],
          showTotal: (total: number) => t('list_page.pagination.total', { total }),
        }}
        onChange={handleTableChange}
        rowKey="id"
        bordered
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default EmployeeTable; 