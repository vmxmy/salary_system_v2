import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, message, Typography, Breadcrumb, Spin, Alert } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import EmployeeForm from '../components/EmployeeForm';
import { employeeService } from '../../../services/employeeService';
import type { Employee, UpdateEmployeePayload, CreateEmployeePayload } from '../types'; // Import CreateEmployeePayload for casting

const { Title } = Typography;

const EditEmployeePage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();

  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      setLoadingData(true);
      setError(null);
      employeeService.getEmployeeById(employeeId)
        .then(data => {
          if (data) {
            setEmployeeData(data);
          } else {
            setError('未找到要编辑的员工信息。');
            message.error('未找到员工信息。');
          }
        })
        .catch(err => {
          console.error('加载员工信息失败:', err);
          setError('加载员工信息失败，请稍后重试。');
          message.error('加载员工信息失败!');
        })
        .finally(() => {
          setLoadingData(false);
        });
    } else {
      setError('无效的员工ID。');
      setLoadingData(false);
    }
  }, [employeeId]);

  const handleUpdateEmployee = async (values: UpdateEmployeePayload) => {
    if (!employeeId) return;
    setSubmitting(true);
    try {
      await employeeService.updateEmployee(employeeId, values);
      message.success('员工信息更新成功!');
      navigate(`/hr/employees/${employeeId}`); // Navigate to detail page
    } catch (err: any) {
      console.error('更新员工信息失败:', err);
      message.error(err.response?.data?.message || '更新员工信息失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="加载员工数据中..." /></div>;
  }

  if (error) {
    return <Alert message="错误" description={error} type="error" showIcon style={{ margin: '24px' }} />;
  }

  if (!employeeData) {
    // This case should ideally be covered by the error state if employeeId was valid but data not found
    return <Alert message="信息" description="没有可编辑的员工数据。" type="info" showIcon style={{ margin: '24px' }} />;
  }

  const employeeDisplayName = (employeeData.first_name || employeeData.last_name) ?
    [`${employeeData.first_name || ''}`, `${employeeData.last_name || ''}`].filter(Boolean).join(' ')
    : null; // Use null if no name parts found

  const breadcrumbItems = [
    { onClick: () => navigate('/'), title: <HomeOutlined /> },
    { onClick: () => navigate('/hr/employees'), title: '人事管理' },
    { onClick: () => navigate('/hr/employees'), title: '员工列表' },
    { title: employeeDisplayName ? `编辑: ${employeeDisplayName}` : '编辑员工' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }} items={breadcrumbItems} />
      <Title level={3} style={{ marginBottom: '24px' }}>
        {employeeDisplayName ? `编辑员工: ${employeeDisplayName}` : '编辑员工'}
      </Title>
      <Card>
        <EmployeeForm
          form={form}
          isEditMode={true}
          initialValues={employeeData}
          // Explicitly cast to satisfy the EmployeeForm's onSubmit prop type
          onSubmit={handleUpdateEmployee as (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>}
          onCancel={() => navigate(employeeId ? `/hr/employees/${employeeId}` : '/hr/employees')}
          loadingSubmit={submitting}
        />
      </Card>
    </div>
  );
};

export default EditEmployeePage; 