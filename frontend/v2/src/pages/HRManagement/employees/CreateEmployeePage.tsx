import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, message, Typography, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EmployeeForm from '../components/EmployeeForm';
import { employeeService } from '../../../services/employeeService';
import type { CreateEmployeePayload, UpdateEmployeePayload } from '../types';

const { Title } = Typography;

const CreateEmployeePage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleCreateEmployee = async (values: CreateEmployeePayload) => {
    setSubmitting(true);
    try {
      const newEmployee = await employeeService.createEmployee(values);
      message.success(t('create_employee_page.message_create_success'));
      if (newEmployee && newEmployee.id) {
        navigate(`/hr/employees/${newEmployee.id}`);
      } else {
        navigate('/hr/employees');
      }
    } catch (error: any) {
      console.error(t('create_employee_page.message_create_fail_default'), error);
      let errorMessage = t('create_employee_page.message_create_fail_default');
      if (error.response?.status === 403) {
        errorMessage = t('create_employee_page.message_create_fail_403');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { onClick: () => navigate('/'), title: <HomeOutlined /> },
    { onClick: () => navigate('/hr/employees'), title: t('page_title.hr_management') },
    { onClick: () => navigate('/hr/employees'), title: t('page_title.employee_list') },
    { title: t('page_title.create_employee') }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }} items={breadcrumbItems} />
      <Title level={3} style={{ marginBottom: '24px' }}>{t('page_title.create_employee')}</Title>
      <Card>
        <EmployeeForm
          form={form}
          isEditMode={false}
          onSubmit={handleCreateEmployee as (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>}
          onCancel={() => navigate('/hr/employees')}
          loadingSubmit={submitting}
        />
      </Card>
    </div>
  );
};

export default CreateEmployeePage; 