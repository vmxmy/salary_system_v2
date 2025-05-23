import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Space, Tooltip, Input } from 'antd';
import { PlusOutlined, DownloadOutlined, SettingOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { useNavigate } from 'react-router-dom';
import EmployeeTable from '../components/EmployeeTable';
import type { Employee, EmployeeQuery } from '../types';
import type { SorterResult, ColumnsType } from 'antd/es/table/interface';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import { employeeService } from '../../../services/employeeService';
import { useTableExport, useColumnControl, stringSorter, numberSorter, dateSorter, useTableSearch } from '../../../components/common/TableUtils';
import type { Dayjs } from 'dayjs';
import EmployeeName from '../../../components/common/EmployeeName';
import Highlighter from 'react-highlight-words';
import TableActionButton from '../../../components/common/TableActionButton';
import { useEmployeePermissions } from '../../../hooks/useEmployeePermissions';

// Function to generate table column configurations
const generateEmployeeTableColumnsConfig = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof Employee) => any,
  lookupMaps: any,
  employeePermissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (employee: Employee) => void,
  onDelete: (employeeId: string) => void,
  onViewDetails: (employeeId: string) => void
): ColumnsType<Employee> => {
  const columns: ColumnsType<Employee> = [
    {
      title: t('employee:list_page.table.column.full_name'),
      key: 'fullName',
      dataIndex: 'last_name',
      render: (_text: any, record: Employee) => `${record.last_name || ''}${record.first_name || ''}`,
      sorter: (a, b) => {
        const nameA = `${a.last_name || ''}${a.first_name || ''}`.trim().toLowerCase();
        const nameB = `${b.last_name || ''}${b.first_name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder="搜索姓名"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                confirm();
                close();
              }}
            >
              关闭
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) => {
        const fullName = `${record.last_name || ''}${record.first_name || ''}`;
        return fullName.toLowerCase().includes((value as string).toLowerCase());
      },
    },
    {
      title: t('employee:list_page.table.column.employee_code'),
      dataIndex: 'employee_code',
      key: 'employee_code',
      sorter: stringSorter<Employee>('employee_code'),
      ...getColumnSearch('employee_code'),
    },
    {
      title: t('employee:list_page.table.column.id_number'),
      dataIndex: 'id_number',
      key: 'id_number',
      sorter: stringSorter<Employee>('id_number'),
      ...getColumnSearch('id_number'),
    },
    {
      title: t('employee:list_page.table.column.gender'),
      dataIndex: 'gender_lookup_value_id',
      key: 'gender',
      render: (genderId: number | undefined) => lookupMaps?.genderMap?.get(genderId as number) || '',
      filters: lookupMaps?.genderMap ? Array.from(lookupMaps.genderMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.gender_lookup_value_id === value,
    },
    {
      title: t('employee:list_page.table.column.ethnicity'),
      dataIndex: 'ethnicity',
      key: 'ethnicity',
      sorter: stringSorter<Employee>('ethnicity'),
      ...getColumnSearch('ethnicity'),
    },
    {
      title: t('employee:list_page.table.column.nationality'),
      dataIndex: 'nationality',
      key: 'nationality',
      sorter: stringSorter<Employee>('nationality'),
      ...getColumnSearch('nationality'),
    },
    {
      title: t('employee:list_page.table.column.date_of_birth'),
      dataIndex: 'date_of_birth',
      key: 'date_of_birth',
      render: (date: string | Dayjs | undefined) => date ? new Date(date as string).toLocaleDateString() : '',
      sorter: dateSorter<Employee>('date_of_birth'),
    },
    {
      title: t('employee:list_page.table.column.education_level'),
      dataIndex: 'education_level_lookup_value_id',
      key: 'education_level',
      render: (educationLevelId: number | undefined) => lookupMaps?.educationLevelMap?.get(educationLevelId as number) || '',
      filters: lookupMaps?.educationLevelMap ? Array.from(lookupMaps.educationLevelMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.education_level_lookup_value_id === value,
    },
    {
      title: t('employee:list_page.table.column.marital_status'),
      dataIndex: 'marital_status_lookup_value_id',
      key: 'marital_status',
      render: (maritalStatusId: number | undefined) => lookupMaps?.maritalStatusMap?.get(maritalStatusId as number) || '',
      filters: lookupMaps?.maritalStatusMap ? Array.from(lookupMaps.maritalStatusMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.marital_status_lookup_value_id === value,
    },
    {
      title: t('employee:list_page.table.column.political_status'),
      dataIndex: 'political_status_lookup_value_id',
      key: 'political_status',
      render: (politicalStatusId: number | undefined) => lookupMaps?.politicalStatusMap?.get(politicalStatusId as number) || '',
      filters: lookupMaps?.politicalStatusMap ? Array.from(lookupMaps.politicalStatusMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.political_status_lookup_value_id === value,
    },
    {
      title: t('employee:list_page.table.column.first_work_date'),
      dataIndex: 'first_work_date',
      key: 'first_work_date',
      render: (date: string | Dayjs | undefined) => date ? new Date(date as string).toLocaleDateString() : '',
      sorter: dateSorter<Employee>('first_work_date'),
    },
    {
      title: t('employee:list_page.table.column.interrupted_service_years'),
      dataIndex: 'interrupted_service_years',
      key: 'interrupted_service_years',
      sorter: numberSorter<Employee>('interrupted_service_years'),
    },
    {
      title: t('employee:list_page.table.column.email'),
      dataIndex: 'email',
      key: 'email',
      sorter: stringSorter<Employee>('email'),
      ...getColumnSearch('email'),
    },
    {
      title: t('employee:list_page.table.column.phone_number'),
      dataIndex: 'phone_number',
      key: 'phone_number',
      sorter: stringSorter<Employee>('phone_number'),
      ...getColumnSearch('phone_number'),
    },
    {
      title: t('employee:list_page.table.column.home_address'),
      dataIndex: 'home_address',
      key: 'home_address',
      sorter: stringSorter<Employee>('home_address'),
      ...getColumnSearch('home_address'),
    },
    {
      title: t('employee:list_page.table.column.salary_level'),
      dataIndex: 'salary_level_lookup_value_name',
      key: 'salary_level',
      sorter: stringSorter<Employee>('salary_level_lookup_value_name'),
      ...getColumnSearch('salary_level_lookup_value_name'),
    },
    {
      title: t('employee:list_page.table.column.salary_grade'),
      dataIndex: 'salary_grade_lookup_value_name',
      key: 'salary_grade',
      sorter: stringSorter<Employee>('salary_grade_lookup_value_name'),
      ...getColumnSearch('salary_grade_lookup_value_name'),
    },
    {
      title: t('employee:list_page.table.column.ref_salary_level'),
      dataIndex: 'ref_salary_level_lookup_value_name',
      key: 'ref_salary_level',
      sorter: stringSorter<Employee>('ref_salary_level_lookup_value_name'),
      ...getColumnSearch('ref_salary_level_lookup_value_name'),
    },
    {
      title: t('employee:list_page.table.column.department'),
      dataIndex: 'department_id',
      key: 'department_id',
      render: (departmentId: string | undefined) => lookupMaps?.departmentMap?.get(String(departmentId)) || '',
      filters: lookupMaps?.departmentMap ? Array.from(lookupMaps.departmentMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => String(record.department_id) === String(value),
    },
    {
      title: t('employee:list_page.table.column.personnel_category'),
      dataIndex: 'personnel_category_id',
      key: 'personnel_category_id',
      render: (categoryId: string | undefined) => lookupMaps?.personnelCategoryMap?.get(String(categoryId)) || '',
      filters: lookupMaps?.personnelCategoryMap ? Array.from(lookupMaps.personnelCategoryMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => String(record.personnel_category_id) === String(value),
    },
    {
      title: t('employee:list_page.table.column.actual_position'),
      dataIndex: 'actualPositionName',
      key: 'actualPositionName',
      sorter: stringSorter<Employee>('actualPositionName'),
      ...getColumnSearch('actualPositionName'),
    },
    {
      title: t('employee:list_page.table.column.actual_position_start_date'),
      dataIndex: 'current_position_start_date',
      key: 'current_position_start_date',
      render: (date: string | Dayjs | undefined) => date ? new Date(date as string).toLocaleDateString() : '',
      sorter: dateSorter<Employee>('current_position_start_date'),
    },
    {
      title: t('employee:list_page.table.column.career_position_level_date'),
      dataIndex: 'career_position_level_date',
      key: 'career_position_level_date',
      render: (date: string | Dayjs | undefined) => date ? new Date(date as string).toLocaleDateString() : '',
      sorter: dateSorter<Employee>('career_position_level_date'),
    },
    {
      title: t('employee:list_page.table.column.employment_type'),
      dataIndex: 'employment_type_lookup_value_id',
      key: 'employment_type',
      render: (employmentTypeId: number | undefined) => lookupMaps?.employmentTypeMap?.get(employmentTypeId as number) || '',
      filters: lookupMaps?.employmentTypeMap ? Array.from(lookupMaps.employmentTypeMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.employment_type_lookup_value_id === value,
    },
    {
      title: t('employee:list_page.table.column.contract_type'),
      dataIndex: 'contract_type_lookup_value_id',
      key: 'contract_type',
      render: (contractTypeId: number | undefined) => lookupMaps?.contractTypeMap?.get(contractTypeId as number) || '',
      filters: lookupMaps?.contractTypeMap ? Array.from(lookupMaps.contractTypeMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.contract_type_lookup_value_id === value,
    },
    {
      title: t('employee:list_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      render: (statusId: number | undefined) => lookupMaps?.statusMap?.get(statusId as number) || '',
      filters: lookupMaps?.statusMap ? Array.from(lookupMaps.statusMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[0],
      })) : [],
      onFilter: (value, record) => record.status_lookup_value_id === value,
    },
    {
      title: t('employee:list_page.table.column.hire_date'),
      dataIndex: 'hire_date',
      key: 'hire_date',
      render: (date: string | Dayjs | undefined) => date ? new Date(date as string).toLocaleDateString() : '',
      sorter: dateSorter<Employee>('hire_date'),
    },
    {
      title: t('employee:list_page.table.column.bank_name'),
      dataIndex: 'bank_name',
      key: 'bank_name',
      sorter: stringSorter<Employee>('bank_name'),
      ...getColumnSearch('bank_name'),
    },
    {
      title: t('employee:list_page.table.column.bank_account_number'),
      dataIndex: 'bank_account_number',
      key: 'bank_account_number',
      sorter: stringSorter<Employee>('bank_account_number'),
      ...getColumnSearch('bank_account_number'),
    },
    {
      title: t('employee:list_page.table.column.emergency_contact_name'),
      dataIndex: 'emergency_contact_name',
      key: 'emergency_contact_name',
      sorter: stringSorter<Employee>('emergency_contact_name'),
      ...getColumnSearch('emergency_contact_name'),
    },
    {
      title: t('employee:list_page.table.column.emergency_contact_phone'),
      dataIndex: 'emergency_contact_phone',
      key: 'emergency_contact_phone',
      sorter: stringSorter<Employee>('emergency_contact_phone'),
      ...getColumnSearch('emergency_contact_phone'),
    },
    {
      title: t('employee:list_page.table.column.action'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: string, record: Employee) => (
        <Space size="small">
          {employeePermissions.canViewDetail && (
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(String(record.id))} 
              tooltipTitle={t('common:action.view')} 
            />
          )}
          {employeePermissions.canUpdate && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(record)} 
              tooltipTitle={t('common:action.edit')} 
            />
          )}
          {employeePermissions.canDelete && (
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(String(record.id))} 
              tooltipTitle={t('common:action.delete')} 
            />
          )}
        </Space>
      ),
    },
  ];
  return columns;
};

// 员工列表页面组件
const EmployeeListPage: React.FC = () => {
  const { t } = useTranslation(['employee', 'pageTitle', 'common']);
  const navigate = useNavigate();
  const {
    canViewList,
    canViewDetail,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
  } = useEmployeePermissions();

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { lookupMaps, rawLookups, loadingLookups, errorLookups } = useLookupMaps();

  const { getColumnSearch, searchText, searchedColumn } = useTableSearch();

  // Fetches ALL employees
  const fetchAllEmployees = useCallback(async () => {
    setLoadingData(true);
    try {
      const query: EmployeeQuery = { page: 1, size: 100 };
      console.log('Fetching ALL employees with query:', query);
      const response = await employeeService.getEmployees(query);
      
      if (response && response.data) {
        console.log('[EmployeeListPage] fetchAllEmployees - Response received. Data length:', response.data.length, 'Meta:', response.meta);
        setAllEmployees(response.data);
      } else {
        console.log('[EmployeeListPage] fetchAllEmployees - No data in response.');
        setAllEmployees([]);
        message.error(t('employee:list_page.message.get_employees_failed_empty_response'));
      }
    } catch (error) {
      message.error(t('employee:list_page.message.get_employees_failed'));
      setAllEmployees([]);
    } finally {
      setLoadingData(false);
    }
  }, [t]);

  // 批量删除处理函数
  const handleBatchDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('employee:list_page.message.no_employees_selected'));
      return;
    }

    Modal.confirm({
      title: t('employee:list_page.batch_delete_confirm.title'),
      content: t('employee:list_page.batch_delete_confirm.content', { count: selectedRowKeys.length }),
      okText: t('employee:list_page.batch_delete_confirm.ok_text'),
      okType: 'danger',
      cancelText: t('employee:list_page.batch_delete_confirm.cancel_text'),
      onOk: async () => {
        setLoadingData(true);
        try {
          // 逐个删除选中的员工
          const deletePromises = selectedRowKeys.map(id => 
            employeeService.deleteEmployee(String(id))
          );
          await Promise.all(deletePromises);
          
          message.success(t('employee:list_page.message.batch_delete_success', { count: selectedRowKeys.length }));
          setSelectedRowKeys([]); // 清空选择
          fetchAllEmployees(); // 重新获取数据
        } catch (error) {
          message.error(t('employee:list_page.message.batch_delete_failed'));
          console.error('Failed to batch delete employees:', error);
        } finally {
          setLoadingData(false);
        }
      },
    });
  }, [selectedRowKeys, t, fetchAllEmployees]);

  // 定义删除处理函数
  const handleDelete = useCallback(async (employeeId: string) => {
    Modal.confirm({
      title: t('employee:list_page.delete_confirm.title'),
      content: t('employee:list_page.delete_confirm.content'),
      okText: t('employee:list_page.delete_confirm.ok_text'),
      okType: 'danger',
      cancelText: t('employee:list_page.delete_confirm.cancel_text'),
      onOk: async () => {
        setLoadingData(true);
        try {
          await employeeService.deleteEmployee(employeeId);
          message.success(t('employee:list_page.message.delete_employee_success'));
          fetchAllEmployees(); // Refetch all data after deletion
        } catch (error) {
          message.error(t('employee:list_page.message.delete_employee_failed'));
          console.error('Failed to delete employee:', error);
        } finally {
            setLoadingData(false);
        }
      },
    });
  }, [t, fetchAllEmployees]);

  // Generate the full column configuration using React.useMemo
  const tableColumnsConfigForControls = React.useMemo(() => 
    generateEmployeeTableColumnsConfig(
      t, 
      getColumnSearch, 
      lookupMaps, 
      {
        canViewDetail: canViewDetail,
        canUpdate: canUpdate,
        canDelete: canDelete
      },
      (employee: Employee) => navigate(`/hr/employees/${employee.id}/edit`, { state: { employeeData: employee } }),
      handleDelete,
      (employeeId: string) => navigate(`/hr/employees/${employeeId}`)
    ),
    [t, getColumnSearch, lookupMaps, canViewDetail, canUpdate, canDelete, navigate, handleDelete]
  );

  const { ExportButton } = useTableExport(
    allEmployees || [], 
    tableColumnsConfigForControls, // Use the generated config
    {
      filename: t('employee:list_page.export.filename'),
      sheetName: t('employee:list_page.export.sheet_name'),
      buttonText: t('employee:list_page.export.button_text'),
      successMessage: t('employee:list_page.export.success_message')
    }
  );

  const { visibleColumns, ColumnControl, clearColumnStorage } = useColumnControl(
    tableColumnsConfigForControls, // Use the generated config
    {
      storageKeyPrefix: 'employee_list_table',
      buttonText: t('employee:list_page.column_control.button_text'),
      tooltipTitle: t('employee:list_page.column_control.tooltip'),
      dropdownTitle: t('employee:list_page.column_control.dropdown_title'),
      resetText: t('employee:list_page.column_control.reset_text'),
      requiredColumns: ['fullName', 'employee_code', 'status', 'action', 'actualPositionName', 'personnel_category_id']
    }
  );

  // 添加调试日志
  useEffect(() => {
    console.log('📋 [EmployeeListPage] tableColumnsConfigForControls length:', tableColumnsConfigForControls.length);
    console.log('📋 [EmployeeListPage] visibleColumns length:', visibleColumns.length);
    
    // 检查是否包含银行信息字段
    const hasBankNameColumn = tableColumnsConfigForControls.some(col => col.key === 'bank_name');
    const hasBankAccountColumn = tableColumnsConfigForControls.some(col => col.key === 'bank_account_number');
    const visibleBankNameColumn = visibleColumns.some(col => col.key === 'bank_name');
    const visibleBankAccountColumn = visibleColumns.some(col => col.key === 'bank_account_number');
    
    console.log('🏦 [EmployeeListPage] 列配置中包含银行名称字段:', hasBankNameColumn);
    console.log('🏦 [EmployeeListPage] 列配置中包含银行账号字段:', hasBankAccountColumn);
    console.log('👁️ [EmployeeListPage] 可见列中包含银行名称字段:', visibleBankNameColumn);
    console.log('👁️ [EmployeeListPage] 可见列中包含银行账号字段:', visibleBankAccountColumn);
    
    // 输出所有列的key
    console.log('📝 [EmployeeListPage] 所有列的keys:', tableColumnsConfigForControls.map(col => col.key));
    console.log('👁️ [EmployeeListPage] 可见列的keys:', visibleColumns.map(col => col.key));
  }, [tableColumnsConfigForControls, visibleColumns]);

  useEffect(() => {
    if (errorLookups) {
      message.error(t('employee:list_page.message.load_aux_data_failed'));
      console.error('Error from useLookupMaps:', errorLookups);
    }
  }, [errorLookups, t]);
 
  // Fetch all employees once lookups are loaded
  useEffect(() => {
    if (!loadingLookups) {
      fetchAllEmployees();
    }
  }, [fetchAllEmployees, loadingLookups]); // Depends on fetchAllEmployees and loadingLookups

  useEffect(() => {
    console.log('[EmployeeListPage] allEmployees state updated, length:', allEmployees.length);
  }, [allEmployees]);
  


  // Ant Table's onChange handler for client-side operations
  const handleTableChange = (
    pagination: any, // pagination object from Ant Table
    filters: Record<string, any | null>, // filters object from Ant Table
    sorter: SorterResult<Employee> | SorterResult<Employee>[], // sorter object from Ant Table
    extra: { currentDataSource: Employee[], action: string } // extra info
  ) => {
    // For client-side pagination, sorting, and filtering,
    // Ant Table handles these internally based on the full dataSource.
    // This callback can be used to log changes or if any external state needs to be synced.
    console.log('Ant Table onChange event:', { pagination, filters, sorter, extra });
    // No need to set any state here for data fetching purposes when all data is client-side.
  };
 
  const combinedLoading = loadingData || loadingLookups;

  // Note: EmployeeFilterForm is not present in the current file content.
  // If it were, its onSearch would need to update a filter state,
  // and `filteredEmployees` would be derived from `allEmployees` using those filters.
  // For now, we pass `allEmployees` directly.

  return (
    <div>
      <PageHeaderLayout
        pageTitle={t('pageTitle:employee_list')}
        actions={
          <Space>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/hr/employees/new')}
                shape="round"
              >
                {t('pageTitle:create_employee')}
              </Button>
            )}
            {canDelete && selectedRowKeys.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
                shape="round"
              >
                {t('employee:list_page.batch_delete_button', { count: selectedRowKeys.length })}
              </Button>
            )}
            {canExport && (
              <ExportButton />
            )}
            <ColumnControl />
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="default"
                icon={<SettingOutlined />}
                onClick={() => {
                  clearColumnStorage();
                  message.success('列设置已重置，请刷新页面');
                }}
                style={{ marginLeft: 8 }}
              >
                重置列设置
              </Button>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="default"
                icon={<SettingOutlined />}
                onClick={() => {
                  // 获取本地存储中的列设置
                  const storageKey = 'employee_list_table_columns';
                  const columnSettings = localStorage.getItem(storageKey);
                  console.log('当前列设置:', columnSettings ? JSON.parse(columnSettings) : '未找到列设置');
                  message.info('列设置信息已打印到控制台');
                }}
                style={{ marginLeft: 8 }}
              >
                查看列设置
              </Button>
            )}
          </Space>
        }
      >
        {lookupMaps && lookupMaps.departmentMap && lookupMaps.personnelCategoryMap ? (
          (() => {
            console.log('[EmployeeListPage] Rendering EmployeeTable. allEmployees.length:', allEmployees.length);
            return (
              <EmployeeTable
                employees={allEmployees} // Pass all employees
                loading={combinedLoading}
                total={allEmployees.length} // Total is the length of all employees
                columns={visibleColumns} // 新增：传递经过列控制处理后的可见列
                selectedRowKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                onPageChange={handleTableChange} // Still useful for logging or other side effects
                onDelete={handleDelete}
                onEdit={(employee: Employee) => navigate(`/hr/employees/${employee.id}/edit`, { state: { employeeData: employee } })}
                onViewDetails={(id: string) => navigate(`/hr/employees/${id}`)}
                genderLookupMap={lookupMaps.genderMap || new Map()}
                statusLookupMap={lookupMaps.statusMap || new Map()}
                departmentLookupMap={lookupMaps.departmentMap}
                personnelCategoryMap={lookupMaps.personnelCategoryMap}
                educationLevelLookupMap={lookupMaps.educationLevelMap || new Map()}
                employmentTypeLookupMap={lookupMaps.employmentTypeMap || new Map()}
                maritalStatusLookupMap={lookupMaps.maritalStatusMap || new Map()}
                politicalStatusLookupMap={lookupMaps.politicalStatusMap || new Map()}
                contractTypeLookupMap={lookupMaps.contractTypeMap || new Map()}
              />
            );
          })()
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            {loadingLookups ? t('employee:list_page.loading_lookups') : t('employee:list_page.lookup_data_error')}
          </div>
        )}
      </PageHeaderLayout>
    </div>
  );
};

export default EmployeeListPage; 