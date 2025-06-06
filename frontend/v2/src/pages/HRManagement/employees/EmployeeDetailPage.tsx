import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { 
  Descriptions, 
  Card, 
  Spin, 
  Button, 
  message, 
  Alert, 
  Breadcrumb, 
  Typography, 
  Tag, 
  Space,
  Tabs,
  Row,
  Col
} from 'antd';
import { 
  HomeOutlined, 
  EditOutlined, 
  ArrowLeftOutlined,
  UserOutlined,
  BankOutlined,
  ContactsOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import TableActionButton from '../../../components/common/TableActionButton';
import { employeeService } from '../../../services/employeeService';
import type { Employee } from '../types';
import { useLookupMaps, type LookupMaps } from '../../../hooks/useLookupMaps';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface EmployeeDetailPageProps {}

const EmployeeDetailPage: React.FC<EmployeeDetailPageProps> = () => {
  const { t } = useTranslation(['employee', 'common', 'hr']);
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { lookupMaps, loadingLookups: lookupsLoading } = useLookupMaps();

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails();
    } else {
      setError('员工ID无效');
      setLoading(false);
    }
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await employeeService.getEmployeeById(employeeId);
      setEmployee(data);
    } catch (err: any) {
      console.error('获取员工详情失败:', err);
      const errorMsg = err.response?.data?.detail?.error?.message || 
                       err.response?.data?.detail?.message || 
                       err.message || 
                       '获取员工详情失败';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (employeeId) {
      navigate(`/hr/employees/${employeeId}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/hr/employees');
  };

  const getLookupLabel = (lookupValueId: number | null | undefined, lookupType: keyof LookupMaps): string => {
    if (!lookupValueId || !lookupMaps) return '未设置';
    const map = lookupMaps[lookupType] as Map<number, string> | undefined;
    const label = map?.get(lookupValueId);
    return label || '未设置';
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '未设置';
    try {
      return dayjs(date).format('YYYY-MM-DD');
    } catch {
      return '格式错误';
    }
  };

  const calculateSeniority = (hireDate: string | null | undefined): string => {
    if (!hireDate) return '未设置';
    
    try {
      const hire = dayjs(hireDate);
      const now = dayjs();
      
      const years = now.diff(hire, 'year');
      const months = now.diff(hire.add(years, 'year'), 'month');
      
      if (years > 0) {
        return `${years}年${months}个月`;
      }
      return `${months}个月`;
    } catch {
      return '计算错误';
    }
  };

  const getEmployeeDisplayName = (emp: Employee | null): string => {
    if (!emp) return '未知员工';
    const nameParts = [emp.last_name, emp.first_name].filter(Boolean);
    return nameParts.length > 0 ? nameParts.join('') : (emp.employee_code || '未知员工');
  };

  const getStatusTag = (statusId: number | null | undefined): React.ReactNode => {
    if (!statusId || !lookupMaps) return <Tag>未设置</Tag>;
    
    const statusLabel = lookupMaps.statusMap?.get(statusId);
    if (!statusLabel) return <Tag>未知状态</Tag>;
    
    // 根据状态显示不同颜色的标签
    const statusCode = statusLabel.toLowerCase();
    let color = 'default';
    
    if (statusCode.includes('active') || statusCode.includes('在职')) {
      color = 'green';
    } else if (statusCode.includes('probation') || statusCode.includes('试用')) {
      color = 'orange';
    } else if (statusCode.includes('terminated') || statusCode.includes('离职')) {
      color = 'red';
    } else if (statusCode.includes('leave') || statusCode.includes('休假')) {
      color = 'blue';
    }
    
    return <Tag color={color}>{statusLabel}</Tag>;
  };

  // 基本信息标签页内容
  const BasicInfoTab: React.FC = () => (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Card title="基本个人信息" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="姓名">
              {getEmployeeDisplayName(employee)}
            </Descriptions.Item>
            <Descriptions.Item label="员工编号">
              {employee?.employee_code || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {employee?.id_number || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="性别">
              {getLookupLabel(employee?.gender_lookup_value_id, 'genderMap')}
            </Descriptions.Item>
            <Descriptions.Item label="出生日期">
              {formatDate(employee?.date_of_birth as string)}
            </Descriptions.Item>
            <Descriptions.Item label="国籍">
              {employee?.nationality || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="民族">
              {employee?.ethnicity || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="学历">
              {getLookupLabel(employee?.education_level_lookup_value_id, 'educationLevelMap')}
            </Descriptions.Item>
            <Descriptions.Item label="婚姻状况">
              {getLookupLabel(employee?.marital_status_lookup_value_id, 'maritalStatusMap')}
            </Descriptions.Item>
            <Descriptions.Item label="政治面貌">
              {getLookupLabel(employee?.political_status_lookup_value_id, 'politicalStatusMap')}
            </Descriptions.Item>
            <Descriptions.Item label="员工状态">
              {getStatusTag(employee?.status_lookup_value_id)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      
      <Col span={24}>
        <Card title="联系方式" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="邮箱">
              {employee?.email || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="手机号码">
              {employee?.phone_number || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="家庭住址" span={2}>
              {employee?.home_address || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="紧急联系人">
              {employee?.emergency_contact_name || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="紧急联系电话">
              {employee?.emergency_contact_phone || '未设置'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      
      <Col span={24}>
        <Card title="银行信息" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="开户银行">
              {employee?.bank_name || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="银行账号">
              {employee?.bank_account_number || '未设置'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>
  );

  // 工作信息标签页内容
  const JobInfoTab: React.FC = () => (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Card title="岗位信息" size="small">
          <Descriptions column={2} size="small">
                         <Descriptions.Item label="所属部门">
               {employee?.departmentName || 
                (employee?.department_id && lookupMaps?.departmentMap?.get(String(employee.department_id))) ||
                '未设置'}
             </Descriptions.Item>
             <Descriptions.Item label="人员类别">
               {employee?.personnelCategoryName || 
                (employee?.personnel_category_id && lookupMaps?.personnelCategoryMap?.get(String(employee.personnel_category_id))) ||
                '未设置'}
             </Descriptions.Item>
             <Descriptions.Item label="实际职务">
               {employee?.actualPositionName || 
                (employee?.actual_position_id && lookupMaps?.positionMap?.get(String(employee.actual_position_id))) ||
                '未设置'}
             </Descriptions.Item>
             <Descriptions.Item label="职务级别">
               {employee?.jobPositionLevelName || 
                getLookupLabel(employee?.job_position_level_lookup_value_id, 'jobPositionLevelMap')}
             </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      
      <Col span={24}>
        <Card title="雇佣信息" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="入职日期">
              {formatDate(employee?.hire_date as string)}
            </Descriptions.Item>
            <Descriptions.Item label="工龄">
              {calculateSeniority(employee?.hire_date as string)}
            </Descriptions.Item>
            <Descriptions.Item label="首次参加工作时间">
              {formatDate(employee?.first_work_date as string)}
            </Descriptions.Item>
            <Descriptions.Item label="雇佣类型">
              {getLookupLabel(employee?.employment_type_lookup_value_id, 'employmentTypeMap')}
            </Descriptions.Item>
            <Descriptions.Item label="合同类型">
              {getLookupLabel(employee?.contract_type_lookup_value_id, 'contractTypeMap')}
            </Descriptions.Item>
            <Descriptions.Item label="职级确定时间">
              {formatDate(employee?.career_position_level_date as string)}
            </Descriptions.Item>
            <Descriptions.Item label="现职务开始时间">
              {formatDate(employee?.current_position_start_date as string)}
            </Descriptions.Item>
            <Descriptions.Item label="工作间断年限">
              {employee?.interrupted_service_years ? `${employee.interrupted_service_years}年` : '未设置'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>
  );

  // 工作历史标签页内容
  const JobHistoryTab: React.FC = () => (
    <Card title="工作履历" size="small">
      <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
        工作履历功能开发中...
      </div>
    </Card>
  );

  if (loading || lookupsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载员工详情中..." />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <Alert
        message="加载失败"
        description={error || '未找到员工信息'}
        type="error"
        showIcon
        style={{ margin: '24px' }}
        action={
          <Button size="small" onClick={fetchEmployeeDetails}>
            重试
          </Button>
        }
      />
    );
  }

  const breadcrumbItems = [
    {
      title: <Link to="/"><HomeOutlined /></Link>,
    },
    {
      title: <Link to="/hr/employees">人事管理</Link>,
    },
    {
      title: <Link to="/hr/employees">员工列表</Link>,
    },
    {
      title: getEmployeeDisplayName(employee),
    },
  ];

  return (
    <PageContainer
      title={
        <Space>
          <UserOutlined />
          {getEmployeeDisplayName(employee)}
        </Space>
      }
      breadcrumbRender={() => <Breadcrumb items={breadcrumbItems} />}
      extra={
        <Space>
                     <TableActionButton
             actionType="view"
             icon={<ArrowLeftOutlined />}
             onClick={handleBack}
           >
             返回列表
           </TableActionButton>
           <TableActionButton
             actionType="edit"
             type="primary"
             icon={<EditOutlined />}
             onClick={handleEdit}
           >
             编辑
           </TableActionButton>
        </Space>
      }
    >
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '24px' }}>
        <Tabs defaultActiveKey="basic" size="large">
          <TabPane tab={<Space><UserOutlined />基本信息</Space>} key="basic">
            <BasicInfoTab />
          </TabPane>
          <TabPane tab={<Space><ContactsOutlined />工作信息</Space>} key="job">
            <JobInfoTab />
          </TabPane>
          <TabPane tab={<Space><HistoryOutlined />工作履历</Space>} key="history">
            <JobHistoryTab />
          </TabPane>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default EmployeeDetailPage;