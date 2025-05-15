import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, message, Typography, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import EmployeeForm from '../components/EmployeeForm';
import { employeeService } from '../../../services/employeeService';
import type { CreateEmployeePayload, UpdateEmployeePayload } from '../types';

const { Title } = Typography;

const CreateEmployeePage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleCreateEmployee = async (values: CreateEmployeePayload) => {
    setSubmitting(true);
    try {
      const newEmployee = await employeeService.createEmployee(values);
      message.success('员工创建成功!');
      if (newEmployee && newEmployee.id) {
        navigate(`/hr/employees/${newEmployee.id}`);
      } else {
        navigate('/hr/employees');
      }
    } catch (error: any) {
      console.error('创建员工失败:', error);
      let errorMessage = '创建员工失败，请稍后重试。'; // Default message
      if (error.response?.status === 403) {
        errorMessage = '创建员工失败：您可能没有执行此操作的权限。请联系管理员。';
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
    { onClick: () => navigate('/hr/employees'), title: '人事管理' },
    { onClick: () => navigate('/hr/employees'), title: '员工列表' },
    { title: '新建员工' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }} items={breadcrumbItems} />
      <Title level={3} style={{ marginBottom: '24px' }}>新建员工</Title>
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