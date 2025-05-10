import React, { useState, useEffect } from 'react';
import { Typography, Table, Space, Button, Alert, Modal, Select, Input, Form, Tag, Spin, App } from 'antd';
import { ExclamationCircleOutlined, SearchOutlined, ClearOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table'; // Import pagination type
import type { ColumnsType } from 'antd/es/table'; // Import ColumnsType
import apiClient from '../services/api';
import EmployeeForm from './EmployeeForm';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const { Title } = Typography;

// Interface for storing minimal info needed for delete confirmation
interface EmployeeToDelete {
  id: number;
  name: string;
}

// Update Employee interface to match backend response + key
interface Employee {
  key: React.Key; 
  id: number;
  name: string;
  id_card_number: string; // Added
  department_id?: number; // Keep if needed, though name is displayed
  department_name?: string; // Renamed/Confirmed from 'department'
  unit_name?: string; // Added
  employee_unique_id?: string; // Added
  created_at?: string; // Added (will be string from JSON)
  updated_at?: string; // Added (will be string from JSON)
  bank_account_number?: string; // Added
  bank_name?: string; // Added
  establishment_type_id?: number; // Added
  establishment_type_name?: string; // Added
  email?: string; // Added for email display
  // position: string; // Removed
}

// Define Department interface for dropdown
interface Department {
    id: number;
    name: string;
}

// Define EstablishmentType interface for dropdown
interface EstablishmentType {
    id: number;
    name: string;
}

// Update columns definition
const getColumns = (showEditModal: (employee: Employee) => void, handleDelete: (id: number, name: string) => void, t: Function): ColumnsType<Employee> => [
  {
    title: t('employeeManager.table.colId'), // Translate ID
    dataIndex: 'id',
    key: 'id',
    width: 80,
    fixed: 'left', 
    align: 'right', 
  },
  {
    title: t('employeeManager.table.colName'), // Translate Name
    dataIndex: 'name',
    key: 'name',
    width: 120,
    fixed: 'left',
  },
  {
    title: t('employeeManager.table.colEmployeeId'), // Translate Employee ID
    dataIndex: 'employee_unique_id',
    key: 'employee_unique_id',
    width: 120,
    render: (text?: string) => text || '-', 
  },
  {
    title: t('employeeManager.table.colDepartment'), // Translate Department
    dataIndex: 'department_name',
    key: 'department_name',
    width: 150,
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colUnit'), // Translate Unit
    dataIndex: 'unit_name',
    key: 'unit_name',
    width: 180,
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colEstablishment'), // Translate Establishment
    dataIndex: 'establishment_type_name',
    key: 'establishment_type_name',
    width: 180,
    render: (value: string | null | undefined) => {
        if (!value) return '-'; // Handle null, undefined, or empty string
        
        let color = 'default'; // Default color
        
        // Assign colors based on the exact type string
        switch (value) {
            case '公务员':
                color = 'blue';
                break;
            case '参公':
                color = 'green';
                break;
            case '事业':
                color = 'purple';
                break;
            case '专技':
                color = 'cyan';
                break;
            case '专项':
                color = 'gold';
                break;
            case '区聘':
                color = 'orange';
                break;
            case '原投服':
                color = 'magenta';
                break;
            // Add more cases if needed
            default:
                color = 'default'; // Explicitly default for any other type
                break;
        }

        return <Tag color={color}>{value}</Tag>;
    }
  },
  {
    title: t('employeeManager.table.colEmail'), // Translate Email
    dataIndex: 'email',
    key: 'email',
    width: 220,
    ellipsis: true,
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colIdCard'), // Translate ID Card No.
    dataIndex: 'id_card_number',
    key: 'id_card_number',
    width: 200,
  },
  {
    title: t('employeeManager.table.colGender'), // Translate Gender
    dataIndex: 'gender',
    key: 'gender',
    width: 80,
    align: 'center',
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colEthnicity'), // Translate Ethnicity
    dataIndex: 'ethnicity',
    key: 'ethnicity',
    width: 100,
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colDob'), // Translate Date of Birth
    dataIndex: 'date_of_birth',
    key: 'date_of_birth',
    width: 120,
    align: 'center',
    render: (text?: string) => text ? new Date(text).toLocaleDateString() : '-', // Basic date formatting
  },
  {
    title: t('employeeManager.table.colEducation'), // Translate Education Level
    dataIndex: 'education_level',
    key: 'education_level',
    width: 120,
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colWorkStartDate'), // Translate Work Start Date
    dataIndex: 'work_start_date',
    key: 'work_start_date',
    width: 120,
    align: 'center',
    render: (text?: string) => text ? new Date(text).toLocaleDateString() : '-',
  },
  {
    title: t('employeeManager.table.colServiceInterruption'), // Translate Service Interruption Years
    dataIndex: 'service_interruption_years',
    key: 'service_interruption_years',
    width: 100,
    align: 'right',
    render: (num?: number | string) => num != null ? Number(num).toFixed(2) : '-', // Format number
  },
  {
    title: t('employeeManager.table.colContinuousService'), // Translate Continuous Service Years
    dataIndex: 'continuous_service_years',
    key: 'continuous_service_years',
    width: 100,
    align: 'right',
    render: (num?: number | string) => num != null ? Number(num).toFixed(2) : '-', // Format number
  },
  {
    title: t('employeeManager.table.colActualPosition'), // Translate Actual Position
    dataIndex: 'actual_position',
    key: 'actual_position',
    width: 180,
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colActualPosStartDate'), // Translate Actual Position Start Date
    dataIndex: 'actual_position_start_date',
    key: 'actual_position_start_date',
    width: 120,
    align: 'center',
    render: (text?: string) => text ? new Date(text).toLocaleDateString() : '-',
  },
  {
    title: t('employeeManager.table.colPosLevelStartDate'), // Translate Position Level Start Date
    dataIndex: 'position_level_start_date',
    key: 'position_level_start_date',
    width: 120,
    align: 'center',
    render: (text?: string) => text ? new Date(text).toLocaleDateString() : '-',
  },
  {
    title: t('employeeManager.table.colEmploymentStatus'), // Translate Employment Status
    dataIndex: 'employment_status',
    key: 'employment_status',
    width: 100,
    align: 'center',
    render: (status?: string) => status ? <Tag color={status === '在职' ? 'success' : 'warning'}>{status}</Tag> : '-',
  },
  {
    title: t('employeeManager.table.colBankAcc'), // Translate Bank Account
    dataIndex: 'bank_account_number',
    key: 'bank_account_number',
    width: 200,
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colBankName'), // Translate Bank Name
    dataIndex: 'bank_name',
    key: 'bank_name',
    width: 250, 
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colRemarks'), // Translate Remarks
    dataIndex: 'remarks',
    key: 'remarks',
    width: 200,
    ellipsis: true,
    render: (text?: string) => text || '-',
  },
  {
    title: t('employeeManager.table.colCreatedAt'), // Translate Created At
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    align: 'center',
    render: (text?: string) => text ? new Date(text).toLocaleString() : '-',
  },
  {
    title: t('employeeManager.table.colUpdatedAt'), // Translate Updated At
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: 160,
    align: 'center',
    render: (text?: string) => text ? new Date(text).toLocaleString() : '-',
  },
  {
    title: t('employeeManager.table.colAction'),
    key: 'action',
    fixed: 'right', 
    width: 120,
    render: (_: any, record: Employee) => (
      <Space size="middle">
        {/* Use Buttons with icons */}
        <Button 
            type="link" 
            size="small" 
            onClick={() => showEditModal(record)} 
            icon={<EditOutlined />}
        >
            {t('employeeManager.actions.edit')} {/* Correct key */}
        </Button>
        <Button 
            type="link" 
            danger 
            size="small" 
            onClick={() => handleDelete(record.id, record.name)} 
            icon={<DeleteOutlined />}
        >
            {t('employeeManager.actions.delete')} {/* Correct key */}
        </Button>
      </Space>
    ),
  },
];

const EmployeeManager: React.FC = () => {
  const { t } = useTranslation();
  const { message: messageApi } = App.useApp();

  // State for employees, loading, and errors
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Add pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  // State for Edit Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  // State for Departments Dropdown
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
  // State for Establishment Types Dropdown
  const [establishmentTypes, setEstablishmentTypes] = useState<EstablishmentType[]>([]);
  const [loadingEstablishmentTypes, setLoadingEstablishmentTypes] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  // State for Create Modal
  const [isCreateModalVisible, setIsCreateModalVisible] = useState<boolean>(false);

  // State for Filters - Use undefined for cleared state
  const [nameFilter, setNameFilter] = useState<string>('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(undefined);
  const [establishmentTypeFilter, setEstablishmentTypeFilter] = useState<number | string>('');

  // Store applied filters separately to avoid triggering reload on every keystroke
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});

  // --- NEW State for Declarative Delete Modal ---
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState<boolean>(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeToDelete | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false); // Separate loading state for delete action

  // --- Define loadEmployees function outside useEffect --- START
  const loadEmployees = async (page: number, size: number, currentFilters: Record<string, any> = appliedFilters) => {
    setLoading(true);
    setError(null);
    try {
      // Build query params string
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
      });
      // Append filters if they have values
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });

      const apiUrl = `/api/employees?${params.toString()}`;
      console.log("Loading employees with URL:", apiUrl); // Log the final URL
      const response = await apiClient.get(apiUrl);
      if (response.data && Array.isArray(response.data.data)) {
        const employeesWithKeys = response.data.data.map((emp: any) => ({ ...emp, key: emp.id }));
        setEmployees(employeesWithKeys);
        setTotalItems(response.data.total);
      } else {
        console.error('API response data is not in the expected format:', response.data);
        setError(t('employeeManager.messages.invalidDataFormat')); // Use t()
        setEmployees([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error("Failed to fetch employees:", err);
      const errorDetails = err.response?.data?.detail || err.message || '';
      setError(t('employeeManager.messages.loadError') + (errorDetails ? `: ${errorDetails}` : '')); // Use t()
      setEmployees([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };
  // --- Define loadEmployees function outside useEffect --- END

  // Function to fetch departments
  const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
          const response = await apiClient.get('/api/departments-list'); 
          if (Array.isArray(response.data)) {
              setDepartments(response.data);
              console.log('Departments loaded:', response.data);
          } else {
              console.error("Unexpected format for departments list:", response.data);
              setDepartments([]); // Set empty on format error
          }
      } catch (err) {
          console.error("Failed to fetch departments:", err);
          // Optionally set an error state for departments if needed
          setDepartments([]); // Set empty on fetch error
      } finally {
          setLoadingDepartments(false);
      }
  };

  // Function to fetch establishment types
  const loadEstablishmentTypes = async () => {
      setLoadingEstablishmentTypes(true);
      try {
          // Use the new endpoint that returns id and name
          const response = await apiClient.get('/api/establishment-types-list'); 
          if (Array.isArray(response.data)) {
              setEstablishmentTypes(response.data);
              console.log('Establishment Types loaded:', response.data);
          } else {
              console.error("Unexpected format for establishment types list:", response.data);
              setEstablishmentTypes([]); 
          }
      } catch (err) {
          console.error("Failed to fetch establishment types:", err);
          setEstablishmentTypes([]); 
      } finally {
          setLoadingEstablishmentTypes(false);
      }
  };

  // useEffect to fetch data on mount and when pagination changes
  useEffect(() => {
    // Call loadEmployees defined outside, using appliedFilters
    loadEmployees(currentPage, pageSize, appliedFilters);
    loadDepartments();
    loadEstablishmentTypes();
  }, [currentPage, pageSize, appliedFilters]); // Add appliedFilters as dependency

  // Handler for table pagination changes
  const handleTableChange = (pagination: TablePaginationConfig) => {
    console.log(`handleTableChange called. Pagination: current=${pagination.current}, pageSize=${pagination.pageSize}`);
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  // --- Edit Modal Functions ---
  const showEditModal = (employee: Employee) => {
    console.log("Editing employee:", employee);
    setEditingEmployee(employee);
    setIsEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingEmployee(null);
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingEmployee) return;
    setSubmitLoading(true);
    console.log("Submitting edit values:", values, "for ID:", editingEmployee.id);
    try {
        // Ensure IDs are numbers if they exist and not empty strings
        const editPayload = { ...values }; 
        if (editPayload.department_id) editPayload.department_id = Number(editPayload.department_id);
        if (editPayload.establishment_type_id) editPayload.establishment_type_id = Number(editPayload.establishment_type_id);
        else editPayload.establishment_type_id = null;

        // Remove empty strings for optional fields if backend expects null or omission
        if (editPayload.employee_unique_id === '') editPayload.employee_unique_id = null;
        if (editPayload.bank_account_number === '') editPayload.bank_account_number = null;
        if (editPayload.bank_name === '') editPayload.bank_name = null;

        await apiClient.put(`/api/employees/${editingEmployee.id}`, editPayload);
        // Use messageApi from useApp hook
        messageApi.success(t('employeeManager.messages.updateSuccess'));
        handleEditCancel(); // Close modal
        loadEmployees(currentPage, pageSize, appliedFilters); // Reload current page data
    } catch (error: any) {
        console.error("Failed to update employee:", error);
        const errorDetails = error.response?.data?.detail || error.message || 'Unknown Error';
        // Use messageApi from useApp hook
        messageApi.error(t('employeeManager.messages.updateFailed', { errorDetails }));
    } finally {
        setSubmitLoading(false);
    }
  };
  // --- End Edit Modal Functions ---

  // --- REVISED Delete Functions --- START
  
  // 1. handleDelete: Now just opens the confirmation modal
  const handleDelete = (employeeId: number, employeeName: string) => {
    console.log('handleDelete called for ID:', employeeId, 'Name:', employeeName);
    setEmployeeToDelete({ id: employeeId, name: employeeName }); // Store info of employee to delete
    setIsDeleteConfirmVisible(true); // Show the modal
  };

  // 2. handleDeleteCancel: Closes the modal and clears state
  const handleDeleteCancel = () => {
    console.log('Delete confirmation cancelled.');
    setIsDeleteConfirmVisible(false);
    setEmployeeToDelete(null);
  };

  // 3. executeDelete: Contains the actual deletion logic (called by Modal's onOk)
  const executeDelete = async () => {
    if (!employeeToDelete) return; // Should not happen if modal is open

    const { id: employeeId, name: employeeName } = employeeToDelete;
    console.log(`executeDelete called for ID: ${employeeId}, Name: ${employeeName}`);
    setDeleteLoading(true); // Start delete loading indicator

    try {
      console.log(`Attempting to delete employee via API: ${employeeId}`);
      await apiClient.delete(`/api/employees/${employeeId}`);
      console.log(`Delete API call successful for employee: ${employeeId}`);
      // Use messageApi from useApp hook
      messageApi.success(t('employeeManager.messages.deleteSuccess', { name: employeeName }));
      
      setIsDeleteConfirmVisible(false); // Close modal on success BEFORE reloading
      setEmployeeToDelete(null);

      // Reload employees list after successful deletion
      console.log('Reloading employees list after deletion...');
      await loadEmployees(currentPage, pageSize, appliedFilters); 
      console.log('Finished reloading employees list.');

    } catch (err: any) {
      console.error("Failed to delete employee:", employeeId, err); 
      console.error("Error details:", err); 
      console.error("Error response data:", err.response?.data); 
      const errorDetails = err.response?.data?.detail || err.message || 'Unknown error';
      // Use messageApi from useApp hook
      messageApi.error(t('employeeManager.messages.deleteFailed', { name: employeeName }) + `: ${errorDetails}`); 
      // Keep the modal open on error? Or close it? Closing is usually less confusing.
      setIsDeleteConfirmVisible(false); 
      setEmployeeToDelete(null);
    } finally {
      setDeleteLoading(false); // Stop delete loading indicator regardless of outcome
    }
  };
  // --- REVISED Delete Functions --- END

  // --- Create Function --- START
  const handleCreateSubmit = async (values: any) => {
    setSubmitLoading(true);
    console.log("Submitting create values:", values);
    try {
        const createPayload = { ...values };
        // Ensure IDs are numbers if they exist and not empty strings
        if (createPayload.department_id) {
            createPayload.department_id = Number(createPayload.department_id);
        }
        if (createPayload.establishment_type_id) { 
            createPayload.establishment_type_id = Number(createPayload.establishment_type_id);
        } else {
             // If establishment type is optional and not provided, remove it or set to null
             // Depending on backend API expectations (assuming null is acceptable)
             createPayload.establishment_type_id = null;
        }
        // Remove empty strings for optional fields if backend expects null or omission
        if (createPayload.employee_unique_id === '') createPayload.employee_unique_id = null;
        if (createPayload.bank_account_number === '') createPayload.bank_account_number = null;
        if (createPayload.bank_name === '') createPayload.bank_name = null;

        await apiClient.post(`/api/employees`, createPayload);
        // Use messageApi from useApp hook
        messageApi.success(t('employeeManager.messages.createSuccess'));
        setIsCreateModalVisible(false); // Close modal on success
        loadEmployees(1, pageSize, appliedFilters); // Reload data and go to first page
        handleReset(); // Also clear filter inputs
    } catch (error: any) {
        console.error("Failed to create employee:", error);
        const errorDetails = error.response?.data?.detail || error.message || 'Unknown Error';
        let errorMsgKey = 'employeeManager.messages.createFailed';
        if (error.response?.status === 409) { // Handle conflict (e.g., duplicate) specifically
             errorMsgKey = 'employeeManager.messages.createFailedDuplicate';
        }
        // Use messageApi from useApp hook
        messageApi.error(t(errorMsgKey, { errorDetails }));
    } finally {
        setSubmitLoading(false);
    }
  };
  // --- Create Function --- END

  // --- Filter Handlers --- START
  const handleSearch = () => {
    const newFilters = {
      name: nameFilter.trim() || undefined,
      employee_unique_id: employeeIdFilter.trim() || undefined,
      department_id: departmentFilter,
      establishment_type_id: establishmentTypeFilter,
    };
    applyFilters(newFilters);
  };

  const handleReset = () => {
    setNameFilter('');
    setEmployeeIdFilter('');
    setDepartmentFilter(undefined);
    setEstablishmentTypeFilter('');
    const newFilters = {};
    setAppliedFilters(newFilters);
    // Trigger fetch with empty filters and reset to page 1
    loadEmployees(1, pageSize, newFilters); 
    setCurrentPage(1); 
  };

  // --- Helper to update applied filters and reset page --- START
  const applyFilters = (newFilters: Record<string, any>) => {
      const activeFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
              acc[key] = value;
          }
          return acc;
      }, {} as Record<string, any>);
      setAppliedFilters(activeFilters);
      setCurrentPage(1); // Reset to first page when applying new filters
  };
  // --- Helper to update applied filters and reset page --- END
  // --- Filter Handlers --- END

  // Get columns definition, passing handlers
  const tableColumns = getColumns(showEditModal, handleDelete, t);

  return (
    <div>
        {/* Add CSS rules for zebra striping */}
        <style>
            {`
                .zebra-striped-table .ant-table-tbody > tr:nth-child(even) > td {
                    background-color: #fafafa; /* Very light grey for even rows */
                }
            `}
        </style>

        <Title level={2}>{t('employeeManager.title')}</Title>

        {/* Display error message if fetch failed */}      
        {error && !isEditModalVisible && !isCreateModalVisible && <Alert message={t('common.error')} description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}

        {/* Add Create Button with Icon */}
        <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)} 
            style={{ marginBottom: 16 }}
        >
            {t('employeeManager.addButton')} {/* Correct key */}
        </Button>

        {/* Filter Section - Use Form layout="inline" */}
        <Form 
            layout="inline" // Set layout to inline
            style={{ marginBottom: 16 }}
        >
            <Form.Item label={t('employeeManager.filters.nameLabel')} htmlFor="employee_manager_name_filter"> 
                <Input 
                    id="employee_manager_name_filter" 
                    placeholder={t('employeeManager.filters.namePlaceholder')}
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    onPressEnter={handleSearch}
                    allowClear
                />
            </Form.Item>
            <Form.Item label={t('employeeManager.filters.employeeIdLabel')} htmlFor="employee_manager_id_filter"> 
                <Input 
                    id="employee_manager_id_filter" 
                    placeholder={t('employeeManager.filters.employeeIdPlaceholder')}
                    value={employeeIdFilter}
                    onChange={e => setEmployeeIdFilter(e.target.value)}
                    onPressEnter={handleSearch}
                    allowClear
                />
            </Form.Item>
            <Form.Item label={t('employeeManager.filters.departmentLabel')} htmlFor="employee_manager_department_filter"> 
                <Select<number | undefined>
                    id="employee_manager_department_filter" 
                    value={departmentFilter}
                    onChange={(value) => {
                        setDepartmentFilter(value);
                        applyFilters({ ...appliedFilters, department_id: value }); 
                    }}
                    style={{ width: 180 }}
                    loading={loadingDepartments}
                    allowClear
                    placeholder={t('employeeManager.filters.departmentPlaceholder')}
                    showSearch 
                    filterOption={(input, option) => 
                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                >
                    <Select.Option value={undefined}>{t('employeeManager.filters.allOption')}</Select.Option>
                    {departments.filter(dept => dept.id != null).map(dept => (
                        <Select.Option key={dept.id} value={dept.id} label={dept.name}>
                            {dept.name}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item label={t('employeeManager.filters.establishmentLabel')} htmlFor="employee_manager_establishment_filter"> 
                <Select<number | string>
                    id="employee_manager_establishment_filter" 
                    value={establishmentTypeFilter}
                    onChange={(value) => {
                        setEstablishmentTypeFilter(value);
                        const filterApiValue = value === '' ? undefined : value;
                        applyFilters({ ...appliedFilters, establishment_type_id: filterApiValue });
                    }}
                    loading={loadingEstablishmentTypes}
                    allowClear
                    placeholder={t('employeeManager.filters.establishmentPlaceholder')}
                >
                    <Select.Option value="">{t('employeeManager.filters.allOption')}</Select.Option>
                    {establishmentTypes
                        .filter(et => typeof et.id === 'number' && et.id !== null && et.id !== undefined)
                        .map(et => (
                        <Select.Option key={et.id} value={et.id}>
                            {et.name}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
            {/* Buttons */}
            <Form.Item > 
                <Space>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        {t('employeeManager.buttons.search')} 
                    </Button>
                    <Button icon={<ClearOutlined />} onClick={handleReset}>
                        {t('employeeManager.buttons.reset')}
                    </Button>
                </Space>
            </Form.Item>
        </Form>

        {/* Wrap Table with Spin */}
        <Spin spinning={loading}>
            <Table
                columns={tableColumns} // Use the generated columns
                rowKey="id" // Use employee id as key
                dataSource={employees}
                // loading={loading} // Spin component handles loading state visually
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalItems,
                    showSizeChanger: true,
                    showTotal: (total, range) => 
                        t('common.pagination.showTotal', { rangeStart: range[0], rangeEnd: range[1], total })
                }}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }} // Keep horizontal scroll
                bordered
                size="small"
                className="zebra-striped-table" // Add class for striping
                sticky // Add sticky header
            />
        </Spin>

        {/* Edit Employee Modal */}
        <Modal
            title={t('employeeManager.editModal.title')}
            open={isEditModalVisible}
            onCancel={handleEditCancel}
            footer={null} // Footer is handled by EmployeeForm
            destroyOnClose // Reset form state when modal closes
            width={720} // Adjust width as needed
        >
            {editingEmployee && (
                <EmployeeForm 
                    initialValues={editingEmployee} 
                    departments={departments}
                    establishmentTypes={establishmentTypes}
                    loadingDepartments={loadingDepartments}
                    loadingEstablishmentTypes={loadingEstablishmentTypes}
                    onSubmit={handleEditSubmit}
                    onCancel={handleEditCancel}
                    submitLoading={submitLoading}
                />
            )}
        </Modal>

        {/* Add Create Employee Modal */} 
        <Modal
            title={t('employeeManager.createModal.title')}
            open={isCreateModalVisible}
            onCancel={() => setIsCreateModalVisible(false)}
            footer={null} 
            destroyOnClose // Reset form state when modal closes
            width={720}
        >
            <EmployeeForm 
                // No initialValues for create mode
                departments={departments}
                establishmentTypes={establishmentTypes}
                loadingDepartments={loadingDepartments}
                loadingEstablishmentTypes={loadingEstablishmentTypes}
                onSubmit={handleCreateSubmit} // Use the create handler
                onCancel={() => setIsCreateModalVisible(false)}
                submitLoading={submitLoading}
            />
        </Modal>

        {/* --- NEW Declarative Delete Confirmation Modal --- */}
        <Modal
            title={<Space><ExclamationCircleOutlined style={{ color: '#faad14' }} />{t('employeeManager.modals.deleteConfirmTitle', { name: employeeToDelete?.name || '' })}</Space>}
            open={isDeleteConfirmVisible}
            onOk={executeDelete} // Calls the function with API logic
            onCancel={handleDeleteCancel} // Closes the modal
            okText={t('employeeManager.actions.confirm')} // Use translated key
            cancelText={t('employeeManager.actions.cancel')} // Use translated key
            confirmLoading={deleteLoading} // Bind loading state to OK button
            okType="danger" // Make OK button red
            // centered // Optional: centers the modal vertically
            // maskClosable={false} // Optional: prevent closing by clicking outside
            destroyOnClose // Ensures state is fresh if reopened quickly
        >
            <p>{t('employeeManager.modals.deleteConfirmContent')}</p>
        </Modal>

    </div>
  );
};

export default EmployeeManager; 