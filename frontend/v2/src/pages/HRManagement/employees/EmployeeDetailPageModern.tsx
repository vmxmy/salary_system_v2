import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  message, 
  Alert, 
  Typography, 
  Tag, 
  Space,
  Tabs,
  Row,
  Col,
  Statistic,
  Avatar,
  Divider,
  Descriptions,
  Spin
} from 'antd';
import { 
  EditOutlined, 
  ArrowLeftOutlined,
  UserOutlined,
  BankOutlined,
  ContactsOutlined,
  HistoryOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  CalendarOutlined,
  TeamOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

// 现代化组件
import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';
import TableActionButton from '../../../components/common/TableActionButton';

// 服务和类型
import { employeeService } from '../../../services/employeeService';
import type { Employee } from '../types';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import { useEmployeePermissions } from '../../../hooks/useEmployeePermissions';
import { useRenderCount } from '../../../hooks/useRenderCount';

// 简化的Tab组件
const TabPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-6 text-center">
    <p className="typography-body text-secondary">
      {title} 内容将在此处显示
    </p>
  </div>
);

const { Title, Text } = Typography;

/**
 * 现代化员工详情页面
 * 使用统一的现代化设计系统和布局
 */
const EmployeeDetailPageModern: React.FC = () => {
  const { t } = useTranslation(['employee', 'common', 'hr']);
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Hooks
  const { lookupMaps, loading: lookupsLoading } = useLookupMaps();
  const { permissions } = useEmployeePermissions();
  
  // 渲染监控 - 检测无限循环
  const { renderCount, isExcessive } = useRenderCount({
    componentName: 'EmployeeDetailPageModern',
    warningThreshold: 5,
    enableLogging: true,
  });

  // 如果检测到过度渲染，记录详细信息
  if (isExcessive) {
    console.warn(`🔄 EmployeeDetailPageModern 渲染次数异常: ${renderCount}次, employeeId: ${employeeId}`);
  }

  // 初始化数据 - 直接在useEffect中处理，避免嵌套依赖
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) {
        setError(t('employee:invalidEmployeeId'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const employeeData = await employeeService.getEmployeeByIdFromView(employeeId);
        setEmployee(employeeData);
      } catch (error) {
        console.error('Failed to fetch employee:', error);
        setError(t('employee:fetchError'));
        message.error(t('employee:fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, t]); // 只依赖真正需要的变量

  // 重新获取数据的方法（用于刷新）
  const refetchEmployee = useCallback(async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      setError(null);
      
      const employeeData = await employeeService.getEmployeeByIdFromView(employeeId);
      setEmployee(employeeData);
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      setError(t('employee:fetchError'));
      message.error(t('employee:fetchError'));
    } finally {
      setLoading(false);
    }
  }, [employeeId, t]);

  // 工具函数
  const formatDate = (date: string | null | undefined): string => {
    if (!date) return t('common:notSet');
    try {
      return dayjs(date).format('YYYY-MM-DD');
    } catch {
      return t('common:formatError');
    }
  };

  const calculateSeniority = (hireDate: string | null | undefined): string => {
    if (!hireDate) return t('common:notSet');
    
    try {
      const hire = dayjs(hireDate);
      const now = dayjs();
      
      const years = now.diff(hire, 'year');
      const months = now.diff(hire.add(years, 'year'), 'month');
      
      if (years > 0) {
        return `${years}${t('common:years')}${months}${t('common:months')}`;
      }
      return `${months}${t('common:months')}`;
    } catch {
      return t('common:calculateError');
    }
  };

  const getEmployeeDisplayName = (emp: Employee | null): string => {
    if (!emp) return t('employee:unknownEmployee');
    const nameParts = [emp.last_name, emp.first_name].filter(Boolean);
    return nameParts.length > 0 ? nameParts.join('') : (emp.employee_code || t('employee:unknownEmployee'));
  };

  const getStatusTag = (statusText: string | null | undefined): React.ReactNode => {
    if (!statusText) return <Tag>{t('common:notSet')}</Tag>;
    
    // 根据状态显示不同颜色的标签
    const statusCode = statusText.toLowerCase();
    let color = 'default';
    
    if (statusCode.includes('active') || statusCode.includes('在职')) {
      color = 'success';
    } else if (statusCode.includes('probation') || statusCode.includes('试用')) {
      color = 'warning';
    } else if (statusCode.includes('terminated') || statusCode.includes('离职')) {
      color = 'error';
    }
    
    return <Tag color={color} className="typography-caption-strong">{statusText}</Tag>;
  };

  // 处理编辑操作
  const handleEdit = useCallback(() => {
    if (employee) {
      navigate(`/hr/employees/${employee.id}/edit`);
    }
  }, [employee, navigate]);

  // 处理返回操作
  const handleBack = useCallback(() => {
    navigate('/hr/employees');
  }, [navigate]);

  // Loading 状态
  if (loading || lookupsLoading) {
    return (
      <ModernPageTemplate
        title={t('employee:employeeDetail')}
        subtitle={t('employee:loading')}
      >
        <div className="loading-container d-flex justify-center items-center" style={{ height: '400px' }}>
          <Spin size="large" />
        </div>
      </ModernPageTemplate>
    );
  }

  // Error 状态
  if (error || !employee) {
    return (
      <ModernPageTemplate
        title={t('employee:employeeDetail')}
        subtitle={t('employee:employeeNotFound')}
      >
        <ModernCard>
          <Alert
            message={t('employee:error')}
            description={error || t('employee:employeeNotFound')}
            type="error"
            showIcon
            action={
              <Space>
                <Button size="small" onClick={handleBack}>
                  {t('common:back')}
                </Button>
                <Button size="small" type="primary" onClick={refetchEmployee}>
                  {t('common:retry')}
                </Button>
              </Space>
            }
          />
        </ModernCard>
      </ModernPageTemplate>
    );
  }

  // 页面头部额外内容
  const headerExtra = (
    <Space>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
        className="modern-button variant-ghost"
      >
        {t('common:back')}
      </Button>
      {permissions.canUpdate && (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEdit}
          className="modern-button variant-primary"
        >
          {t('common:edit')}
        </Button>
      )}
    </Space>
  );

  // 面包屑导航
  const breadcrumbItems = [
    { title: t('common:home'), href: '/' },
    { title: t('common:hrManagement'), href: '/hr' },
    { title: t('employee:employeeManagement'), href: '/hr/employees' },
    { title: getEmployeeDisplayName(employee) },
  ];

  // Tab 配置
  const tabItems = [
    {
      key: 'basic',
      label: (
        <Space>
          <UserOutlined />
          {t('employee:basicInfo')}
        </Space>
      ),
      children: <TabPlaceholder title={t('employee:basicInfo')} />,
    },
    {
      key: 'job',
      label: (
        <Space>
          <ApartmentOutlined />
          {t('employee:jobInfo')}
        </Space>
      ),
      children: <TabPlaceholder title={t('employee:jobInfo')} />,
    },
    {
      key: 'compensation',
      label: (
        <Space>
          <BankOutlined />
          {t('employee:compensationHistory')}
        </Space>
      ),
      children: <TabPlaceholder title={t('employee:compensationHistory')} />,
    },
    {
      key: 'contract',
      label: (
        <Space>
          <IdcardOutlined />
          {t('employee:contractInfo')}
        </Space>
      ),
      children: <TabPlaceholder title={t('employee:contractInfo')} />,
    },
    {
      key: 'history',
      label: (
        <Space>
          <HistoryOutlined />
          {t('employee:jobHistory')}
        </Space>
      ),
      children: <TabPlaceholder title={t('employee:jobHistory')} />,
    },
    {
      key: 'leave',
      label: (
        <Space>
          <CalendarOutlined />
          {t('employee:leaveBalance')}
        </Space>
      ),
      children: <TabPlaceholder title={t('employee:leaveBalance')} />,
    },
  ];

  return (
    <ModernPageTemplate
      title={getEmployeeDisplayName(employee)}
      subtitle={`${t('employee:employeeCode')}: ${employee.employee_code || t('common:notSet')}`}
      headerExtra={headerExtra}
      showBreadcrumb
      breadcrumbItems={breadcrumbItems}
    >
      {/* 员工概览卡片 */}
      <ModernCard className="mb-6">
        <Row gutter={[24, 24]} align="middle">
          {/* 员工头像和基本信息 */}
          <Col xs={24} sm={12} md={8}>
            <div className="d-flex items-center gap-4">
              <Avatar 
                size={80} 
                icon={<UserOutlined />}
                className="shadow-md"
                style={{ 
                  backgroundColor: '#3b82f6',
                  fontSize: '32px'
                }}
              />
              <div>
                <Title level={3} className="typography-heading-2 mb-1">
                  {getEmployeeDisplayName(employee)}
                </Title>
                <Space direction="vertical" size="small">
                  {getStatusTag((employee as any).employee_status || '在职')}
                  <Text className="typography-caption text-secondary">
                    {(employee as any).department_name || employee.departmentName || t('common:notSet')}
                  </Text>
                </Space>
              </div>
            </div>
          </Col>

          {/* 关键统计信息 */}
          <Col xs={24} sm={12} md={8}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={t('employee:seniority')}
                  value={calculateSeniority(employee.hire_date?.toString())}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ 
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#059669'
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('employee:position')}
                  value={employee.position_name || t('common:notSet')}
                  prefix={<TeamOutlined />}
                  valueStyle={{ 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#3b82f6'
                  }}
                />
              </Col>
            </Row>
          </Col>

          {/* 联系信息 */}
          <Col xs={24} sm={24} md={8}>
            <div className="text-right">
              <Space direction="vertical" size="small" className="w-full">
                {employee.email && (
                  <div className="d-flex items-center gap-2 justify-end">
                    <MailOutlined className="text-accent" />
                    <Text className="typography-body">
                      <a href={`mailto:${employee.email}`} className="text-accent">
                        {employee.email}
                      </a>
                    </Text>
                  </div>
                )}
                <div className="d-flex items-center gap-2 justify-end">
                  <CalendarOutlined className="text-tertiary" />
                  <Text className="typography-caption">
                    {t('employee:hireDate')}: {formatDate(employee.hire_date?.toString())}
                  </Text>
                </div>
              </Space>
            </div>
          </Col>
        </Row>
      </ModernCard>

      {/* 详细信息选项卡 */}
      <ModernCard>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="modern-tabs"
          size="large"
        />
      </ModernCard>
    </ModernPageTemplate>
  );
};

export default EmployeeDetailPageModern;