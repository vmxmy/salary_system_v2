import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Space, Tooltip, Input, Select, Row, Col } from 'antd';
import { 
  PlusOutlined, 
  DownloadOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// 新的现代化组件
import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';
import OrganizationManagementTableTemplate from '../../../components/common/OrganizationManagementTableTemplate';

import type { SorterResult } from 'antd/es/table/interface';
import type { TablePaginationConfig, FilterValue, TableCurrentDataSource } from 'antd/es/table/interface';
import type { ProColumns } from '@ant-design/pro-components';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import { employeeService } from '../../../services/employeeService';
import { stringSorter, numberSorter, dateSorter, useTableSearch, useTableExport } from '../../../components/common/TableUtils';
import type { Dayjs } from 'dayjs';
import Highlighter from 'react-highlight-words';
import TableActionButton from '../../../components/common/TableActionButton';
import { useEmployeePermissions } from '../../../hooks/useEmployeePermissions';

// Import types for view-based employee fetching
import type { 
  EmployeeBasic, 
  EmployeeBasicQuery, 
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
}

const initialPagination = {
  current: 1,
  pageSize: 10,
  total: 0,
};

const initialSorter: SorterState = {};

const initialFilters: FiltersState = {};

/**
 * 现代化员工列表页面
 * 使用统一的现代化设计系统和布局模板
 */
const EmployeeListPageModern: React.FC = () => {
  const { t } = useTranslation(['employee', 'common']);
  const navigate = useNavigate();

  // State management
  const [employees, setEmployees] = useState<EmployeeBasic[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>(initialPagination);
  const [sorter, setSorter] = useState<SorterState>(initialSorter);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Hooks
  const { lookupMaps, loading: lookupLoading } = useLookupMaps();
  const { permissions } = useEmployeePermissions();
  const { searchProps } = useTableSearch(['full_name', 'employee_code', 'department_name', 'position_name']);

  // 获取员工数据
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      
      const query: EmployeeBasicQuery = {
        page: pagination.current || 1,
        size: pagination.pageSize || 10,
        sortBy: sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined,
        ...filters,
      };

      // 使用专门的视图接口获取基本员工信息
      const employees = await employeeService.getEmployeesFromView(query);
      
      setEmployees(employees || []);
      // 注意：getEmployeesFromView 返回的是数组，可能需要单独获取分页信息
      // 这里暂时设置一个大的总数，实际应该从API获取准确的分页信息
      setPagination(prev => ({
        ...prev,
        total: employees?.length || 0,
        current: pagination.current || 1,
        pageSize: pagination.pageSize || 10,
      }));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      message.error(t('common:fetchError'));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sorter, filters, t]);

  // 初始化数据
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 表格变化处理
  const handleTableChange = useCallback((
    newPagination: TablePaginationConfig,
    newFilters: Record<string, FilterValue | null>,
    newSorter: SorterResult<EmployeeBasic> | SorterResult<EmployeeBasic>[]
  ) => {
    const sorterArray = Array.isArray(newSorter) ? newSorter : [newSorter];
    const primarySorter = sorterArray[0];
    
    setPagination(newPagination);
    setSorter({
      field: primarySorter?.field as string,
      order: primarySorter?.order === null ? undefined : primarySorter?.order,
    });
  }, []);

  // 搜索处理
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setFilters(prev => ({
      ...prev,
      full_name_contains: value || undefined,
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);


  // 员工操作
  const handleView = useCallback((record: EmployeeBasic) => {
    navigate(`/hr/employees/${record.id}`);
  }, [navigate]);

  const handleEdit = useCallback((record: EmployeeBasic) => {
    navigate(`/hr/employees/${record.id}/edit`);
  }, [navigate]);

  const handleDelete = useCallback(async (record: EmployeeBasic) => {
    Modal.confirm({
      title: t('employee:deleteConfirmTitle'),
      content: t('employee:deleteConfirmContent', { name: record.full_name }),
      okText: t('common:confirm'),
      cancelText: t('common:cancel'),
      okType: 'danger',
      onOk: async () => {
        try {
          await employeeService.deleteEmployee(record.id.toString());
          message.success(t('employee:deleteSuccess'));
          fetchEmployees();
        } catch (error) {
          console.error('Delete failed:', error);
          message.error(t('employee:deleteError'));
        }
      },
    });
  }, [t, fetchEmployees]);

  // 表格列定义
  const columns: ProColumns<EmployeeBasic>[] = [
    {
      title: t('employee:employeeCode'),
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 120,
      sorter: true,
      ...searchProps,
      render: (text: string | React.ReactNode) => (
        <span className="typography-caption-strong">
          {text}
        </span>
      ),
    },
    {
      title: t('employee:fullName'),
      dataIndex: 'full_name',
      key: 'full_name',
      width: 150,
      sorter: true,
      ...searchProps,
      render: (text: string | React.ReactNode, record: EmployeeBasic) => (
        <Space>
          <UserOutlined className="text-accent" />
          <Highlighter
            highlightClassName="bg-yellow-200"
            searchWords={[searchText]}
            textToHighlight={String(text || '')}
            className="typography-body font-medium"
          />
        </Space>
      ),
    },
    {
      title: t('employee:department'),
      dataIndex: 'department_name',
      key: 'department_name',
      width: 150,
      sorter: true,
      ...searchProps,
      render: (text: string | React.ReactNode) => (
        <Space>
          <TeamOutlined className="text-accent" />
          <span className="typography-body">{text}</span>
        </Space>
      ),
    },
    {
      title: t('employee:position'),
      dataIndex: 'position_name',
      key: 'position_name',
      width: 150,
      sorter: true,
      ...searchProps,
      render: (text: string | React.ReactNode) => (
        <span className="typography-body">{text}</span>
      ),
    },
    {
      title: t('employee:status'),
      dataIndex: 'employee_status',
      key: 'employee_status',
      width: 100,
      sorter: true,
      render: (status: string | React.ReactNode) => {
        const statusConfig = {
          '在职': { color: 'success', text: t('employee:statusActive') },
          '离职': { color: 'error', text: t('employee:statusInactive') },
          '试用': { color: 'warning', text: t('employee:statusProbation') },
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || 
                      { color: 'default', text: status };
        
        return (
          <span className={`ant-tag ant-tag-${config.color} typography-caption-strong`}>
            {config.text}
          </span>
        );
      },
    },
    {
      title: t('common:column.actions'),
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record: EmployeeBasic) => (
        <Space size="small">
          <TableActionButton
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title={t('common:view')}
            type="primary"
            size="small"
            className="modern-button variant-ghost size-sm"
          />
          {permissions.canUpdate && (
            <TableActionButton
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title={t('common:edit')}
              size="small"
              className="modern-button variant-secondary size-sm"
            />
          )}
          {permissions.canDelete && (
            <TableActionButton
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              title={t('common:delete')}
              danger
              size="small"
              className="modern-button variant-danger size-sm"
            />
          )}
        </Space>
      ),
    },
  ];

  // Table export hook
  const { exportToExcel } = useTableExport(employees, columns as any);

  // 导出数据
  const handleExport = useCallback(async () => {
    try {
      await exportToExcel();
      message.success(t('common:exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      message.error(t('common:exportError'));
    }
  }, [exportToExcel, t]);

  // 页面头部额外内容
  const headerExtra = (
    <Space>
      <Button
        icon={<ReloadOutlined />}
        onClick={handleRefresh}
        loading={loading}
        className="modern-button variant-ghost"
      >
        {t('common:refresh')}
      </Button>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExport}
        className="modern-button variant-secondary"
      >
        {t('common:export.export')}
      </Button>
      {permissions.canCreate && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/hr/employees/create')}
          className="modern-button variant-primary"
        >
          {t('employee:addEmployee')}
        </Button>
      )}
    </Space>
  );

  // 面包屑导航
  const breadcrumbItems = [
    { title: t('common:home'), href: '/' },
    { title: t('common:hrManagement'), href: '/hr' },
    { title: t('employee:employeeManagement') },
  ];

  return (
    <ModernPageTemplate
      title={t('employee:employeeManagement')}
      subtitle={t('employee:employeeManagementDescription')}
      headerExtra={headerExtra}
      showBreadcrumb
      breadcrumbItems={breadcrumbItems}
    >
      {/* 搜索和筛选区域 */}
      <ModernCard
        title={t('common:searchAndFilter')}
        icon={<SearchOutlined />}
        variant="outlined"
        className="mb-6"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input.Search
              placeholder={t('employee:searchPlaceholder')}
              allowClear
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch('');
                }
              }}
              className="w-full"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder={t('employee:selectDepartment')}
              allowClear
              options={lookupMaps?.departmentMap ? Object.values(lookupMaps.departmentMap).map((dept: any) => ({
                label: dept.name,
                value: dept.id,
              })) : []}
              onChange={(value) => {
                setFilters(prev => ({
                  ...prev,
                  department_name_contains: value || undefined,
                }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              className="w-full"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder={t('employee:selectStatus')}
              allowClear
              options={[
                { label: t('employee:statusActive'), value: '在职' },
                { label: t('employee:statusInactive'), value: '离职' },
                { label: t('employee:statusProbation'), value: '试用' },
              ]}
              onChange={(value) => {
                setFilters(prev => ({
                  ...prev,
                  employee_status_equals: value || undefined,
                }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              className="w-full"
            />
          </Col>
        </Row>
      </ModernCard>

      {/* 数据表格 */}
      <ModernCard>
        <OrganizationManagementTableTemplate<EmployeeBasic>
          columns={columns}
          dataSource={employees}
          loading={loading || lookupLoading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="employee_id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
          }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </ModernCard>
    </ModernPageTemplate>
  );
};

export default EmployeeListPageModern;