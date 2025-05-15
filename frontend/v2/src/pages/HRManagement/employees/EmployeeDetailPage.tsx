import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { Descriptions, Tabs, Spin, Button, message, Alert, Breadcrumb, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../types';
// import { usePermissions } from '../../../../hooks/usePermissions'; // TODO: Integrate permissions

// Placeholders for tab components - to be created next
const BasicInfoTabPlaceholder: React.FC<{ employee?: Employee }> = ({ employee }) => <Descriptions title="基本信息" bordered column={2}>{employee ? Object.entries(employee).map(([key, value]) => key === 'name' || key === 'employeeId' ? null : <Descriptions.Item key={key} label={key}>{String(value)}</Descriptions.Item> ) : <Descriptions.Item>加载中...</Descriptions.Item>}</Descriptions>;
const JobInfoTabPlaceholder: React.FC<{ employee?: Employee }> = ({ employee }) => <Descriptions title="职位信息" bordered column={2}>{employee ? <Descriptions.Item label="职位相关">详情待实现</Descriptions.Item> : <Descriptions.Item>加载中...</Descriptions.Item>}</Descriptions>;
const JobHistoryTabPlaceholder: React.FC<{ employeeId?: string }> = ({ employeeId }) => <div>职位历史记录表格 (员工ID: {employeeId}) - 待实现</div>;
const ContractInfoTabPlaceholder: React.FC<{ employeeId?: string }> = ({ employeeId }) => <div>合同信息表格 (员工ID: {employeeId}) - 待实现</div>;
const CompensationHistoryTabPlaceholder: React.FC<{ employeeId?: string }> = ({ employeeId }) => <div>薪酬历史表格 (员工ID: {employeeId}) - 待实现</div>;
const LeaveBalanceTabPlaceholder: React.FC<{ employeeId?: string }> = ({ employeeId }) => <div>假期余额 (员工ID: {employeeId}) - 待实现</div>;


const EmployeeDetailPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  // const { hasPermission } = usePermissions(); // TODO: Integrate permissions

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basicInfo');

  useEffect(() => {
    if (!employeeId) {
      message.error('未找到员工ID');
      navigate('/hr/employees'); // Navigate back to list if no ID
      return;
    }

    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual API call: employeeService.getEmployeeById
        const data = await employeeService.getEmployeeById(employeeId);
        if (data) {
          setEmployee(data);
        } else {
          setError('未找到员工信息。');
          message.error('未找到员工信息。');
        }
      } catch (err) {
        console.error('获取员工详情失败:', err);
        setError('获取员工详情失败，请稍后重试。');
        message.error('获取员工详情失败!');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, navigate]);

  const handleEdit = () => {
    if (employeeId) {
      navigate(`/hr/employees/edit/${employeeId}`);
    }
  };
  
  const pageHeaderExtra = (
    <Button
      key="edit"
      type="primary"
      icon={<EditOutlined />}
      onClick={handleEdit}
      // disabled={!hasPermission('employee:edit')} // TODO: Enable with permissions
    >
      编辑
    </Button>
  );

  const breadcrumbItems = [
    { title: <Link to="/hr/employees">员工档案</Link> },
    { title: employee ? employee.name : (employeeId || '员工详情') },
  ];

  if (loading) {
    return (
      <PageContainer title="加载中...">
        <Spin size="large" style={{ display: 'block', marginTop: '50px' }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="错误">
        <Alert message="错误" description={error} type="error" showIcon />
        <Button onClick={() => navigate('/hr/employees')} style={{ marginTop: 16 }}>
          返回列表
        </Button>
      </PageContainer>
    );
  }

  if (!employee) {
     return (
      <PageContainer title="未找到员工">
        <Alert message="信息" description="无法加载员工数据。" type="info" showIcon />
        <Button onClick={() => navigate('/hr/employees')} style={{ marginTop: 16 }}>
          返回列表
        </Button>
      </PageContainer>
    );
  }

  const tabItems = [
    {
      key: 'basicInfo',
      label: '基本信息',
      children: <BasicInfoTabPlaceholder employee={employee} />,
    },
    {
      key: 'jobInfo',
      label: '职位信息',
      children: <JobInfoTabPlaceholder employee={employee} />,
    },
    {
      key: 'jobHistory',
      label: '工作经历',
      // disabled: !hasPermission('employee:view_job_history'), // TODO: Permission
      children: <JobHistoryTabPlaceholder employeeId={employee.id} />,
    },
    {
      key: 'contracts',
      label: '合同信息',
      // disabled: !hasPermission('employee:view_contracts'), // TODO: Permission
      children: <ContractInfoTabPlaceholder employeeId={employee.id} />,
    },
    {
      key: 'compensation',
      label: '薪酬历史',
      // disabled: !hasPermission('employee:view_compensation'), // TODO: Permission
      children: <CompensationHistoryTabPlaceholder employeeId={employee.id} />,
    },
    {
      key: 'leaveBalance',
      label: '假期余额',
      // disabled: !hasPermission('leave:view_balance'), // TODO: Permission
      children: <LeaveBalanceTabPlaceholder employeeId={employee.id} />,
    },
    // Optional Tabs can be added here
  ];


  return (
    <PageContainer
      title={
        <Breadcrumb items={breadcrumbItems} />
      }
      extra={pageHeaderExtra}
      content={
        <Descriptions column={2}>
          <Descriptions.Item label="员工姓名">
            <Typography.Title level={4} style={{ margin: 0 }}>{employee.name}</Typography.Title>
          </Descriptions.Item>
          <Descriptions.Item label="员工ID">{employee.employeeId}</Descriptions.Item>
        </Descriptions>
      }
      // footer={...} // Optional footer
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </PageContainer>
  );
};

export default EmployeeDetailPage; 