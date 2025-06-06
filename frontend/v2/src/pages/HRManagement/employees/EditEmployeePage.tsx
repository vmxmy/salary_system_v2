import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { message, Space, Card, Descriptions, Avatar } from 'antd';
import { 
  HomeOutlined, 
  EditOutlined, 
  ArrowLeftOutlined, 
  UserOutlined,
  ContactsOutlined,
  BankOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import {
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormDatePicker,
  ProFormTextArea,
  ProFormDigit,
  ProFormUploadButton,
  PageContainer,
  StepsForm,
  ProCard,
  ProFormGroup
} from '@ant-design/pro-components';
import dayjs from 'dayjs';

import { employeeService } from '../../../services/employeeService';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import type { Employee, UpdateEmployeePayload } from '../types';
import TableActionButton from '../../../components/common/TableActionButton';

const EditEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { lookupMaps, rawLookups, loadingLookups } = useLookupMaps();

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      const data = await employeeService.getEmployeeById(employeeId);
      setEmployee(data);
    } catch (error: any) {
      console.error('获取员工信息失败:', error);
      message.error('获取员工信息失败');
      navigate('/hr/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (values: Record<string, any>) => {
    if (!employeeId || !employee) return false;
    
    setSubmitting(true);
    try {
      // 处理日期字段
      const payload: UpdateEmployeePayload = {
        ...values,
        date_of_birth: values.birth_date ? dayjs(values.birth_date).format('YYYY-MM-DD') : undefined,
        hire_date: values.entry_date ? dayjs(values.entry_date).format('YYYY-MM-DD') : undefined,
        first_work_date: values.first_work_date ? dayjs(values.first_work_date).format('YYYY-MM-DD') : undefined,
        current_position_start_date: values.current_position_start_date ? dayjs(values.current_position_start_date).format('YYYY-MM-DD') : undefined,
        career_position_level_date: values.position_level_date ? dayjs(values.position_level_date).format('YYYY-MM-DD') : undefined,
      };

      await employeeService.updateEmployee(employeeId, payload);
      message.success('员工信息更新成功');
      navigate(`/hr/employees/${employeeId}`);
      return true;
    } catch (error: any) {
      console.error('更新员工信息失败:', error);
      const errorMsg = error.response?.data?.detail?.error?.message || 
                       error.response?.data?.detail?.message || 
                       error.message || 
                       '更新员工信息失败';
      message.error(errorMsg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const getInitialValues = () => {
    if (!employee) return {};
    
    return {
      ...employee,
      birth_date: employee.date_of_birth ? dayjs(employee.date_of_birth) : null,
      entry_date: employee.hire_date ? dayjs(employee.hire_date) : null,
      first_work_date: employee.first_work_date ? dayjs(employee.first_work_date) : null,
      current_position_start_date: employee.current_position_start_date ? dayjs(employee.current_position_start_date) : null,
      position_level_date: employee.career_position_level_date ? dayjs(employee.career_position_level_date) : null,
    };
  };

  const breadcrumbProps = {
    items: [
      { path: '/', breadcrumbName: '首页' },
      { path: '/hr/employees', breadcrumbName: '员工管理' },
      { path: `/hr/employees/${employeeId}`, breadcrumbName: employee ? `${employee.last_name}${employee.first_name}` : '员工详情' },
      { breadcrumbName: '编辑' },
    ],
  };

  if (loading || loadingLookups) {
    return (
      <PageContainer loading={true} />
    );
  }

  if (!employee) {
    return (
      <PageContainer>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>未找到员工信息</p>
            <TableActionButton actionType="view" onClick={() => navigate('/hr/employees')}>
              返回列表
            </TableActionButton>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={
        <Space>
          <EditOutlined />
          编辑员工信息
        </Space>
      }
      breadcrumbRender={() => (
        <Space>
          <Link to="/"><HomeOutlined /></Link>
          <span>/</span>
          <Link to="/hr/employees">员工管理</Link>
          <span>/</span>
          <Link to={`/hr/employees/${employeeId}`}>
            {employee.last_name}{employee.first_name}
          </Link>
          <span>/</span>
          <span>编辑</span>
        </Space>
      )}
      extra={
        <TableActionButton
          actionType="view"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/hr/employees/${employeeId}`)}
        >
          返回详情
        </TableActionButton>
      }
    >
      {/* 员工基本信息预览 */}
      <ProCard style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar size={64} icon={<UserOutlined />} />
          <div>
            <h3 style={{ margin: 0 }}>{employee.last_name}{employee.first_name}</h3>
            <p style={{ margin: 0, color: '#666' }}>工号: {employee.employee_code}</p>
            <p style={{ margin: 0, color: '#666' }}>
              部门: {lookupMaps?.departmentMap?.get(String(employee.department_id)) || '未设置'}
            </p>
          </div>
        </div>
      </ProCard>

      {/* 分步表单 */}
      <StepsForm
        formProps={{
          validateMessages: {
            required: '${label}是必填项',
          },
        }}
        stepsFormRender={(stepsDom, formDom) => {
          return (
            <ProCard>
              {stepsDom}
              {formDom}
            </ProCard>
          );
        }}
        submitter={{
          render: (props, dom) => {
            return (
              <div style={{ textAlign: 'right', marginTop: 24, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <Space>
                  {props.step > 0 && (
                    <TableActionButton 
                      actionType="view" 
                      onClick={() => props.onPre?.()}
                    >
                      上一步
                    </TableActionButton>
                  )}
                  <TableActionButton 
                    actionType="view" 
                    onClick={() => navigate(`/hr/employees/${employeeId}`)}
                  >
                    取消
                  </TableActionButton>
                  {props.step < 2 ? (
                    <TableActionButton 
                      actionType="edit" 
                      onClick={() => props.onSubmit?.()}
                    >
                      下一步
                    </TableActionButton>
                  ) : (
                    <TableActionButton 
                      actionType="edit" 
                      loading={submitting} 
                      onClick={() => props.onSubmit?.()}
                    >
                      保存修改
                    </TableActionButton>
                  )}
                </Space>
              </div>
            );
          },
        }}
        onFinish={handleFinish}
      >
        {/* 第一步：基本信息 */}
        <StepsForm.StepForm
          name="basic"
          title="基本信息"
          stepProps={{
            description: '员工基础个人信息',
            icon: <IdcardOutlined />,
          }}
          initialValues={getInitialValues()}
        >
          <ProCard title="个人基础信息" bordered>
            <ProFormGroup>
              <ProFormText
                name="employee_code"
                label="工号"
                width="md"
                placeholder="请输入工号"
                rules={[{ required: true }]}
              />
              <ProFormText
                name="last_name"
                label="姓"
                width="md"
                placeholder="请输入姓"
                rules={[{ required: true }]}
              />
              <ProFormText
                name="first_name"
                label="名"
                width="md"
                placeholder="请输入名"
                rules={[{ required: true }]}
              />
            </ProFormGroup>
            
            <ProFormGroup>
              <ProFormSelect
                name="gender_lookup_value_id"
                label="性别"
                width="md"
                options={rawLookups?.genderOptions}
                placeholder="请选择性别"
              />
              <ProFormDatePicker
                name="date_of_birth"
                label="出生日期"
                width="md"
                placeholder="请选择出生日期"
              />
              <ProFormText
                name="id_card_number"
                label="身份证号"
                width="lg"
                placeholder="请输入身份证号"
              />
            </ProFormGroup>

            <ProFormGroup>
              <ProFormSelect
                name="marital_status_lookup_value_id"
                label="婚姻状况"
                width="md"
                options={rawLookups?.maritalStatusOptions}
                placeholder="请选择婚姻状况"
              />
              <ProFormSelect
                name="political_status_lookup_value_id"
                label="政治面貌"
                width="md"
                options={rawLookups?.politicalStatusOptions}
                placeholder="请选择政治面貌"
              />
              <ProFormSelect
                name="education_level_lookup_value_id"
                label="学历"
                width="md"
                options={rawLookups?.educationLevelOptions}
                placeholder="请选择学历"
              />
            </ProFormGroup>

            <ProFormTextArea
              name="home_address"
              label="地址"
              placeholder="请输入详细地址"
            />
          </ProCard>
        </StepsForm.StepForm>

        {/* 第二步：工作信息 */}
        <StepsForm.StepForm
          name="work"
          title="工作信息"
          stepProps={{
            description: '岗位和雇佣相关信息',
            icon: <ContactsOutlined />,
          }}
        >
          <ProCard title="岗位信息" bordered style={{ marginBottom: 16 }}>
            <ProFormGroup>
              <ProFormSelect
                name="department_id"
                label="所属部门"
                width="lg"
                showSearch
                options={rawLookups?.departmentOptions?.map(dept => ({
                  label: dept.name,
                  value: dept.id
                }))}
                placeholder="请选择部门"
                rules={[{ required: true }]}
              />
              <ProFormSelect
                name="personnel_category_id"
                label="人员类别"
                width="md"
                options={rawLookups?.personnelCategoryOptions?.map(cat => ({
                  label: cat.name,
                  value: cat.id
                }))}
                placeholder="请选择人员类别"
              />
            </ProFormGroup>

            <ProFormGroup>
              <ProFormSelect
                name="actual_position_id"
                label="实际职务"
                width="lg"
                showSearch
                options={rawLookups?.positionOptions?.map(pos => ({
                  label: pos.name,
                  value: pos.id
                }))}
                placeholder="请选择实际职务"
              />
              <ProFormSelect
                name="job_position_level_lookup_value_id"
                label="职务级别"
                width="md"
                options={rawLookups?.jobPositionLevelOptions}
                placeholder="请选择职务级别"
              />
            </ProFormGroup>
          </ProCard>

          <ProCard title="雇佣信息" bordered>
            <ProFormGroup>
              <ProFormSelect
                name="employment_type"
                label="雇佣类型"
                width="md"
                options={rawLookups?.employmentTypeOptions}
                placeholder="请选择雇佣类型"
              />
              <ProFormSelect
                name="employee_status"
                label="员工状态"
                width="md"
                options={rawLookups?.statusOptions}
                placeholder="请选择员工状态"
              />
              <ProFormDatePicker
                name="entry_date"
                label="入职日期"
                width="md"
                placeholder="请选择入职日期"
                rules={[{ required: true }]}
              />
            </ProFormGroup>

            <ProFormGroup>
              <ProFormDatePicker
                name="first_work_date"
                label="首次参加工作时间"
                width="md"
                placeholder="请选择首次工作时间"
              />
              <ProFormDatePicker
                name="current_position_start_date"
                label="现职务开始时间"
                width="md"
                placeholder="请选择职务开始时间"
              />
              <ProFormDatePicker
                name="position_level_date"
                label="职级确定时间"
                width="md"
                placeholder="请选择职级确定时间"
              />
            </ProFormGroup>

            <ProFormDigit
              name="work_interruption_years"
              label="工作间断年限"
              width="md"
              placeholder="请输入工作间断年限"
              fieldProps={{ precision: 2, min: 0, max: 50 }}
            />
          </ProCard>
        </StepsForm.StepForm>

        {/* 第三步：联系和银行信息 */}
        <StepsForm.StepForm
          name="contact"
          title="联系信息"
          stepProps={{
            description: '联系方式和银行信息',
            icon: <BankOutlined />,
          }}
        >
          <ProCard title="联系方式" bordered style={{ marginBottom: 16 }}>
            <ProFormGroup>
              <ProFormText
                name="phone_number"
                label="手机号码"
                width="md"
                placeholder="请输入手机号码"
              />
              <ProFormText
                name="email"
                label="邮箱"
                width="lg"
                placeholder="请输入邮箱地址"
              />
            </ProFormGroup>
          </ProCard>

          <ProCard title="银行信息" bordered style={{ marginBottom: 16 }}>
            <ProFormGroup>
              <ProFormText
                name="bank_name"
                label="开户银行"
                width="lg"
                placeholder="请输入开户银行"
              />
              <ProFormText
                name="bank_account_number"
                label="银行账号"
                width="lg"
                placeholder="请输入银行账号"
              />
            </ProFormGroup>
          </ProCard>

          <ProCard title="紧急联系人" bordered>
            <ProFormGroup>
              <ProFormText
                name="emergency_contact_name"
                label="紧急联系人姓名"
                width="md"
                placeholder="请输入紧急联系人姓名"
              />
              <ProFormText
                name="emergency_contact_phone"
                label="紧急联系人电话"
                width="md"
                placeholder="请输入紧急联系人电话"
              />
              <ProFormText
                name="emergency_contact_relationship"
                label="关系"
                width="md"
                placeholder="请输入与紧急联系人关系"
              />
            </ProFormGroup>
          </ProCard>
        </StepsForm.StepForm>
      </StepsForm>
    </PageContainer>
  );
};

export default EditEmployeePage;