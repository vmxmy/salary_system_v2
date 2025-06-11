import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import EmployeeForm from './components/EmployeeForm';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import type { CreateEmployeeData } from './types';

const { Title } = Typography;

const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['employeeManagement', 'common']);
  const { createEmployee } = useEmployeeManagement();
  const [form, setForm] = React.useState<any>(null);

  // 处理表单提交
  const handleSubmit = async (values: CreateEmployeeData) => {
    try {
      await createEmployee(values);
      message.success('员工创建成功');
      navigate('/employee-management/list');
    } catch (error) {
      console.error('创建员工失败:', error);
    }
  };

  // 保存表单引用
  const handleFormRef = (formInstance: any) => {
    setForm(formInstance);
  };

  // 手动触发保存
  const handleSave = () => {
    if (form) {
      form.submit();
    }
  };

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
              onClick={() => navigate('/employee-management/list')}
            >
              返回列表
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              新增员工
            </Title>
          </Space>
          <Space>
            <Button onClick={() => navigate('/employee-management/list')}>
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
        mode="create"
        onSubmit={handleSubmit}
        ref={handleFormRef}
      />
    </div>
  );
};

export default CreateEmployeePage; 