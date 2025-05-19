import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Row, Col, Typography, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ActionButton from '../../../components/common/ActionButton';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { useNavigate } from 'react-router-dom';
import EmployeeFilterForm from '../components/EmployeeFilterForm';
import EmployeeTable from '../components/EmployeeTable';
import type { Employee, EmployeeQuery } from '../types';
import type { SorterResult } from 'antd/es/table/interface'; // Import SorterResult
import { usePermissions } from '../../../hooks/usePermissions';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import { employeeService } from '../../../services/employeeService';

const { Title } = Typography;

// 添加立即执行的全局测试日志
console.log('=== 全局测试日志：请检查控制台是否正常显示 ===');
console.warn('=== 全局警告测试：请确认是否看到此警告 ===');
console.error('=== 全局错误测试：请确认是否看到此错误 ===');

const EmployeeListPage: React.FC = () => {
  const { t } = useTranslation(['employee', 'pageTitle']);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [queryOptions, setQueryOptions] = useState<Omit<EmployeeQuery, 'page' | 'pageSize'>>({});
 
  const { lookupMaps, rawLookups, loadingLookups, errorLookups } = useLookupMaps();

  useEffect(() => {
    if (errorLookups) {
      message.error(t('employee:list_page.message.load_aux_data_failed'));
      console.error('Error from useLookupMaps:', errorLookups);
    }
  }, [errorLookups, t]);
 
  const fetchEmployees = useCallback(async (page: number, size: number, currentQueryOptions: Omit<EmployeeQuery, 'page' | 'pageSize'>) => {
    setLoadingData(true);
    try {
      const query: EmployeeQuery = {
        ...currentQueryOptions,
        page,
        pageSize: size,
      };
      console.log('Fetching employees with query:', query); // For debugging
      const response = await employeeService.getEmployees(query);
      if (response && response.data) {
        console.log('Employee data received:', {
          count: response.data.length,
          firstEmployee: response.data[0] ? {
            id: response.data[0].id,
            firstName: response.data[0].first_name,
            lastName: response.data[0].last_name,
            departmentId: response.data[0].department_id,
            personnelCategoryId: response.data[0].personnel_category_id,
          } : 'No employees found'
        });
        setEmployees(response.data);
        setTotalEmployees(response.meta.total_items);
        setCurrentPage(response.meta.current_page);
        setPageSize(response.meta.per_page);
      } else {
        setEmployees([]);
        setTotalEmployees(0);
        setCurrentPage(page);
        setPageSize(size);
        message.error(t('employee:list_page.message.get_employees_failed_empty_response'));
      }
    } catch (error) {
      message.error(t('employee:list_page.message.get_employees_failed'));
      setEmployees([]);
      setTotalEmployees(0);
    } finally {
      setLoadingData(false);
    }
  }, [t]);
 
  useEffect(() => {
    if (employees.length > 0) {
      console.log('EmployeeListPage employees数据:', {
        count: employees.length,
        sample: employees.slice(0, 3).map(e => ({
          id: e.id,
          fullName: `${e.last_name || ''}${e.first_name || ''}`,
          departmentId: e.department_id,
          personnelCategoryId: e.personnel_category_id
        }))
      });
    }
    
    if (lookupMaps) {
      console.log('EmployeeListPage lookupMaps:', {
        departmentMap: lookupMaps.departmentMap?.size ? `包含${lookupMaps.departmentMap.size}个项目` : 'Map为空',
        sampleDepartments: lookupMaps.departmentMap?.size ? Array.from(lookupMaps.departmentMap.entries()).slice(0, 3) : [],
        personnelCategoryMap: lookupMaps.personnelCategoryMap?.size ? `包含${lookupMaps.personnelCategoryMap.size}个项目` : 'Map为空',
        samplePersonnelCategories: lookupMaps.personnelCategoryMap?.size ? Array.from(lookupMaps.personnelCategoryMap.entries()).slice(0, 3) : [],
      });
    }
  }, [employees, lookupMaps]);

  useEffect(() => {
    if (!loadingLookups) {
      console.log('Lookups加载完成，开始获取员工数据');
      fetchEmployees(currentPage, pageSize, queryOptions);
    }
  }, [fetchEmployees, currentPage, pageSize, queryOptions, loadingLookups]);
  
  // 添加单独的useEffect来验证lookupMaps是否正确设置
  useEffect(() => {
    if (lookupMaps && !loadingLookups) {
      console.log('验证lookupMaps是否完整:', {
        genderMapSize: lookupMaps.genderMap?.size || 0,
        statusMapSize: lookupMaps.statusMap?.size || 0,
        departmentMapSize: lookupMaps.departmentMap?.size || 0,
        personnelCategoryMapSize: lookupMaps.personnelCategoryMap?.size || 0,
        // 测试查找示例ID
        departmentTest: lookupMaps.departmentMap?.has('60') ? 
          `部门ID 60 => ${lookupMaps.departmentMap.get('60')}` : '没有ID为60的部门',
        personnelCategoryTest: lookupMaps.personnelCategoryMap?.has('78') ? 
          `人员身份ID 78 => ${lookupMaps.personnelCategoryMap.get('78')}` : '没有ID为78的人员身份',
      });
    }
  }, [lookupMaps, loadingLookups]);

  const handleSearch = (formFilters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>) => {
    // Merge form filters with existing sort options, table filters will be handled by handleTableChange
    setQueryOptions(prevOptions => ({
        ...prevOptions, // Keep existing sort order and table filters
        ...formFilters, // Apply new form filters
    }));
    setCurrentPage(1); // Reset to first page on new search
  };
 
  const handleTableChange = (
    newPage: number,
    newPageSize: number,
    sorter?: SorterResult<Employee> | SorterResult<Employee>[],
    tableFilters?: Record<string, any | null>
  ) => {
    const newQueryOptions: Omit<EmployeeQuery, 'page' | 'pageSize'> = { ...queryOptions };

    // Handle sorting
    if (sorter && !Array.isArray(sorter) && sorter.field && sorter.order) {
      newQueryOptions.sortBy = String(sorter.field);
      newQueryOptions.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    } else if (Array.isArray(sorter) && sorter.length > 0 && sorter[0].field && sorter[0].order) {
      // Handle array sorter (though typically single sorter is used)
      newQueryOptions.sortBy = String(sorter[0].field);
      newQueryOptions.sortOrder = sorter[0].order === 'ascend' ? 'asc' : 'desc';
    } else {
      // Clear sort if order is undefined (column header clicked to clear sort)
      delete newQueryOptions.sortBy;
      delete newQueryOptions.sortOrder;
    }

    // Handle filters from table
    if (tableFilters) {
      Object.keys(tableFilters).forEach(key => {
        const filterValue = tableFilters[key];
        if (filterValue && filterValue.length > 0) {
          // Assuming single value selection for simplicity, or join if backend supports array/comma-separated
          (newQueryOptions as any)[key] = filterValue[0];
        } else {
          delete (newQueryOptions as any)[key]; // Remove filter if not set
        }
      });
    }
    
    // Remove any filter keys that were part of EmployeeQuery but are now null/undefined from tableFilters
    // This ensures that if a table filter is cleared, it's removed from queryOptions
    const currentTableFilterKeys = tableFilters ? Object.keys(tableFilters) : [];
    Object.keys(newQueryOptions).forEach(key => {
        if (key !== 'sortBy' && key !== 'sortOrder' &&
            !currentTableFilterKeys.includes(key) &&
            !(key in (queryOptions as Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>)) // Check if it was an original form filter
            ) {
            // This logic might need refinement to distinguish between form filters and table filters.
            // For now, if a key was in tableFilters and now it's not, or value is null, remove it.
            // This part is tricky: we need to preserve form filters while updating table filters.
            // A better approach might be to have separate states for form filters and table-derived filters.
            // For now, let's assume table filters overwrite if they exist, or are removed if cleared.
        }
    });


    setQueryOptions(newQueryOptions);
    if (newPage !== currentPage) setCurrentPage(newPage);
    if (newPageSize !== pageSize) setPageSize(newPageSize);
    // Fetching is handled by the useEffect watching queryOptions, currentPage, pageSize
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
          fetchEmployees(currentPage, pageSize, queryOptions); // Use queryOptions
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

  console.log('EmployeeListPage: lookupMaps', lookupMaps);
  if (lookupMaps) {
    console.log('EmployeeListPage: departmentMap size', lookupMaps.departmentMap?.size);
    console.log('EmployeeListPage: departmentMap keys', Array.from(lookupMaps.departmentMap?.keys() || []));
    console.log('EmployeeListPage: personnelCategoryMap size', lookupMaps.personnelCategoryMap?.size);
    console.log('EmployeeListPage: personnelCategoryMap keys', Array.from(lookupMaps.personnelCategoryMap?.keys() || []));
  }

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
          </Space>
        }
      >
        <EmployeeFilterForm
          onSearch={handleSearch} 
          loading={combinedLoading} 
          genderOptions={rawLookups?.genderOptions || []}
          statusOptions={rawLookups?.statusOptions || []}
          departmentOptions={rawLookups?.departmentOptions || []}
          personnelCategoryOptions={rawLookups?.personnelCategoryOptions || []}
          educationLevelOptions={rawLookups?.educationLevelOptions || []}
          employmentTypeOptions={rawLookups?.employmentTypeOptions || []}
        />
        {lookupMaps && lookupMaps.departmentMap && lookupMaps.personnelCategoryMap ? (
          <EmployeeTable
            employees={employees}
            loading={combinedLoading}
            total={totalEmployees}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handleTableChange}
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