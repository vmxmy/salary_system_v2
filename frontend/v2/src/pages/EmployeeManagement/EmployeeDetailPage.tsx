import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Spin,
  message,
  Tag,
  Divider,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { employeeManagementApi } from './services/employeeManagementApi';
import type { EmployeeManagementItem } from './types';

const { Title } = Typography;

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['employeeManagement', 'common']);

  const [employee, setEmployee] = useState<EmployeeManagementItem | null>(null);
  const [loading, setLoading] = useState(true);

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

  // 状态标签颜色
  const getStatusColor = (status: string): string => {
    const statusColorMap: { [key: string]: string } = {
      '在职': 'green',
      '离职': 'red',
      '试用': 'blue',
      '停薪': 'orange',
      '退休': 'gray',
    };
    return statusColorMap[status] || 'default';
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/employee-management/list')}
              >
                返回列表
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                员工详情 - {employee.full_name}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/employee-management/${employee.id}/edit`)}
              >
                编辑员工
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 基本信息 */}
      <Card
        title={
          <Space>
            <UserOutlined />
            基本信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="员工编号">
            {employee.employee_code || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="姓名">
            {employee.full_name}
          </Descriptions.Item>
          <Descriptions.Item label="身份证号">
            {employee.id_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="出生日期">
            {employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="性别">
            {employee.gender || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="国籍">
            {employee.nationality || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="民族">
            {employee.ethnicity || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="婚姻状况">
            {employee.marital_status || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="政治面貌">
            {employee.political_status || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="教育水平">
            {employee.education_level || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 联系信息 */}
      <Card
        title={
          <Space>
            <PhoneOutlined />
            联系信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="邮箱" span={2}>
            {employee.email ? (
              <Space>
                <MailOutlined />
                <a href={`mailto:${employee.email}`}>{employee.email}</a>
              </Space>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="电话号码">
            {employee.phone_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="紧急联系人">
            {employee.emergency_contact_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="紧急联系人电话">
            {employee.emergency_contact_phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="家庭住址" span={2}>
            {employee.home_address ? (
              <Space>
                <HomeOutlined />
                {employee.home_address}
              </Space>
            ) : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 工作信息 */}
      <Card
        title={
          <Space>
            <BankOutlined />
            工作信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="入职日期">
            {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="首次工作日期">
            {employee.first_work_date ? new Date(employee.first_work_date).toLocaleDateString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="员工状态">
            <Tag color={getStatusColor(employee.status || '')}>
              {employee.status || '-'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="雇佣类型">
            {employee.employment_type || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="合同类型">
            {employee.contract_type || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="部门">
            {employee.departmentName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="人员类别">
            {employee.personnelCategoryName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="职位">
            {employee.actualPositionName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="当前职位开始日期">
            {employee.current_position_start_date ? new Date(employee.current_position_start_date).toLocaleDateString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="职位等级日期">
            {employee.career_position_level_date ? new Date(employee.career_position_level_date).toLocaleDateString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="中断服务年限">
            {employee.interrupted_service_years ? `${employee.interrupted_service_years} 年` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="是否激活">
            <Tag color={employee.is_active ? 'green' : 'red'}>
              {employee.is_active ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 薪资信息 */}
      <Card
        title="薪资等级信息"
        style={{ marginBottom: 16 }}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="薪资等级">
            {employee.salary_level_lookup_value_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="薪资档次">
            {employee.salary_grade_lookup_value_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="职位等级">
            {employee.job_position_level_lookup_value_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="参考薪资等级">
            {employee.ref_salary_level_lookup_value_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="社保客户号">
            {employee.social_security_client_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="公积金客户号">
            {employee.housing_fund_client_number || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 系统信息 */}
      <Card title="系统信息">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="创建时间">
            {employee.created_at ? new Date(employee.created_at).toLocaleString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {employee.updated_at ? new Date(employee.updated_at).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default EmployeeDetailPage; 