import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Space, Input, Select, Row, Col } from 'antd';
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
import type { TablePaginationConfig, FilterValue } from 'antd/es/table/interface';
import type { ProColumns } from '@ant-design/pro-components';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import { employeeService } from '../../../services/employeeService';
import { useTableSearch, useTableExport } from '../../../components/common/TableUtils';
import Highlighter from 'react-highlight-words';
import TableActionButton from '../../../components/common/TableActionButton';
import { useEmployeePermissions } from '../../../hooks/useEmployeePermissions';
import { useRenderCount } from '../../../hooks/useRenderCount';

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
  
  // 渲染监控 - 检测无限循环
  const { renderCount, isExcessive } = useRenderCount({
    componentName: 'EmployeeListPageModern',
    warningThreshold: 5,
    enableLogging: true,
  });

  // 如果检测到过度渲染，记录详细信息
  if (isExcessive) {
    console.warn(`🔄 EmployeeListPageModern 渲染次数异常: ${renderCount}次`);
  }

  // 获取员工数据 - 移除循环依赖
  const fetchEmployees = useCallback(async (queryParams?: Partial<EmployeeBasicQuery>) => {
    try {
      setLoading(true);
      
      const query: EmployeeBasicQuery = {
        page: queryParams?.page || pagination.current || 1,
        size: queryParams?.size || pagination.pageSize || 10,
        sortBy: queryParams?.sortBy || sorter.field,
        sortOrder: queryParams?.sortOrder || (sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined),
        ...filters,
        ...queryParams,
      };

      // 使用专门的视图接口获取基本员工信息
      const employees = await employeeService.getEmployeesFromView(query);
      
      setEmployees(employees || []);
      // 返回数据而不是直接更新分页状态，避免循环依赖
      return {
        data: employees || [],
        total: employees?.length || 0,
        page: query.page,
        size: query.size,
      };
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      message.error(t('common:fetchError'));
      return {
        data: [],
        total: 0,
        page: pagination.current || 1,
        size: pagination.pageSize || 10,
      };
    } finally {
      setLoading(false);
    }
  }, [t, sorter.field, sorter.order, filters]); // eslint-disable-line react-hooks/exhaustive-deps
  // 有意省略pagination依赖避免循环，通过参数传递动态值

  // 初始化数据加载
  useEffect(() => {
    const loadInitialData = async () => {
      const result = await fetchEmployees();
      if (result) {
        setPagination(prev => ({
          ...prev,
          total: result.total,
          current: result.page,
          pageSize: result.size,
        }));
      }
    };
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // 只在组件挂载时执行一次，fetchEmployees稳定不会变化

  // 监听查询参数变化，重新获取数据
  useEffect(() => {
    const loadDataWithParams = async () => {
      const result = await fetchEmployees({
        page: pagination.current,
        size: pagination.pageSize,
        sortBy: sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined,
      });
      if (result) {
        // 只更新总数，保持当前页码和页面大小
        setPagination(prev => ({
          ...prev,
          total: result.total,
        }));
      }
    };

    // 避免初始加载时重复执行
    if (pagination.current !== 1 || pagination.pageSize !== 10 || sorter.field || Object.keys(filters).length > 0) {
      loadDataWithParams();
    }
  }, [pagination.current, pagination.pageSize, sorter.field, sorter.order, filters, fetchEmployees]); // eslint-disable-line react-hooks/exhaustive-deps
  // fetchEmployees依赖已优化，不会导致无限循环

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
  const handleRefresh = useCallback(async () => {
    const result = await fetchEmployees({
      page: pagination.current,
      size: pagination.pageSize,
      sortBy: sorter.field,
      sortOrder: sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined,
    });
    if (result) {
      setPagination(prev => ({
        ...prev,
        total: result.total,
      }));
    }
  }, [fetchEmployees, pagination.current, pagination.pageSize, sorter.field, sorter.order]); // eslint-disable-line react-hooks/exhaustive-deps
  // pagination对象引用稳定，不会导致无限循环


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
          // 刷新数据
          const result = await fetchEmployees({
            page: pagination.current,
            size: pagination.pageSize,
            sortBy: sorter.field,
            sortOrder: sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined,
          });
          if (result) {
            setPagination(prev => ({
              ...prev,
              total: result.total,
            }));
          }
        } catch (error) {
          console.error('Delete failed:', error);
          message.error(t('employee:deleteError'));
        }
      },
    });
  }, [t, fetchEmployees, pagination.current, pagination.pageSize, sorter.field, sorter.order]); // eslint-disable-line react-hooks/exhaustive-deps
  // pagination对象引用稳定，依赖已优化

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
      {/* 添加上边距，防止指标卡覆盖标题和按钮 */}
      <div style={{ marginTop: '24px' }}>
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
      </div>
    </ModernPageTemplate>
  );
};

export default EmployeeListPageModern;