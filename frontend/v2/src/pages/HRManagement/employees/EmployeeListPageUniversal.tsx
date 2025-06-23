import React, { useState, useCallback, useMemo } from 'react';
import { useRenderMonitor } from '../../../hooks/useRenderCount';
import { Button, Space, Row, Col, Card, Statistic } from 'antd';
import { 
  PlusOutlined, 
  DownloadOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined, 
  UserOutlined,
  TeamOutlined,
  PhoneOutlined,
  MailOutlined
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
import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';

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
  const { t } = useTranslation(['employee', 'common']);
  const navigate = useNavigate();
  
  // 渲染监控 - 检测无限循环
  const { renderCount, isExcessive } = useRenderMonitor({
    componentName: 'EmployeeListPageUniversal',
    warningThreshold: 3,
    enableLogging: true,
    enableProfiling: true
  });
  
  // State management
  const [modalVisible, setModalVisible] = useState(false);
  const [queryFilters, setQueryFilters] = useState<EmployeeBasicQuery>({
    page: 1,
    size: 100,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Hooks
  const { permissions } = useEmployeePermissions();

  // Data fetching with universal query hook
  const {
    data: employees = [],
    isLoading,
    error,
    refetch
  } = useUniversalDataQuery(
    'employees_universal',
    () => employeeService.getEmployeesFromView(queryFilters),
    {
      enabled: true,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }
  );

  // Employee statistics
  const employeeStats = useMemo(() => {
    const stats = {
      total: employees.length,
      active: employees.filter(emp => emp.employee_status === 'active').length,
      departments: new Set(employees.map(emp => emp.department_name).filter(Boolean)).size,
      recentHires: employees.filter(emp => {
        if (!emp.hire_date) return false;
        const hireDate = new Date(emp.hire_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return hireDate > thirtyDaysAgo;
      }).length
    };
    return stats;
  }, [employees]);

  // Search configuration for employees - memoized to prevent infinite loops
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

  // Preset configuration - memoized to prevent infinite loops
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
      onClick: (record) => {
        console.log('查看员工详情:', record);
        navigate(`/hr/employees/${record.id}/detail`);
      },
      permission: 'canViewDetail'
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record) => {
        console.log('编辑员工:', record);
        navigate(`/hr/employees/${record.id}/edit`);
      },
      permission: 'canUpdate'
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      onClick: (record) => {
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
    <Space>
      <Button 
        type="primary" 
        icon={<SearchOutlined />}
        onClick={() => setModalVisible(true)}
        size="large"
      >
        高级搜索浏览
      </Button>
      {permissions.canCreate && (
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/hr/employees/create')}
          size="large"
        >
          新增员工
        </Button>
      )}
      {permissions.canExport && (
        <Button 
          icon={<DownloadOutlined />}
          onClick={() => setModalVisible(true)}
          size="large"
        >
          批量导出
        </Button>
      )}
    </Space>
  );

  return (
    <ModernPageTemplate
      title="员工管理"
      subtitle="现代化员工信息管理系统 - 基于通用数据浏览组件"
      showBreadcrumb={true}
      breadcrumbItems={[
        { title: '首页', href: '/' },
        { title: '人力资源', href: '/hr' },
        { title: '员工管理' }
      ]}
      headerExtra={headerActions}
    >
      {/* Employee Statistics Dashboard */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <ModernCard>
            <Statistic
              title="员工总数"
              value={employeeStats.total}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </ModernCard>
        </Col>
        <Col span={6}>
          <ModernCard>
            <Statistic
              title="在职员工"
              value={employeeStats.active}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </ModernCard>
        </Col>
        <Col span={6}>
          <ModernCard>
            <Statistic
              title="部门数量"
              value={employeeStats.departments}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </ModernCard>
        </Col>
        <Col span={6}>
          <ModernCard>
            <Statistic
              title="最近入职"
              value={employeeStats.recentHires}
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="人"
            />
          </ModernCard>
        </Col>
      </Row>

      {/* Quick Overview Card */}
      <ModernCard 
        title="员工概览"
        extra={
          <Space>
            <Button 
              type="link" 
              onClick={() => setModalVisible(true)}
              icon={<SearchOutlined />}
            >
              详细浏览
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                  {employees.slice(0, 5).map(emp => emp.full_name).join('、')}
                  {employees.length > 5 && '...'}
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  最新员工 ({employees.length > 5 ? '仅显示前5位' : '全部'})
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                  {Array.from(new Set(employees.map(emp => emp.department_name).filter(Boolean)))
                    .slice(0, 3).join('、')}
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  主要部门 (共{employeeStats.departments}个)
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <PhoneOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                  {employees.filter(emp => emp.phone_number).length} / {employees.length}
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  联系方式完整度
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <div style={{ 
          marginTop: 16, 
          padding: 16, 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: 6,
          textAlign: 'center'
        }}>
          <Space direction="vertical">
            <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
              🎉 使用全新的通用数据浏览系统
            </div>
            <div style={{ color: '#666', fontSize: 12 }}>
              点击"高级搜索浏览"体验强大的搜索、筛选、列管理和预设功能
            </div>
          </Space>
        </div>
      </ModernCard>

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
    </ModernPageTemplate>
  );
};

export default EmployeeListPageUniversal;