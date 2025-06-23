import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Space, Alert, Button, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// 现代化组件
import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';

// 服务和类型
import { employeeService } from '../../../services/employeeService';
import type { Employee } from '../types';

// 简化的表单数据类型
interface EmployeeFormData {
  [key: string]: any;
}

/**
 * 现代化编辑员工页面
 * 使用统一的现代化设计系统
 */
const EditEmployeePageModern: React.FC = () => {
  const { t } = useTranslation(['employee', 'common']);
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取员工数据
  const fetchEmployee = useCallback(async () => {
    if (!employeeId) {
      setError(t('employee:invalidEmployeeId'));
      setFetchLoading(false);
      return;
    }

    try {
      setFetchLoading(true);
      setError(null);
      
      const employeeData = await employeeService.getEmployeeByIdFromView(employeeId);
      setEmployee(employeeData);
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      const errorMessage = error instanceof Error ? error.message : t('employee:fetchError');
      setError(errorMessage);
    } finally {
      setFetchLoading(false);
    }
  }, [employeeId, t]);

  // 初始化数据
  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  // 处理表单提交
  const handleSubmit = useCallback(async (formData: EmployeeFormData) => {
    if (!employee) return;

    try {
      setLoading(true);
      setError(null);
      
      const updatedEmployee = await employeeService.updateEmployee(employee.id.toString(), formData);
      
      message.success(t('employee:updateSuccess'));
      navigate(`/hr/employees/${updatedEmployee.id}`);
    } catch (error) {
      console.error('Failed to update employee:', error);
      const errorMessage = error instanceof Error ? error.message : t('employee:updateError');
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [employee, t, navigate]);

  // 处理返回操作
  const handleBack = useCallback(() => {
    if (employee) {
      navigate(`/hr/employees/${employee.id}`);
    } else {
      navigate('/hr/employees');
    }
  }, [employee, navigate]);

  // 获取员工显示名称
  const getEmployeeDisplayName = (emp: Employee | null): string => {
    if (!emp) return t('employee:unknownEmployee');
    const nameParts = [emp.last_name, emp.first_name].filter(Boolean);
    return nameParts.length > 0 ? nameParts.join('') : (emp.employee_code || t('employee:unknownEmployee'));
  };

  // Loading 状态
  if (fetchLoading) {
    return (
      <ModernPageTemplate
        title={t('employee:editEmployee')}
        subtitle={t('employee:loading')}
      >
        <div className="loading-container d-flex justify-center items-center" style={{ height: '400px' }}>
          <Spin size="large" />
        </div>
      </ModernPageTemplate>
    );
  }

  // Error 状态
  if (error && !employee) {
    return (
      <ModernPageTemplate
        title={t('employee:editEmployee')}
        subtitle={t('employee:employeeNotFound')}
      >
        <ModernCard>
          <Alert
            message={t('employee:error')}
            description={error}
            type="error"
            showIcon
            action={
              <Space>
                <Button size="small" onClick={() => navigate('/hr/employees')}>
                  {t('common:back')}
                </Button>
                <Button size="small" type="primary" onClick={fetchEmployee}>
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
    </Space>
  );

  // 面包屑导航
  const breadcrumbItems = [
    { title: t('common:home'), href: '/' },
    { title: t('common:hrManagement'), href: '/hr' },
    { title: t('employee:employeeManagement'), href: '/hr/employees' },
    { title: getEmployeeDisplayName(employee), href: employee ? `/hr/employees/${employee.id}` : undefined },
    { title: t('common:edit') },
  ];

  return (
    <ModernPageTemplate
      title={`${t('common:edit')} ${getEmployeeDisplayName(employee)}`}
      subtitle={`${t('employee:employeeCode')}: ${employee?.employee_code || t('common:notSet')}`}
      headerExtra={headerExtra}
      showBreadcrumb
      breadcrumbItems={breadcrumbItems}
    >
      {/* 错误提示 */}
      {error && (
        <ModernCard className="mb-6">
          <Alert
            message={t('employee:error')}
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        </ModernCard>
      )}

      {/* 员工表单 */}
      <ModernCard
        title={t('employee:editEmployeeInformation')}
        icon={<EditOutlined />}
        variant="outlined"
      >
        <div className="p-6">
          <p className="typography-body text-secondary">
            {t('employee:editEmployeeFormPlaceholder', '员工编辑表单将在此处显示')}
          </p>
          <Space className="mt-4">
            <Button onClick={handleBack} className="modern-button variant-secondary">
              {t('common:cancel')}
            </Button>
            <Button type="primary" loading={loading} className="modern-button variant-primary">
              {t('common:save')}
            </Button>
          </Space>
        </div>
      </ModernCard>
    </ModernPageTemplate>
  );
};

export default EditEmployeePageModern;