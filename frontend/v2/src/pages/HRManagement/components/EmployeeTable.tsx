import React, { useState, useRef, useEffect } from 'react';
import { Table, Space, Button, Tag, Popconfirm, Tooltip, Input } from 'antd';
import type { InputRef } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, PlusSquareOutlined, MinusSquareOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, FilterConfirmProps, SorterResult, TableCurrentDataSource, FilterDropdownProps } from 'antd/es/table/interface';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Employee } from '../types';
// import { EmploymentStatus } from '../types'; // No longer needed as we use statusLookupMap
import { usePermissions } from '../../../hooks/usePermissions';
import type { Dayjs } from 'dayjs'; // Import Dayjs
// ActionButton is being replaced by standard AntD Buttons with icons

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number, sorter?: SorterResult<Employee> | SorterResult<Employee>[], filters?: Record<string, FilterValue | null>) => void;
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
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: keyof Employee,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex as string);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn('');
  };

  const getColumnSearchProps = (dataIndex: keyof Employee, columnTitle: string): object => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`${t('list_page.table.search_placeholder_prefix')} ${columnTitle}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {t('list_page.table.search_button')}
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            {t('list_page.table.reset_button')}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: any, record: Employee) => {
      // 处理常规字段搜索
      const fieldValue = dataIndex.split('.').reduce((obj, key) => obj && obj[key as keyof typeof obj], record as any);
      return fieldValue !== undefined && fieldValue !== null
        ? String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
        : false;
    },
    filterDropdownProps: {
      onOpenChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text: string) =>
      searchedColumn === dataIndex.toString() ? (
        text
      ) : (
        text
      ),
  });

  const columns: ColumnsType<Employee> = [
    {
      title: t('list_page.table.column.full_name'),
      key: 'fullName',
      dataIndex: 'last_name', 
      render: (_, record: Employee) => {
        // 确保获取到有效的姓和名
        const lastName = typeof record.last_name === 'string' ? record.last_name.trim() : '';
        const firstName = typeof record.first_name === 'string' ? record.first_name.trim() : '';
        
        // 构建完整姓名 (中文格式：姓在前，名在后)
        const fullName = lastName && firstName ? `${lastName}${firstName}` : (lastName || firstName);
        
        return fullName || t('list_page.table.cell_empty');
      },
      fixed: 'left',
      width: 180,
      sorter: (a, b) => {
        const nameA = `${a.last_name || ''}${a.first_name || ''}`.trim().toLowerCase();
        const nameB = `${b.last_name || ''}${b.first_name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      },
      // 使用姓和名组合的搜索
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            ref={searchInput}
            placeholder={`${t('list_page.table.search_placeholder_prefix')} ${t('list_page.table.column.full_name')}`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {
              confirm();
              setSearchText(selectedKeys[0] as string);
              setSearchedColumn('fullName');
            }}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                setSearchText(selectedKeys[0] as string);
                setSearchedColumn('fullName');
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
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) => {
        // 将姓和名组合来进行搜索
        const fullNamePinyin = `${record.last_name || ''}${record.first_name || ''}`.toLowerCase();
        return fullNamePinyin.includes((value as string).toLowerCase());
      },
    },
    {
      title: t('list_page.table.column.employee_code'),
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 120,
      align: 'center',
      sorter: (a, b) => (a.employee_code || '').localeCompare(b.employee_code || ''),
      ...getColumnSearchProps('employee_code', t('list_page.table.column.employee_code')),
    },
    {
      title: t('list_page.table.column.gender'),
      dataIndex: 'gender_lookup_value_id',
      key: 'gender',
      width: 100, // Adjusted width
      align: 'center',
      render: (genderId: number | undefined) => {
        if (genderId === undefined || genderId === null) return t('list_page.table.cell_empty');
        return genderLookupMap.get(genderId) || t('list_page.table.unknown.gender_param', { genderId });
      },
      filters: Array.from(genderLookupMap.entries()).map(([id, name]) => ({ text: name, value: id })),
      onFilter: (value, record) => record.gender_lookup_value_id === value,
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
      onFilter: (value, record) => {
        if (!record.department_id) return false;
        return String(record.department_id) === String(value);
      },
      ...getColumnSearchProps('department_id', t('list_page.table.column.department')),
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
      ...getColumnSearchProps('personnel_category_id', t('list_page.table.column.personnel_category')),
    },
    {
      title: t('list_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120, // Adjusted width
      align: 'center',
      render: (statusId: number | undefined) => {
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
            <Tooltip title={t('list_page.table.action.view_details')}>
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(String(record.id))}
                aria-label={t('list_page.table.action.view_details')}
              />
            </Tooltip>
          )}
          {hasPermission('P_EMPLOYEE_UPDATE') && (
            <Tooltip title={t('list_page.table.action.edit')}>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                aria-label={t('list_page.table.action.edit')}
              />
            </Tooltip>
          )}
          {hasPermission('P_EMPLOYEE_DELETE') && (
            <Popconfirm
              title={t('list_page.delete_confirm.content')}
              onConfirm={() => onDelete(String(record.id))}
              okText={t('list_page.delete_confirm.ok_text')}
              cancelText={t('list_page.delete_confirm.cancel_text')}
            >
              <Tooltip title={t('list_page.table.action.delete')}>
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('list_page.table.action.delete')}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 在顶层添加直接的调试代码（这里将一定会执行，而不是在render函数中）
  console.log('🔔🔔🔔 EmployeeTable 直接打印:');
  console.log('🔔 departmentLookupMap:', departmentLookupMap);
  console.log('🔔 personnelCategoryMap:', personnelCategoryMap);
  
  // 直接从Map创建ID-名称对照表，便于参考
  const departmentList = Array.from(departmentLookupMap).map(([id, name]) => `${id}=${name}`).join(', ');
  console.log('🔔 部门ID-名称列表:', departmentList);
  
  const personnelList = Array.from(personnelCategoryMap).map(([id, name]) => `${id}=${name}`).join(', ');
  console.log('🔔 人员身份ID-名称列表:', personnelList);

  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Employee> | SorterResult<Employee>[],
    extra: TableCurrentDataSource<Employee> // Added extra parameter
  ) => {
    // Pass sorter and filters to the parent component
    // The parent component (EmployeeListPage) will handle fetching data with these parameters
    if (extra.action === 'paginate' || extra.action === 'sort' || extra.action === 'filter') {
        onPageChange(
            paginationConfig.current || 1,
            paginationConfig.pageSize || 10,
            sorter,
            filters
        );
    }
  };

  console.log('EmployeeTable 组件已加载 - MAC 测试');
  (window as any)._macTest = 'log ok';

  useEffect(() => {
    console.log('EmployeeTable useEffect: employees', employees);
    console.log('EmployeeTable useEffect: departmentLookupMap', departmentLookupMap);
  }, [employees, departmentLookupMap]);

  return (
    <Table<Employee> 
      columns={columns.map(col => {
        // 直接在这里处理部门和人员身份列的映射关系
        if (col.key === 'department_id') {
          return {
            ...col,
            render: (departmentId: number | string | undefined) => {
              const key = String(departmentId);
              return departmentLookupMap.get(key) || key || '';
            }
          };
        }
        if (col.key === 'personnel_category_id') {
          return {
            ...col,
            render: (categoryId: number | string | undefined) => {
              const key = String(categoryId);
              return personnelCategoryMap.get(key) || key || '';
            }
          };
        }
        return col;
      })}
      dataSource={employees}
      loading={loading}
      expandable={{
        expandIcon: ({ expanded, onExpand, record }) => {
          // @ts-ignore TODO: Define children in Employee type if this is a tree table and it's not already defined.
          const hasChildren = record.children && record.children.length > 0;

          if (!hasChildren) {
            // Render a spacer for rows without children to maintain alignment,
            // matching the size and margin of the actual icons.
            return <span style={{ display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', verticalAlign: 'middle' }} />;
          }

          if (expanded) {
            return (
              <MinusSquareOutlined
                onClick={e => {
                  e.stopPropagation(); // Prevent triggering row onClick if any
                  onExpand(record, e);
                }}
                style={{
                  fontSize: '18px', // Increased size
                  color: '#1890ff', // Prominent color (Ant Design blue)
                  marginRight: '8px',
                  cursor: 'pointer',
                  verticalAlign: 'middle',
                }}
                aria-label={t('list_page.table.action.collapse', 'Collapse row')}
              />
            );
          } else {
            return (
              <PlusSquareOutlined
                onClick={e => {
                  e.stopPropagation(); // Prevent triggering row onClick if any
                  onExpand(record, e);
                }}
                style={{
                  fontSize: '18px', // Increased size
                  color: '#1890ff', // Prominent color (Ant Design blue)
                  marginRight: '8px',
                  cursor: 'pointer',
                  verticalAlign: 'middle',
                }}
                aria-label={t('list_page.table.action.expand', 'Expand row')}
              />
            );
          }
        },
      }}
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
      locale={{
        emptyText: t('list_page.table.empty_text'),
      }}
    />
  );
};

export default EmployeeTable; 