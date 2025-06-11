import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Typography, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import EmployeeForm, { type EmployeeFormRef } from './components/EmployeeForm';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { employeeManagementApi } from './services/employeeManagementApi';
import type { EmployeeManagementItem, UpdateEmployeeData, CreateEmployeeData } from './types';

const { Title } = Typography;

const EditEmployeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['employeeManagement', 'common']);
  const { updateEmployee } = useEmployeeManagement();

  const [employee, setEmployee] = useState<EmployeeManagementItem | null>(null);
  const [loading, setLoading] = useState(true);
  const formRef = useRef<EmployeeFormRef>(null);

  // 获取员工详情
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await employeeManagementApi.getEmployeeById(id);
        setEmployee(data);
      } catch (error) {
        console.error('获取员工详情失败:', error);
        message.error('获取员工详情失败');
        navigate('/employee-management/list');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, navigate]);

  // 处理表单提交
  const handleSubmit = async (values: UpdateEmployeeData | CreateEmployeeData) => {
    if (!id) return;

    try {
      await updateEmployee(id, values as UpdateEmployeeData);
      message.success('员工更新成功');
      navigate(`/employee-management/${id}`);
    } catch (error) {
      console.error('更新员工失败:', error);
    }
  };

  // 手动触发保存
  const handleSave = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>员工不存在</Title>
        <Button onClick={() => navigate('/employee-management/list')}>
          返回员工列表
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(`/employee-management/${id}`)}
            >
              返回详情
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              编辑员工 - {employee.full_name}
            </Title>
          </Space>
          <Space>
            <Button onClick={() => navigate(`/employee-management/${id}`)}>
              取消
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              保存
            </Button>
          </Space>
        </div>
      </Card>

      {/* 员工表单 */}
      <EmployeeForm
        mode="edit"
        initialValues={employee}
        onSubmit={handleSubmit}
        ref={formRef}
      />
    </div>
  );
};

export default EditEmployeePage; 