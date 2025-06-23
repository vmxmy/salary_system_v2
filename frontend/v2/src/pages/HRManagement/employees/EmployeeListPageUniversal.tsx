import React, { useState, useCallback, useMemo } from 'react';
import { useRenderMonitor } from '../../../hooks/useRenderCount';
import { Row, Col } from 'antd';
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
import ModernCard from '../../../components/common/ModernCard';
import ModernButton from '../../../components/common/ModernButton';
import ModernButtonGroup from '../../../components/common/ModernButtonGroup';

// Hooks and services
import { useUniversalDataQuery } from '../../../components/universal/hooks/useUniversalDataQuery';
import { useEmployeePermissions } from '../../../hooks/useEmployeePermissions';
import { employeeService } from '../../../services/employeeService';

// Types
import type { EmployeeBasic, EmployeeBasicQuery } from '../../../types/viewApiTypes';
import { SearchMode } from '../../../utils/searchUtils';

/**
 * Universal Employee List Page
 * Demonstrates the power of the new universal data browsing system
 * by refactoring the employee list with minimal code
 */
const EmployeeListPageUniversal: React.FC = () => {
  const { } = useTranslation(['employee', 'common']);
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

  // Data fetching with universal query hook
  const {
    data: employees = [],
    isLoading,
    // error,
    // refetch
  } = useUniversalDataQuery(
    'employees_universal',
    () => employeeService.getEmployeesFromView(queryFilters),
    {
      enabled: true,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }
  );

  // Employee statistics - 优化计算逻辑，减少重复计算
  const employeeStats = useMemo(() => {
    if (!employees || employees.length === 0) {
      return { total: 0, active: 0, departments: 0, recentHires: 0, regular: 0, contract: 0 };
    }

    let activeCount = 0;
    let recentHiresCount = 0;
    let regularCount = 0;
    let contractCount = 0;
    const departmentSet = new Set<string>();
    
    // 计算30天前的日期，避免在循环中重复创建
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 单次遍历完成所有统计
    employees.forEach(emp => {
      // 统计活跃员工
      if (emp.employee_status === 'active') {
        activeCount++;
      }
      
      // 统计部门数量
      if (emp.department_name) {
        departmentSet.add(emp.department_name);
      }
      
      // 统计正编和聘用员工
      if (emp.personnel_category_name) {
        if (emp.personnel_category_name.includes('正编') || emp.personnel_category_name.includes('正式')) {
          regularCount++;
        } else if (emp.personnel_category_name.includes('聘用') || emp.personnel_category_name.includes('合同')) {
          contractCount++;
        }
      }
      
      // 统计近期入职
      if (emp.hire_date) {
        let hireDate: Date;
        if (typeof emp.hire_date === 'string' || typeof emp.hire_date === 'number') {
          hireDate = new Date(emp.hire_date);
        } else {
          // Handle Dayjs or other date objects
          hireDate = new Date((emp.hire_date as unknown as { toString: () => string }).toString());
        }
        if (hireDate > thirtyDaysAgo) {
          recentHiresCount++;
        }
      }
    });

    return {
      total: employees.length,
      active: activeCount,
      departments: departmentSet.size,
      recentHires: recentHiresCount,
      regular: regularCount,
      contract: contractCount
    };
  }, [employees]);

  // Search configuration for employees - 稳定化配置对象
  const searchConfig = useMemo<SearchConfig<EmployeeBasic>>(() => ({
    searchableFields: [
      { key: 'full_name', label: '姓名', type: 'text' },
      { key: 'employee_code', label: '员工编号', type: 'text' },
      { key: 'department_name', label: '部门', type: 'text' },
      { key: 'position_name', label: '职位', type: 'text' },
      { key: 'phone_number', label: '电话', type: 'text' },
      { key: 'email', label: '邮箱', type: 'text' },
    ] as SearchableField<EmployeeBasic>[],
    supportExpressions: true,
    searchModes: [SearchMode.AUTO, SearchMode.EXACT, SearchMode.FUZZY, SearchMode.SMART],
    placeholder: '搜索员工姓名、编号、部门、职位... 或使用表达式如 department_name=技术部',
    debounceMs: 300
  }), []);

  // Filter configuration for employees - memoized to prevent infinite loops
  const filterConfig = useMemo<FilterConfig>(() => ({
    hideEmptyColumns: true,
    hideZeroColumns: false,
    categorySort: ['基本信息', '联系信息', '职位信息', '其他信息'],
    presets: [
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
    ]
  }), []);

  // Preset configuration - 稳定化预设配置
  const presetConfig = useMemo<PresetConfig>(() => ({
    enabled: true,
    categories: ['员工筛选', '部门视图', '状态筛选', '自定义配置']
  }), []);

  // Action configuration - memoized to prevent infinite loops
  const actions: ActionConfig<EmployeeBasic>[] = useMemo(() => [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: EmployeeBasic) => {
        console.log('查看员工详情:', record);
        navigate(`/hr/employees/${record.id}/detail`);
      },
      permission: 'canViewDetail'
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record: EmployeeBasic) => {
        console.log('编辑员工:', record);
        navigate(`/hr/employees/${record.id}/edit`);
      },
      permission: 'canUpdate'
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      onClick: (record: EmployeeBasic) => {
        console.log('删除员工:', record);
        // TODO: Implement delete functionality
      },
      permission: 'canDelete'
    }
  ].filter(action => !action.permission || permissions[action.permission as keyof typeof permissions]), [navigate, permissions]);

  // Handle row selection
  const handleRowSelect = useCallback((selectedRows: EmployeeBasic[]) => {
    console.log('选中的员工:', selectedRows);
  }, []);

  // Handle export
  const handleExport = useCallback((data: EmployeeBasic[]) => {
    console.log('导出员工数据:', data.length, '条记录');
  }, []);

  // Handle double click to view details
  const handleRowDoubleClick = useCallback((record: EmployeeBasic) => {
    navigate(`/hr/employees/${record.id}/detail`);
  }, [navigate]);


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

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题卡片 */}
      <ModernCard style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} justify="space-between" align="middle" wrap>
          <Col xs={24} sm={24} md={12}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>员工管理</h1>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              现代化员工信息管理系统 - 基于通用数据浏览组件
            </p>
          </Col>
          <Col xs={24} sm={24} md={12} className="header-actions-col">
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {headerActions}
            </div>
          </Col>
        </Row>
      </ModernCard>

      {/* Employee Statistics Dashboard - Simplified */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatisticCard
            statistic={{
              title: '员工总数',
              value: employeeStats.total,
              suffix: '人',
              valueStyle: { color: '#1890ff' }
            }}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatisticCard
            statistic={{
              title: '在职员工',
              value: employeeStats.active,
              suffix: '人',
              valueStyle: { color: '#52c41a' }
            }}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatisticCard
            statistic={{
              title: '正编员工',
              value: employeeStats.regular,
              suffix: '人',
              valueStyle: { color: '#13c2c2' }
            }}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatisticCard
            statistic={{
              title: '聘用员工',
              value: employeeStats.contract,
              suffix: '人',
              valueStyle: { color: '#eb2f96' }
            }}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatisticCard
            statistic={{
              title: '部门数量',
              value: employeeStats.departments,
              suffix: '个',
              valueStyle: { color: '#722ed1' }
            }}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatisticCard
            statistic={{
              title: '最近入职',
              value: employeeStats.recentHires,
              suffix: '人',
              valueStyle: { color: '#fa8c16' }
            }}
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* Universal Data Modal */}
      <UniversalDataModal<EmployeeBasic>
        title="员工信息浏览"
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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
        
        // Actions
        actions={actions}
        onRowSelect={handleRowSelect}
        onExport={handleExport}
        onRowDoubleClick={handleRowDoubleClick}
        
        // Table configuration
        rowKey="id"
        selectable={true}
        exportable={permissions.canExport}
        
        // Style configuration
        width="95%"
        height={650}
        
        // Advanced configuration
        queryKey="employees_modal"
      />
    </div>
  );
};

export default EmployeeListPageUniversal;