import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Row, Col, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ActionButton from '../../../components/common/ActionButton';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { useNavigate } from 'react-router-dom';
import EmployeeFilterForm from '../components/EmployeeFilterForm';
import EmployeeTable from '../components/EmployeeTable';
import type { Employee, EmployeeQuery } from '../types';
import { usePermissions } from '../../../hooks/usePermissions';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import { employeeService } from '../../../services/employeeService';

const { Title } = Typography;

const EmployeeListPage: React.FC = () => {
  const { t } = useTranslation(['employee', 'pageTitle']);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filters, setFilters] = useState<Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>>({});

  const { lookupMaps, rawLookups, loadingLookups, errorLookups } = useLookupMaps();

  useEffect(() => {
    if (errorLookups) {
      message.error(t('employee:list_page.message.load_aux_data_failed'));
      console.error('Error from useLookupMaps:', errorLookups);
    }
  }, [errorLookups, t]);

  const fetchEmployees = useCallback(async (page: number, size: number, currentFilters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>) => {
    setLoadingData(true);
    try {
      const query: EmployeeQuery = {
        ...currentFilters,
        page,
        pageSize: size,
      };
      const response = await employeeService.getEmployees(query);
      if (response && response.data) {
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
    if (!loadingLookups) {
      fetchEmployees(currentPage, pageSize, filters);
    }
  }, [fetchEmployees, currentPage, pageSize, filters, loadingLookups]);

  const handleSearch = (newFilters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleTableChange = (newPage: number, newPageSize: number) => {
    if (newPage !== currentPage) setCurrentPage(newPage);
    if (newPageSize !== pageSize) setPageSize(newPageSize);
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
          fetchEmployees(currentPage, pageSize, filters);
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

  return (
    <div>
      <PageHeaderLayout>
        <Title level={4} style={{ marginBottom: 0 }}>{t('page_title.employee_files')}</Title>
        {hasPermission('employee:create') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/hr/employees/new')}
            shape="round"
          >
            {t('page_title.create_employee')}
          </Button>
        )}
      </PageHeaderLayout>
      <EmployeeFilterForm
        onSearch={handleSearch} 
        loading={combinedLoading} 
        genderOptions={rawLookups?.genderOptions || []}
        statusOptions={rawLookups?.statusOptions || []}
        departmentOptions={rawLookups?.departmentOptions || []}
        jobTitleOptions={rawLookups?.jobTitleOptions || []}
        educationLevelOptions={rawLookups?.educationLevelOptions || []}
        employmentTypeOptions={rawLookups?.employmentTypeOptions || []}
      />
      <EmployeeTable
        employees={employees}
        loading={combinedLoading}
        total={totalEmployees}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handleTableChange}
        onDelete={handleDelete}
        onEdit={(id: string) => navigate(`/hr/employees/${id}/edit`)}
        onViewDetails={(id: string) => navigate(`/hr/employees/${id}`)}
        genderLookupMap={lookupMaps?.genderMap || new Map()}
        statusLookupMap={lookupMaps?.statusMap || new Map()}
        departmentLookupMap={lookupMaps?.departmentMap || new Map()}
        jobTitleLookupMap={lookupMaps?.jobTitleMap || new Map()}
        educationLevelLookupMap={lookupMaps?.educationLevelMap || new Map()}
        employmentTypeLookupMap={lookupMaps?.employmentTypeMap || new Map()}
        maritalStatusLookupMap={lookupMaps?.maritalStatusMap || new Map()}
        politicalStatusLookupMap={lookupMaps?.politicalStatusMap || new Map()}
        contractTypeLookupMap={lookupMaps?.contractTypeMap || new Map()}
      />
    </div>
  );
};

export default EmployeeListPage; 