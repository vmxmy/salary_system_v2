import React, { useState, useCallback, useMemo } from 'react';
import { useRenderMonitor } from '../../../hooks/useRenderCount';
import { StatisticCard } from '@ant-design/pro-components';
import { 
  PlusOutlined, 
  DownloadOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Layout components
import { PageLayout, FlexLayout, GridLayout, Box } from '../../../components/Layout';

// Universal components
import UniversalDataModal from '../../../components/universal/DataBrowser/UniversalDataModal';
import type { 
  SearchConfig, 
  FilterConfig, 
  PresetConfig, 
  ActionConfig,
  SearchableField 
} from '../../../components/universal/DataBrowser/UniversalDataModal';

// Modern design components
import ModernButton from '../../../components/common/ModernButton';
import ModernButtonGroup from '../../../components/common/ModernButtonGroup';

// Hooks and services
import { useUniversalDataQuery } from '../../../components/universal/hooks/useUniversalDataQuery';
import { useEmployeePermissions } from '../../../hooks/useEmployeePermissions';
import { employeeService } from '../../../services/employeeService';

// Types
import type { EmployeeBasic, EmployeeBasicQuery } from '../../../types/viewApiTypes';
import { SearchMode } from '../../../utils/searchUtils';

// 静态常量 - 移到组件外部确保引用稳定性
const CATEGORY_SORT = ['基本信息', '联系信息', '职位信息', '其他信息'];

const FILTER_PRESETS = [
  {
    name: '基本信息',
    filters: { employee_status_equals: 'active' },
    description: '显示在职员工的基本信息'
  },
  {
    name: '联系方式',
    filters: {},
    description: '显示员工联系方式'
  },
  {
    name: '职位信息',
    filters: {},
    description: '显示职位和部门信息'
  },
  {
    name: '最近入职',
    filters: {},
    description: '显示最近30天入职的员工'
  }
];

const PRESET_CATEGORIES = ['员工筛选', '部门视图', '状态筛选', '自定义配置'];

/**
 * Universal Employee List Page
 * Demonstrates the power of the new universal data browsing system
 * by refactoring the employee list with minimal code
 */
const EmployeeListPageUniversal: React.FC = () => {
  const { t } = useTranslation(['employee', 'common']);
  const navigate = useNavigate();
  
  // 渲染监控 - 检测无限循环
  const { /* renderCount, isExcessive */ } = useRenderMonitor({
    componentName: 'EmployeeListPageUniversal',
    warningThreshold: 3,
    enableLogging: true,
    enableProfiling: true
  });
  
  // State management
  const [modalVisible, setModalVisible] = useState(false);
  
  // 稳定化查询参数，避免不必要的重新渲染
  const queryFilters = useMemo<EmployeeBasicQuery>(() => ({
    page: 1,
    size: 100,
    sortBy: 'created_at',
    sortOrder: 'desc'
  }), []); // 空依赖数组，只在组件挂载时创建一次

  // Hooks
  const { permissions } = useEmployeePermissions();
  
  // Debug log permissions
  console.log('🔍 [EmployeeListPageUniversal] permissions:', permissions);
  
  // Use universal data query hook for employee data
  const { 
    data: employees = [], 
    isLoading 
  } = useUniversalDataQuery(
    'employees-list',
    async () => {
      const response = await employeeService.getEmployees(queryFilters);
      return response.data || [];
    },
    {
      enabled: permissions.canViewEmployees
    }
  );

  // Calculate statistics
  const employeeStats = useMemo(() => {
    const stats = {
      total: employees.length,
      active: 0,
      regular: 0,
      contract: 0,
      departments: new Set<string>(),
      recentHires: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    employees.forEach(emp => {
      const status = typeof emp.status === 'object' && emp.status ? emp.status.name : emp.status;
      if (status === 'active') stats.active++;
      
      const categoryName = emp.personnelCategoryName || emp.personnel_category_name || (emp.personnel_category && emp.personnel_category.name);
      if (categoryName === '正编') stats.regular++;
      if (categoryName === '聘用') stats.contract++;
      
      const deptName = emp.departmentName || emp.department_name || (emp.department && emp.department.name);
      if (deptName) stats.departments.add(deptName);
      
      if (emp.hire_date) {
        const hireDate = new Date(emp.hire_date);
        if (hireDate >= thirtyDaysAgo) stats.recentHires++;
      }
    });

    return {
      ...stats,
      departments: stats.departments.size
    };
  }, [employees]);

  // 使用 useMemo 缓存复杂对象配置
  const searchConfig = useMemo<SearchConfig>(() => ({
    searchableFields: [
      { key: 'name' as keyof EmployeeBasic, label: '姓名', type: 'text' as const },
      { key: 'employee_code' as keyof EmployeeBasic, label: '工号', type: 'text' as const },
      { key: 'departmentName' as keyof EmployeeBasic, label: '部门', type: 'text' as const },
      { key: 'actualPositionName' as keyof EmployeeBasic, label: '职位', type: 'text' as const },
      { key: 'email' as keyof EmployeeBasic, label: '邮箱', type: 'text' as const },
      { key: 'phone_number' as keyof EmployeeBasic, label: '电话', type: 'text' as const }
    ] as SearchableField<EmployeeBasic>[],
    placeholder: '搜索员工姓名、工号、部门...',
    supportExpressions: false,
    searchModes: [SearchMode.FLEXIBLE, SearchMode.EXACT, SearchMode.FUZZY],
    debounceMs: 300
  }), []);

  const filterConfig = useMemo<FilterConfig>(() => ({
    hideEmptyColumns: true,
    hideZeroColumns: false,
    categorySort: CATEGORY_SORT,
    presets: FILTER_PRESETS
  }), []);

  const presetConfig = useMemo<PresetConfig>(() => ({
    enabled: true,
    categories: PRESET_CATEGORIES
  }), []);

  // 稳定化操作配置，避免不必要的重新渲染
  const actionsConfig = useMemo(() => [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      onClick: (record: EmployeeBasic) => navigate(`/hr/employees/${record.id}/detail`),
      permission: 'canViewEmployees'
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record: EmployeeBasic) => navigate(`/hr/employees/${record.id}/edit`),
      permission: 'canUpdateEmployees'
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      onClick: (record: EmployeeBasic) => console.log('删除员工:', `${record.last_name || ''}${record.first_name || ''}`),
      permission: 'canDeleteEmployees'
    }
  ], [navigate]);

  // Handle export - 稳定化函数引用
  const handleExport = useCallback((data: EmployeeBasic[]) => {
    console.log('导出员工数据:', data.length, '条记录');
  }, []);

  // Handle double click to view details
  const handleRowDoubleClick = useCallback((record: EmployeeBasic) => {
    navigate(`/hr/employees/${record.id}/detail`);
  }, [navigate]);

  // Handle modal close - 稳定化函数引用
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  // Page header actions
  const headerActions = (
    <ModernButtonGroup direction="horizontal">
      <ModernButton 
        variant="primary"
        icon={<SearchOutlined />}
        onClick={() => setModalVisible(true)}
        size="middle"
      >
        高级搜索浏览
      </ModernButton>
      <ModernButton 
        variant="primary"
        icon={<PlusOutlined />}
        onClick={() => navigate('/hr/employees/create')}
        size="middle"
      >
        新增员工
      </ModernButton>
      <ModernButton 
        variant="secondary"
        icon={<DownloadOutlined />}
        onClick={() => setModalVisible(true)}
        size="middle"
      >
        批量导出
      </ModernButton>
    </ModernButtonGroup>
  );

  // Statistics cards data
  const statisticsData = [
    {
      title: '员工总数',
      value: employeeStats.total,
      suffix: '人',
      color: '#1890ff'
    },
    {
      title: '在职员工',
      value: employeeStats.active,
      suffix: '人',
      color: '#52c41a'
    },
    {
      title: '正编员工',
      value: employeeStats.regular,
      suffix: '人',
      color: '#13c2c2'
    },
    {
      title: '聘用员工',
      value: employeeStats.contract,
      suffix: '人',
      color: '#eb2f96'
    },
    {
      title: '部门数量',
      value: employeeStats.departments,
      suffix: '个',
      color: '#722ed1'
    },
    {
      title: '最近入职',
      value: employeeStats.recentHires,
      suffix: '人',
      color: '#fa8c16'
    }
  ];

  return (
    <PageLayout
      title="员工管理"
      subtitle="现代化员工信息管理系统 - 基于通用数据浏览组件"
      actions={headerActions}
      showCard={false}
    >
      {/* Employee Statistics Dashboard */}
      <Box mb="6">
        <GridLayout
          columns={6}
          gap="4"
          colsSm={2}
          colsMd={3}
          colsLg={6}
        >
          {statisticsData.map((stat, index) => (
            <StatisticCard
              key={index}
              statistic={{
                title: stat.title,
                value: stat.value,
                suffix: stat.suffix,
                valueStyle: { color: stat.color }
              }}
              loading={isLoading}
            />
          ))}
        </GridLayout>
      </Box>

      {/* Universal Data Modal */}
      <UniversalDataModal<EmployeeBasic>
        title="员工信息浏览"
        visible={modalVisible}
        onClose={handleModalClose}
        dataSource={employees}
        loading={isLoading}
        
        // Search configuration
        searchable={true}
        searchConfig={searchConfig}
        
        // Filter configuration
        filterable={true}
        filterConfig={filterConfig}
        
        // Preset configuration
        presetEnabled={true}
        presetConfig={presetConfig}
        
        // Action configuration
        actions={actionsConfig}
        
        // Column configuration
        columns={[
          { 
            key: 'employee_code', 
            title: '工号', 
            width: 100,
            fixed: 'left' as const,
            sortable: true
          },
          { 
            key: 'name', 
            title: '姓名', 
            width: 120,
            fixed: 'left' as const,
            highlight: true,
            render: (value: any, record: EmployeeBasic) => {
              return `${record.last_name || ''}${record.first_name || ''}`.trim() || '-';
            }
          },
          { 
            key: 'departmentName', 
            title: '部门', 
            width: 150,
            ellipsis: true,
            sortable: true
          },
          { 
            key: 'actualPositionName', 
            title: '职位', 
            width: 150,
            ellipsis: true
          },
          { 
            key: 'personnelCategoryName', 
            title: '人员类别', 
            width: 100,
            align: 'center' as const
          },
          { 
            key: 'status', 
            title: '在职状态', 
            width: 100,
            align: 'center' as const,
            render: (value: any) => {
              // Handle both value as string or as object
              let statusValue: string = '';
              if (typeof value === 'object' && value !== null && 'name' in value) {
                statusValue = String(value.name);
              } else if (typeof value === 'string') {
                statusValue = value;
              } else {
                statusValue = String(value || '');
              }
              
              const statusMap: Record<string, { text: string; color: string }> = {
                active: { text: '在职', color: '#52c41a' },
                inactive: { text: '离职', color: '#f5222d' },
                on_leave: { text: '休假', color: '#fa8c16' }
              };
              const status = statusMap[statusValue] || { text: statusValue || '-', color: '#666' };
              return React.createElement('span', { style: { color: status.color } }, status.text);
            }
          },
          { 
            key: 'hire_date', 
            title: '入职日期', 
            width: 120,
            sortable: true
          },
          { 
            key: 'email', 
            title: '邮箱', 
            width: 200,
            ellipsis: true,
            copyable: true
          },
          { 
            key: 'phone', 
            title: '电话', 
            width: 130,
            copyable: true
          }
        ]}
        
        // Features
        exportable={true}
        onExport={handleExport}
        selectable={true}
        
        // Events
        onRowDoubleClick={handleRowDoubleClick}
      />
    </PageLayout>
  );
};

export default EmployeeListPageUniversal;