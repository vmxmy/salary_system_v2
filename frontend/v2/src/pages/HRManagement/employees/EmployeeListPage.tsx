import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Space, Tooltip } from 'antd';
import { PlusOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { useNavigate } from 'react-router-dom';
import EmployeeTable from '../components/EmployeeTable';
import type { Employee, EmployeeQuery } from '../types';
import type { SorterResult, ColumnsType } from 'antd/es/table/interface';
import { usePermissions } from '../../../hooks/usePermissions';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import { employeeService } from '../../../services/employeeService';
import { useTableExport, useColumnControl, stringSorter, numberSorter, dateSorter, useTableSearch } from '../../../components/common/TableUtils';
import type { Dayjs } from 'dayjs';
import EmployeeName from '../../../components/common/EmployeeName';
import Highlighter from 'react-highlight-words';


// 员工列表页面组件

const EmployeeListPage: React.FC = () => {
  const { t } = useTranslation(['employee', 'pageTitle', 'common']);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  const { lookupMaps, rawLookups, loadingLookups, errorLookups } = useLookupMaps();

  const { getColumnSearch, searchText, searchedColumn } = useTableSearch();

  const tableColumnsConfigForControls: ColumnsType<Employee> = [
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
    },
    {
      title: t('employee:list_page.table.column.employee_code'),
      dataIndex: 'employee_code',
      key: 'employee_code',
      sorter: stringSorter<Employee>('employee_code'),
    },
    {
      title: t('employee:list_page.table.column.id_number'),
      dataIndex: 'id_number',
      key: 'id_number',
      sorter: stringSorter<Employee>('id_number'),
    },
    {
      title: t('employee:list_page.table.column.gender'),
      dataIndex: 'gender_lookup_value_id',
      key: 'gender',
      render: (genderId: number | undefined) => lookupMaps?.genderMap?.get(genderId as number) || ''
    },
    {
      title: t('employee:list_page.table.column.department'),
      dataIndex: 'department_id',
      key: 'department_id',
      render: (departmentId: string | undefined) => lookupMaps?.departmentMap?.get(String(departmentId)) || ''
    },
    {
      title: t('employee:list_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      render: (statusId: number | undefined) => lookupMaps?.statusMap?.get(statusId as number) || ''
    },
    {
      title: t('employee:list_page.table.column.hire_date'),
      dataIndex: 'hire_date',
      key: 'hire_date',
      render: (date: string | Dayjs | undefined) => date ? new Date(date as string).toLocaleDateString() : ''
    },
  ];

  const { ExportButton } = useTableExport(
    allEmployees || [], 
    tableColumnsConfigForControls, 
    {
      filename: t('employee:list_page.export.filename'),
      sheetName: t('employee:list_page.export.sheet_name'),
      buttonText: t('employee:list_page.export.button_text'),
      successMessage: t('employee:list_page.export.success_message')
    }
  );

  const { ColumnControl } = useColumnControl(
    tableColumnsConfigForControls, 
    {
      storageKeyPrefix: 'employee_table_page_level',
      buttonText: t('employee:list_page.column_control.button_text'),
      tooltipTitle: t('employee:list_page.column_control.tooltip'),
      dropdownTitle: t('employee:list_page.column_control.dropdown_title'),
      resetText: t('employee:list_page.column_control.reset_text'),
      requiredColumns: ['fullName']
    }
  );

  useEffect(() => {
    if (errorLookups) {
      message.error(t('employee:list_page.message.load_aux_data_failed'));
      console.error('Error from useLookupMaps:', errorLookups);
    }
  }, [errorLookups, t]);
 
  // Fetches ALL employees
  const fetchAllEmployees = useCallback(async () => {
    setLoadingData(true);
    try {
      // Request a large enough page size to get all items. Backend max is 100.
      // For 40 items, pageSize: 100 is sufficient.
      const query: EmployeeQuery = { page: 1, size: 100 }; // Changed pageSize to size
      console.log('Fetching ALL employees with query:', query);
      const response = await employeeService.getEmployees(query);
      
      if (response && response.data) {
        console.log('[EmployeeListPage] fetchAllEmployees - Response received. Data length:', response.data.length, 'Meta:', response.meta);
        setAllEmployees(response.data);
        // No longer need to set totalEmployees, currentPage, pageSize from response for backend pagination
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
  }, [t]); // employeeService is stable, t is for translation
 


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
 
  const handleDelete = async (employeeId: string) => {
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
            {hasPermission('P_EMPLOYEE_CREATE') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/hr/employees/new')}
                shape="round"
              >
                {t('pageTitle:create_employee')}
              </Button>
            )}
            {hasPermission('P_EMPLOYEE_EXPORT') && (
              <ExportButton />
            )}
            <ColumnControl />
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