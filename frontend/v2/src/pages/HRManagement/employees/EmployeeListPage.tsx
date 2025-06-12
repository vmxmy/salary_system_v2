import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Space, Tooltip, Input, Card, Row, Col, Select } from 'antd';
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import OrganizationManagementTableTemplate from '../../../components/common/OrganizationManagementTableTemplate';
// import type { Employee, EmployeeQuery } from '../types'; // Old types
import type { SorterResult } from 'antd/es/table/interface';
import type { TablePaginationConfig, FilterValue, TableCurrentDataSource } from 'antd/es/table/interface';
import type { ProColumns } from '@ant-design/pro-components';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import { employeeService } from '../../../services/employeeService';
import { stringSorter, numberSorter, dateSorter, useTableSearch, useTableExport } from '../../../components/common/TableUtils';
import type { Dayjs } from 'dayjs';
// import EmployeeName from '../../../components/common/EmployeeName'; // May not be needed if full_name is direct
import Highlighter from 'react-highlight-words';
import TableActionButton from '../../../components/common/TableActionButton';
import { useEmployeePermissions } from '../../../hooks/useEmployeePermissions';
import styles from './EmployeeListPage.module.less';

// Import new types for view-based employee fetching
import type { 
  EmployeeBasic, 
  EmployeeBasicQuery, 
  // EmployeeBasicPageResult, // Included in service return type, not directly here
} from '../../../types/viewApiTypes';

// Define types for sorter and filters state
interface SorterState {
  field?: string;
  order?: 'ascend' | 'descend';
}

interface FiltersState {
  full_name_contains?: string;
  employee_code_contains?: string;
  department_name_contains?: string;
  position_name_contains?: string;
  employee_status_equals?: string;
  // Add other filter fields as needed
}

const initialPagination = {
  current: 1,
  pageSize: 10, // Default page size
  total: 0,
};

const initialSorter: SorterState = {};
const initialFilters: FiltersState = {};

// Function to generate table column configurations
const generateEmployeeTableColumnsConfig = (
  t: (key: string) => string,
  // getColumnSearch: (dataIndex: keyof EmployeeBasic) => any, // Will be replaced by page-level filters
  lookupMaps: any, 
  employeePermissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (employee: EmployeeBasic) => void, 
  onDelete: (employeeId: string) => void,
  onViewDetails: (employeeId: string) => void
): ProColumns<EmployeeBasic>[] => {
  const columns: ProColumns<EmployeeBasic>[] = [
    {
      title: t('employee:list_page.table.column.full_name'),
      key: 'full_name', 
      dataIndex: 'full_name', 
      sorter: true,
      render: (_text: any, record: EmployeeBasic) => {
        if (!record.full_name || !record.full_name.trim()) {
          return <span style={{ color: '#999', fontStyle: 'italic' }}>{t('employee:list_page.name_not_set')}</span>;
        }
        return record.full_name; 
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
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
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) => {
        return record.full_name?.toLowerCase().includes((value as string).toLowerCase()) || false;
      },
    },
    {
      title: t('employee:list_page.table.column.employee_code'),
      dataIndex: 'employee_code',
      key: 'employee_code', // Changed key to match dataIndex
      sorter: true, // Enable server-side sorting
      // Client-side filter to be replaced
    },
    {
      title: t('employee:list_page.table.column.email'),
      dataIndex: 'email',
      key: 'email',
      sorter: true, 
    },
    {
      title: t('employee:list_page.table.column.phone_number'),
      dataIndex: 'phone_number',
      key: 'phone_number',
      sorter: true, 
    },
    {
      title: t('employee:list_page.table.column.department'),
      dataIndex: 'department_name', 
      key: 'department_name',
      sorter: true,
      filters: lookupMaps?.departmentMap ? Array.from(lookupMaps.departmentMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[1],
      })) : [],
      onFilter: (value, record) => record.department_name === value,
      filterMultiple: false,
    },
    {
      title: t('employee:list_page.table.column.personnel_category'),
      dataIndex: 'personnel_category_name',
      key: 'personnel_category_name', 
      sorter: true,
    },
    {
      title: t('employee:list_page.table.column.actual_position'), 
      dataIndex: 'position_name',
      key: 'position_name',
      sorter: true,
    },
    {
      title: t('employee:list_page.table.column.status'),
      dataIndex: 'employee_status',
      key: 'employee_status',
      sorter: true,
    },
    {
      title: t('employee:list_page.table.column.hire_date'),
      dataIndex: 'hire_date',
      key: 'hire_date',
      render: (dom, entity) => {
        const date = entity.hire_date;
        if (!date) return '';
        return typeof date === 'string' ? new Date(date).toLocaleDateString() : (date as any).toLocaleDateString();
      },
      sorter: true, 
    },
    // Commented out columns (from previous step) remain commented out
    {
      title: t('employee:list_page.table.column.action'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (dom, entity) => (
        <Space size="small">
          {employeePermissions.canViewDetail && (
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(String(entity.id))} 
              tooltipTitle={t('common:action.view')} 
            />
          )}
          {employeePermissions.canUpdate && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(entity)} 
              tooltipTitle={t('common:action.edit')} 
            />
          )}
          {employeePermissions.canDelete && (
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(String(entity.id))} 
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
  const { t } = useTranslation(['employee', 'common']);
  const navigate = useNavigate();
  const {
    canViewList, // Assuming this permission is still relevant
    canViewDetail,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
  } = useEmployeePermissions();

  const [allEmployees, setAllEmployees] = useState<EmployeeBasic[]>([]); 
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  const [pagination, setPagination] = useState(initialPagination);
  const [sorter, setSorter] = useState<SorterState>(initialSorter);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);

  const { lookupMaps, loadingLookups, errorLookups } = useLookupMaps(); 
  // const { getColumnSearch, searchText, searchedColumn } = useTableSearch<EmployeeBasic>(); // Replaced by page-level filters

  const fetchBasicEmployees = useCallback(async () => {
    setLoadingData(true);
    const query: EmployeeBasicQuery = {
      page: pagination.current,
      size: pagination.pageSize,
      sortBy: sorter.field,
      sortOrder: sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined,
      // Only include filter if it has a value
      ...(filters.full_name_contains && { full_name_contains: filters.full_name_contains }),
      ...(filters.employee_code_contains && { employee_code_contains: filters.employee_code_contains }),
      ...(filters.department_name_contains && { department_name_contains: filters.department_name_contains }),
      ...(filters.position_name_contains && { position_name_contains: filters.position_name_contains }),
      ...(filters.employee_status_equals && { employee_status_equals: filters.employee_status_equals }),
    };
    
    try {
      const response = await employeeService.getEmployeesFromView(query); 
      if (response && Array.isArray(response)) {
        console.log('🔍 [Debug] API返回的员工数据:', response.map(emp => emp.full_name));
        console.log('🔍 [Debug] 当前筛选条件:', filters);
        setAllEmployees(response);
        const estimatedTotal = response.length < pagination.pageSize 
          ? (pagination.current - 1) * pagination.pageSize + response.length
          : pagination.current * pagination.pageSize + 1;
        setPagination(prev => ({ ...prev, total: estimatedTotal }));
      } else {
        setAllEmployees([]);
        setPagination(prev => ({ ...prev, total: 0 }));
        message.error(t('employee:list_page.message.get_employees_failed_empty_response'));
      }
    } catch (error) {
      message.error(t('employee:list_page.message.get_employees_failed'));
      setAllEmployees([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoadingData(false);
    }
  }, [pagination.current, pagination.pageSize, sorter, filters, t]);

  // 统一的数据获取effect，监听所有可能触发数据变化的依赖
  useEffect(() => {
    if (!loadingLookups) {
      fetchBasicEmployees();
    }
  }, [fetchBasicEmployees, loadingLookups]);

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
          fetchBasicEmployees(); 
        } catch (error) {
          message.error(t('employee:list_page.message.delete_employee_failed'));
        } finally {
            setLoadingData(false);
        }
      },
    });
  }, [t, fetchBasicEmployees]); 

  const tableColumnsConfigForControls = React.useMemo(() => 
    generateEmployeeTableColumnsConfig(
      t, 
      // getColumnSearch, // No longer passing this
      lookupMaps, 
      {
        canViewDetail: canViewDetail,
        canUpdate: canUpdate,
        canDelete: canDelete
      },
      (employee: EmployeeBasic) => navigate(`/hr/employees/${employee.id}/edit`, { state: { employeeData: employee } }), 
      handleDelete,
      (employeeId: string) => navigate(`/hr/employees/${employeeId}`)
    ),
    [t, /* getColumnSearch, */ lookupMaps, canViewDetail, canUpdate, canDelete, navigate, handleDelete]
  );

  const handleTableChange = (
    antPagination: TablePaginationConfig,
    antFilters: Record<string, FilterValue | null>,
    antSorter: SorterResult<EmployeeBasic> | SorterResult<EmployeeBasic>[],
    extra: TableCurrentDataSource<EmployeeBasic>
  ) => {
    const singleSorter = Array.isArray(antSorter) ? antSorter[0] : antSorter;
    setPagination(prev => ({
      ...prev,
      current: antPagination.current ?? 1,
      pageSize: antPagination.pageSize ?? 10,
    }));
    setSorter({
      field: singleSorter.field as string,
      order: singleSorter.order === null ? undefined : singleSorter.order,
    });
    // antFilters can be used here if server-side column-based filtering needs to be tied to table's own filter UI
    // console.log('Applied Ant Filters (if any):', antFilters);
    // console.log('Table action:', extra.action);
  };

  const handleFilterChange = useCallback((filterName: keyof FiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page on filter change
  }, []);
  
  const handleRefresh = () => {
    // Optionally reset filters or sorters here if desired, or just refetch
    // setFilters(initialFilters);
    // setSorter(initialSorter);
    setPagination(prev => ({ ...prev, current: 1})); // Reset to page 1 on manual refresh
    fetchBasicEmployees(); // Directly call fetch, or rely on useEffect if pagination state change triggers it
  };

  const generateExportFilename = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
    return `${t('employee:list_page.page_title')}_${dateStr}_${timeStr}`;
  };

  const exportColumns = React.useMemo(() => {
    return tableColumnsConfigForControls
      .filter(col => col.key !== 'action') 
      .map(col => ({
        title: col.title as string,
        dataIndex: col.dataIndex as string | string[],
        key: col.key as string,
        // Render function might need to be adapted if it relies on specific types not in EmployeeBasic
        // For basic export, often direct data is enough. Complex renders might not translate well to Excel.
      }));
  }, [tableColumnsConfigForControls]);

  const { ExportButton } = useTableExport(allEmployees, exportColumns as any, {
    filename: generateExportFilename(),
    sheetName: t('employee:list_page.page_title'),
    buttonText: t('common:action.export_excel'), // Using common translation
    successMessage: t('common:message.export_success'),
  });

  const batchDeleteConfig = canDelete ? {
    enabled: true,
    buttonText: t('common:action.batch_delete_count', { count: selectedRowKeys.length }),
    confirmTitle: t('common:confirm.batch_delete.title'),
    confirmContent: t('common:confirm.batch_delete.content', { count: selectedRowKeys.length }),
    confirmOkText: t('common:action.confirm_delete'),
    confirmCancelText: t('common:action.cancel'),
    onBatchDelete: async (keys: React.Key[]) => {
      setLoadingData(true);
      try {
        const deletePromises = keys.map(id => employeeService.deleteEmployee(String(id)));
        await Promise.all(deletePromises);
        message.success(t('common:message.batch_delete_success', { count: keys.length }));
        setSelectedRowKeys([]); 
        fetchBasicEmployees(); 
      } catch (error) {
        message.error(t('common:message.batch_delete_failed'));
      } finally {
        setLoadingData(false);
      }
    },
    noSelectionMessage: t('common:message.select_items_to_delete'),
    successMessage: t('common:message.batch_delete_success_generic'),
    errorMessage: t('common:message.batch_delete_failed_generic'),
  } : undefined;
 
  const combinedLoading = loadingData || loadingLookups;

  return (
    <div>
      {/* 显示当前筛选状态 */}
      {(filters.full_name_contains || filters.employee_code_contains) && (
        <Card 
          size="small"
          style={{ marginBottom: 8, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
        >
          <Space>
            <span style={{ color: '#52c41a', fontWeight: 500 }}>🔍 当前筛选条件:</span>
            {filters.full_name_contains && (
              <span>姓名包含: <strong style={{ color: '#1890ff' }}>"{filters.full_name_contains}"</strong></span>
            )}
            {filters.employee_code_contains && (
              <span>员工编号包含: <strong style={{ color: '#1890ff' }}>"{filters.employee_code_contains}"</strong></span>
            )}
            <span style={{ color: '#666' }}>({allEmployees.length} 条结果)</span>
          </Space>
        </Card>
      )}
      


      <OrganizationManagementTableTemplate<EmployeeBasic> 
        addButtonText={t('employee:list_page.create_employee')}
        onAddClick={() => navigate('/hr/employees/new')}
        showAddButton={canCreate}
        extraButtons={canExport ? [<ExportButton key="export" />] : []}
        batchDelete={batchDeleteConfig}
        columns={tableColumnsConfigForControls}
        dataSource={allEmployees} 
        loading={combinedLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100', '200'], 
          showTotal: (total: number, range: [number, number]) => 
            `${t('common:pagination.total_range', { start: range[0], end: range[1], total }) }`,
        }}
        rowKey="id"
        bordered
        scroll={{ x: 'max-content' }}
        rowSelection={canDelete ? {
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        } : undefined}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default EmployeeListPage; 