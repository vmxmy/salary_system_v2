import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Space, Alert, Button, Form } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserAddOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// 现代化组件
import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';
import EmployeeForm from '../../../components/employee/EmployeeForm';

// 服务和类型
import { employeeService } from '../../../services/employeeService';

// 简化的表单数据类型
interface EmployeeFormData {
  [key: string]: any;
}

/**
 * 现代化创建员工页面
 * 使用统一的现代化设计系统
 */
const CreateEmployeePageModern: React.FC = () => {
  const { t } = useTranslation(['employee', 'common']);
  const navigate = useNavigate();
  const formRef = useRef<any>(null);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理表单提交
  const handleSubmit = useCallback(async (formData: EmployeeFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📤 提交员工数据:', formData);
      const newEmployee = await employeeService.createEmployee(formData as any);
      console.log('✅ 员工创建成功，返回数据:', newEmployee);
      
      message.success(t('employee:createSuccess'));
      
      // 检查返回的员工数据是否包含ID
      if (newEmployee && newEmployee.id) {
        navigate(`/hr/employees/${newEmployee.id}`);
      } else {
        console.warn('⚠️ 创建成功但没有返回员工ID，跳转到员工列表页');
        navigate('/hr/employees');
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      const errorMessage = error instanceof Error ? error.message : t('employee:createError');
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t, navigate]);

  // 处理保存按钮点击
  const handleSaveClick = useCallback(() => {
    formRef.current?.submit();
  }, []);

  // 处理返回操作
  const handleBack = useCallback(() => {
    navigate('/hr/employees');
  }, [navigate]);

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
    { title: t('employee:createEmployee') },
  ];

  return (
    <ModernPageTemplate
      title={t('employee:createEmployee')}
      subtitle={t('employee:createEmployeeDescription')}
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
        title={t('employee:employeeInformation')}
        icon={<UserAddOutlined />}
        variant="outlined"
        extra={
          <Space>
            <Button 
              onClick={handleBack} 
              className="modern-button variant-secondary"
            >
              {t('common:cancel')}
            </Button>
            <Button 
              type="primary" 
              loading={loading} 
              onClick={handleSaveClick}
              icon={<SaveOutlined />}
              className="modern-button variant-primary"
            >
              {t('common:save')}
            </Button>
          </Space>
        }
      >
        <EmployeeForm
          ref={formRef}
          onSubmit={handleSubmit}
          loading={loading}
          mode="create"
        />
      </ModernCard>
    </ModernPageTemplate>
  );
};

export default CreateEmployeePageModern;