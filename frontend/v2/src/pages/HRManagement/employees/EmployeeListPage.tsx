import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Row, Col, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EmployeeFilterForm from '../components/EmployeeFilterForm';
import EmployeeTable from '../components/EmployeeTable';
import type { Employee, EmployeeQuery, LookupItem } from '../types';
import { employeeService } from '../../../services/employeeService';
import { lookupService } from '../../../services/lookupService';
import { usePermissions } from '../../../hooks/usePermissions';

const { Title } = Typography;

const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filters, setFilters] = useState<Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>>({});

  // State for lookup data and maps
  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [genderLookupMap, setGenderLookupMap] = useState<Map<number, string>>(new Map());
  const [statusLookupMap, setStatusLookupMap] = useState<Map<number, string>>(new Map());
  const [educationLevelLookupMap, setEducationLevelLookupMap] = useState<Map<number, string>>(new Map());
  const [employmentTypeLookupMap, setEmploymentTypeLookupMap] = useState<Map<number, string>>(new Map());
  const [maritalStatusLookupMap, setMaritalStatusLookupMap] = useState<Map<number, string>>(new Map());
  const [politicalStatusLookupMap, setPoliticalStatusLookupMap] = useState<Map<number, string>>(new Map());
  const [contractTypeLookupMap, setContractTypeLookupMap] = useState<Map<number, string>>(new Map());
  
  // For filter form - pass raw LookupItem[]
  const [genderOptions, setGenderOptions] = useState<LookupItem[]>([]);
  const [statusOptions, setStatusOptions] = useState<LookupItem[]>([]);
  const [educationLevelOptions, setEducationLevelOptions] = useState<LookupItem[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<LookupItem[]>([]);
  // Add more for other filters if needed by EmployeeFilterForm

  useEffect(() => {
    const fetchAllLookups = async () => {
      setLoadingLookups(true);
      try {
        const [
          genders, 
          statuses, 
          eduLevels, 
          empTypes,
          maritals,
          politicals,
          contractTypes
        ] = await Promise.all([
          lookupService.getGenderLookup(),
          lookupService.getEmployeeStatusesLookup(),
          lookupService.getEducationLevelsLookup(),
          lookupService.getEmploymentTypesLookup(),
          lookupService.getMaritalStatusesLookup(),
          lookupService.getPoliticalStatusesLookup(),
          lookupService.getContractTypesLookup(),
        ]);

        const createMap = (items: LookupItem[]) => new Map(items.map(item => [Number(item.value), item.label]));

        setGenderLookupMap(createMap(genders));
        setStatusLookupMap(createMap(statuses));
        setEducationLevelLookupMap(createMap(eduLevels));
        setEmploymentTypeLookupMap(createMap(empTypes));
        setMaritalStatusLookupMap(createMap(maritals));
        setPoliticalStatusLookupMap(createMap(politicals));
        setContractTypeLookupMap(createMap(contractTypes));

        // Set options for filter form
        setGenderOptions(genders);
        setStatusOptions(statuses);
        setEducationLevelOptions(eduLevels);
        setEmploymentTypeOptions(empTypes);
        // Set other options if needed by filter form

      } catch (error) {
        message.error('加载辅助数据失败');
        console.error('Failed to fetch lookups for list page:', error);
      }
      setLoadingLookups(false);
    };
    fetchAllLookups();
  }, []);

  const fetchEmployees = useCallback(async (
    page: number,
    size: number,
    currentFilters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>,
  ) => {
    setLoading(true);
    try {
      const query: EmployeeQuery = {
        ...currentFilters,
        page,
        pageSize: size,
      };
      // Remove undefined keys from query to prevent empty params in URL
      Object.keys(query).forEach(key => query[key as keyof EmployeeQuery] === undefined && delete query[key as keyof EmployeeQuery]);

      const result = await employeeService.getEmployees(query);
      setEmployees(result.data);
      setTotalEmployees(result.total);
      setCurrentPage(result.page);
      setPageSize(result.pageSize);
    } catch (error) {
      message.error('获取员工列表失败');
      console.error('Failed to fetch employees:', error);
      setEmployees([]); // Clear data on error
      setTotalEmployees(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch employees only if lookups are loaded, or if lookups are not essential for the initial employee fetch
    if (!loadingLookups) { 
      fetchEmployees(currentPage, pageSize, filters);
    }
  }, [fetchEmployees, currentPage, pageSize, filters, loadingLookups]); // Added loadingLookups dependency

  const handleSearch = (newFilters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleTableChange = (newPage: number, newPageSize: number /*, newSorter?: any */) => {
    if (newPage !== currentPage) setCurrentPage(newPage);
    if (newPageSize !== pageSize) setPageSize(newPageSize);
  };

  const handleDelete = async (employeeId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该员工吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true); // Optional: set loading for delete operation
          await employeeService.deleteEmployee(employeeId);
          message.success('员工删除成功');
          // Refetch employees after deletion
          fetchEmployees(currentPage, pageSize, filters); // Or, remove from local state if API returns updated list or for optimistic update
        } catch (error) {
          message.error('删除员工失败');
          console.error('Failed to delete employee:', error);
        } finally {
            setLoading(false); // Optional: clear loading for delete operation
        }
      },
    });
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3}>员工档案列表</Title>
        </Col>
        <Col>
          {hasPermission('employee:create') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/hr/employees/new')}
            >
              新建员工
            </Button>
          )}
        </Col>
      </Row>
      <EmployeeFilterForm 
        onSearch={handleSearch} 
        loading={loading || loadingLookups} // Pass combined loading state
        // Pass lookup options to the filter form
        genderOptions={genderOptions}
        statusOptions={statusOptions}
        educationLevelOptions={educationLevelOptions} // Example, add if filter form uses it
        employmentTypeOptions={employmentTypeOptions} // Example, add if filter form uses it
        // Add other options as needed by EmployeeFilterForm
      />
      <EmployeeTable
        employees={employees}
        loading={loading || loadingLookups} // Pass combined loading state
        total={totalEmployees}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handleTableChange}
        onDelete={handleDelete}
        // Pass lookup maps to the table for rendering display values
        genderLookupMap={genderLookupMap}
        statusLookupMap={statusLookupMap}
        educationLevelLookupMap={educationLevelLookupMap}
        employmentTypeLookupMap={employmentTypeLookupMap}
        maritalStatusLookupMap={maritalStatusLookupMap}
        politicalStatusLookupMap={politicalStatusLookupMap}
        contractTypeLookupMap={contractTypeLookupMap}
      />
    </div>
  );
};

export default EmployeeListPage; 