import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { message, Space, Alert } from 'antd';
import type { Dayjs } from 'dayjs'; // 导入 Dayjs 类型
import {
  HomeOutlined,
  UserAddOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  ContactsOutlined,
  BankOutlined,
  IdcardOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import {
  ProFormText,
  ProFormSelect,
  ProFormDatePicker,
  ProFormTextArea,
  ProFormDigit,
  PageContainer,
  StepsForm,
  ProCard,
  ProFormGroup,
  ProDescriptions
} from '@ant-design/pro-components';
import dayjs from 'dayjs';

import { employeeService } from '../../../services/employeeService';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import type { CreateEmployeePayload } from '../types';
import TableActionButton from '../../../components/common/TableActionButton';

const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [current, setCurrent] = useState(0);

  const { lookupMaps, rawLookups, loadingLookups } = useLookupMaps();

  // 包装函数来处理 StepsForm 的 onCurrentChange
  const handleStepChange = (newCurrent: number) => {
    setCurrent(newCurrent);
  };

  const handleFinish = async (values: Record<string, any>) => {
    setSubmitting(true);
    try {
      // 处理日期字段转换和字段映射
      const payload: CreateEmployeePayload = {
        // 基本信息字段映射
        first_name: values.first_name, // 确保姓名字段被正确映射
        last_name: values.last_name,
        employee_code: values.employee_code || null, // 工号可以为空
        
        // 日期字段转换
        date_of_birth: values.birth_date ? dayjs(values.birth_date).format('YYYY-MM-DD') : null,
        hire_date: values.entry_date ? dayjs(values.entry_date).format('YYYY-MM-DD') : null,
        first_work_date: values.first_work_date ? dayjs(values.first_work_date).format('YYYY-MM-DD') : null,
        current_position_start_date: values.current_position_start_date ? dayjs(values.current_position_start_date).format('YYYY-MM-DD') : null,
        career_position_level_date: values.position_level_date ? dayjs(values.position_level_date).format('YYYY-MM-DD') : null,
        
        // 其他字段映射
        id_number: values.id_card_number || null, // 映射 id_card_number 到 id_number
        status_lookup_value_id: values.employee_status, // 确保 status_lookup_value_id 被正确赋值
        gender_lookup_value_id: values.gender || null,
        department_id: values.department_id || null,
        actual_position_id: values.actual_position_id || null,
        personnel_category_id: values.personnel_category_id || null,
        
        // 联系信息
        email: values.email || null,
        phone_number: values.phone || null,
        home_address: values.address || null,
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        
        // 其他可选字段
        nationality: values.nationality || null,
        ethnicity: values.ethnicity || null,
        education_level_lookup_value_id: values.education_level || null,
        marital_status_lookup_value_id: values.marital_status || null,
        political_status_lookup_value_id: values.political_status || null,
        employment_type_lookup_value_id: values.employment_type || null,
        contract_type_lookup_value_id: values.contract_type || null,
        salary_level_lookup_value_id: values.salary_level || null,
        salary_grade_lookup_value_id: values.salary_grade || null,
        job_position_level_lookup_value_id: values.job_position_level || null,
        social_security_client_number: values.social_security_client_number || null,
        // housing_fund_client_number: values.housing_fund_client_number || null, // 字段暂时不支持
      };

      const newEmployee = await employeeService.createEmployee(payload);
      message.success('员工创建成功');
      
      if (newEmployee && newEmployee.id) {
        navigate(`/hr/employees/${newEmployee.id}`);
      } else {
        navigate('/hr/employees');
      }
      return true;
    } catch (error: any) {
      console.error('创建员工失败:', error);
      const errorMsg = error.response?.data?.detail?.error?.message || 
                       error.response?.data?.detail?.message || 
                       error.message || 
                       '创建员工失败';
      message.error(errorMsg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingLookups) {
    return <PageContainer loading={true} />;
  }

  return (
    <PageContainer
      title={
        <Space>
          <UserAddOutlined />
          创建新员工
        </Space>
      }
      breadcrumbRender={() => (
        <Space>
          <Link to="/"><HomeOutlined /></Link>
          <span>/</span>
          <Link to="/hr/employees">员工管理</Link>
          <span>/</span>
          <span>创建员工</span>
        </Space>
      )}
      extra={
        <TableActionButton
          actionType="view"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/hr/employees')}
        >
          返回列表
        </TableActionButton>
      }
    >
      {/* 创建提示 */}
      <Alert
        message="创建员工信息"
        description="请按步骤填写员工的基本信息、工作信息和联系信息。所有标记为必填的字段都需要完整填写。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 分步表单 */}
      <StepsForm
        current={current}
        onCurrentChange={handleStepChange} // 使用包装函数
        formProps={{
          validateMessages: {
            required: '${label}是必填项',
            pattern: {
              mismatch: '${label}格式不正确',
            },
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
                    onClick={() => navigate('/hr/employees')}
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
                      actionType="add" 
                      loading={submitting} 
                      onClick={() => props.onSubmit?.()}
                    >
                      创建员工
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
            description: '填写员工基础个人信息',
            icon: <IdcardOutlined />,
          }}
        >
          <ProCard title="个人基础信息" bordered>
            <ProFormGroup>
              <ProFormText
                name="employee_code"
                label="工号"
                width="md"
                placeholder="请输入工号（可选）"
                rules={[
                  { pattern: /^[A-Za-z0-9]{1,20}$/, message: '工号只能包含字母和数字，长度1-20位' }
                ]}
              />
              <ProFormText
                name="last_name"
                label="姓"
                width="md"
                placeholder="请输入姓"
                rules={[
                  { required: true },
                  { max: 50, message: '姓名长度不能超过50个字符' }
                ]}
              />
              <ProFormText
                name="first_name"
                label="名"
                width="md"
                placeholder="请输入名"
                rules={[
                  { required: true },
                  { max: 50, message: '姓名长度不能超过50个字符' }
                ]}
              />
            </ProFormGroup>
            
            <ProFormGroup>
              <ProFormSelect
                name="gender"
                label="性别"
                width="md"
                options={rawLookups?.genderOptions || []}
                placeholder="请选择性别"
                rules={[{ required: true }]}
              />
              <ProFormDatePicker
                name="birth_date"
                label="出生日期"
                width="md"
                placeholder="请选择出生日期"
                fieldProps={{
                  disabledDate: (current: Dayjs) => current && current > dayjs().subtract(16, 'year'),
                }}
              />
              <ProFormText
                name="id_card_number"
                label="身份证号"
                width="lg"
                placeholder="请输入身份证号"
                rules={[
                  { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号码' }
                ]}
              />
            </ProFormGroup>

            <ProFormGroup>
              <ProFormSelect
                name="marital_status"
                label="婚姻状况"
                width="md"
                options={rawLookups?.maritalStatusOptions || []}
                placeholder="请选择婚姻状况"
              />
              <ProFormSelect
                name="political_status"
                label="政治面貌"
                width="md"
                options={rawLookups?.politicalStatusOptions || []}
                placeholder="请选择政治面貌"
              />
              <ProFormSelect
                name="education_level"
                label="学历"
                width="md"
                options={rawLookups?.educationLevelOptions || []}
                placeholder="请选择学历"
              />
            </ProFormGroup>

            <ProFormTextArea
              name="address"
              label="地址"
              placeholder="请输入详细地址"
              fieldProps={{ maxLength: 200, showCount: true }}
            />
          </ProCard>
        </StepsForm.StepForm>

        {/* 第二步：工作信息 */}
        <StepsForm.StepForm
          name="work"
          title="工作信息"
          stepProps={{
            description: '设置岗位和雇佣相关信息',
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
                options={(() => {
                  // 扁平化部门树结构为选项列表
                  const flattenDepartments = (departments: any[]): Array<{label: string, value: number}> => {
                    const result: Array<{label: string, value: number}> = [];
                    
                    const processNode = (node: any, prefix = '') => {
                      if (node.value !== undefined && node.title) {
                        result.push({
                          label: prefix + node.title,
                          value: node.value
                        });
                      } else if (node.id !== undefined && node.name) {
                        result.push({
                          label: prefix + node.name,
                          value: node.id
                        });
                      }
                      
                      if (node.children && node.children.length > 0) {
                        node.children.forEach((child: any) => {
                          processNode(child, prefix + '  ');
                        });
                      }
                    };
                    
                    departments.forEach(dept => processNode(dept));
                    return result;
                  };
                  
                  return rawLookups?.departmentOptions ? flattenDepartments(rawLookups.departmentOptions) : [];
                })()}
                placeholder="请选择部门"
                rules={[{ required: true }]}
              />
              <ProFormSelect
                name="personnel_category_id"
                label="人员类别"
                width="md"
                options={(() => {
                  // 扁平化人员类别树结构为选项列表
                  const flattenPersonnelCategories = (categories: any[]): Array<{label: string, value: number}> => {
                    const result: Array<{label: string, value: number}> = [];
                    
                    const processNode = (node: any, prefix = '') => {
                      if (node.value !== undefined && node.title) {
                        result.push({
                          label: prefix + node.title,
                          value: node.value
                        });
                      } else if (node.id !== undefined && node.name) {
                        result.push({
                          label: prefix + node.name,
                          value: node.id
                        });
                      }
                      
                      if (node.children && node.children.length > 0) {
                        node.children.forEach((child: any) => {
                          processNode(child, prefix + '  ');
                        });
                      }
                    };
                    
                    categories.forEach(cat => processNode(cat));
                    return result;
                  };
                  
                  return rawLookups?.personnelCategoryOptions ? flattenPersonnelCategories(rawLookups.personnelCategoryOptions) : [];
                })()}
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
                })) || []}
                placeholder="请选择实际职务"
              />
              <ProFormSelect
                name="job_position_level_lookup_value_id"
                label="职务级别"
                width="md"
                options={rawLookups?.jobPositionLevelOptions || []}
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
                options={rawLookups?.employmentTypeOptions || []}
                placeholder="请选择雇佣类型"
              />
              <ProFormSelect
                name="employee_status"
                label="员工状态"
                width="md"
                options={rawLookups?.statusOptions || []}
                placeholder="请选择员工状态"
                initialValue={rawLookups?.statusOptions?.find(status => status.label === '在职')?.value || 21} // 动态获取"在职"状态ID
              />
              <ProFormDatePicker
                name="entry_date"
                label="入职日期"
                width="md"
                placeholder="请选择入职日期"
                rules={[{ required: true }]}
                fieldProps={{
                  disabledDate: (current: Dayjs) => current && current > dayjs(),
                }}
              />
            </ProFormGroup>

            <ProFormGroup>
              <ProFormDatePicker
                name="first_work_date"
                label="首次参加工作时间"
                width="md"
                placeholder="请选择首次工作时间"
                fieldProps={{
                  disabledDate: (current: Dayjs) => current && current > dayjs(),
                }}
              />
              <ProFormDatePicker
                name="current_position_start_date"
                label="现职务开始时间"
                width="md"
                placeholder="请选择职务开始时间"
                fieldProps={{
                  disabledDate: (current: Dayjs) => current && current > dayjs(),
                }}
              />
              <ProFormDatePicker
                name="position_level_date"
                label="职级确定时间"
                width="md"
                placeholder="请选择职级确定时间"
                fieldProps={{
                  disabledDate: (current: Dayjs) => current && current > dayjs(),
                }}
              />
            </ProFormGroup>

            <ProFormDigit
              name="work_interruption_years"
              label="工作间断年限"
              width="md"
              placeholder="请输入工作间断年限"
              fieldProps={{ precision: 2, min: 0, max: 50 }}
              extra="工作期间因各种原因中断的总年限，支持小数"
            />
          </ProCard>
        </StepsForm.StepForm>

        {/* 第三步：联系和银行信息 */}
        <StepsForm.StepForm
          name="contact"
          title="联系信息"
          stepProps={{
            description: '完善联系方式和银行信息',
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
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                ]}
              />
              <ProFormText
                name="email"
                label="邮箱"
                width="lg"
                placeholder="请输入邮箱地址"
                rules={[
                  { type: 'email', message: '请输入正确的邮箱格式' }
                ]}
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
                rules={[
                  { pattern: /^\d{16,19}$/, message: '银行账号应为16-19位数字' }
                ]}
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
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                ]}
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

export default CreateEmployeePage; 