import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, App } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EmployeeForm from '../components/EmployeeForm';
import { employeeService } from '../../../services/employeeService';
import type { CreateEmployeePayload, UpdateEmployeePayload } from '../types';
import { PageContainer } from '@ant-design/pro-components';

const CreateEmployeePage: React.FC = () => {
  const { t } = useTranslation(['employee', 'common', 'pageTitle']);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { message } = App.useApp();

  const handleCreateEmployee = async (values: CreateEmployeePayload) => {
    setSubmitting(true);
    try {
      const newEmployee = await employeeService.createEmployee(values);
      message.success(t('employee:create_page.message.create_success'));
      if (newEmployee && newEmployee.id) {
        navigate(`/hr/employees/${newEmployee.id}`);
      } else {
        navigate('/hr/employees');
      }
    } catch (error: any) {
      let errorMessage = t('employee:create_page.message.create_fail_default');
      if (error.response?.status === 403) {
        errorMessage = t('employee:create_page.message.create_fail_403');
      } else if (error.message) {
        errorMessage = error.message;
      }
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { onClick: () => navigate('/'), title: <HomeOutlined /> },
    { onClick: () => navigate('/hr/employees'), title: t('pageTitle:hr_management') },
    { onClick: () => navigate('/hr/employees'), title: t('pageTitle:employee_list') },
    { title: t('pageTitle:create_employee') }
  ];

  return (
    <PageContainer
      title={t('pageTitle:create_employee')}
      breadcrumbRender={false}
    >
      <Card>
        <EmployeeForm
          form={form}
          isEditMode={false}
          onSubmit={handleCreateEmployee as (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>}
          onCancel={() => navigate('/hr/employees')}
          loadingSubmit={submitting}
        />
      </Card>
    </PageContainer>
  );
};

export default CreateEmployeePage; 