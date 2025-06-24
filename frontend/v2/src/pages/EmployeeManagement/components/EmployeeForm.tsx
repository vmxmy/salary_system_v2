import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  Switch,
  InputNumber,
  Space,
  Divider,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { employeeManagementApi } from '../services/employeeManagementApi';
import type {
  EmployeeManagementItem,
  CreateEmployeeData,
  UpdateEmployeeData,
} from '../types';

const { Title } = Typography;
const { TextArea } = Input;

interface EmployeeFormProps {
  initialValues?: Partial<EmployeeManagementItem>;
  onSubmit: (values: CreateEmployeeData | UpdateEmployeeData) => Promise<void>;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export interface EmployeeFormRef {
  submit: () => void;
  getForm: () => any;
}

interface LookupOption {
  id: number;
  value: string;
  label: string;
  is_active: boolean;
}

interface SelectOption {
  id: number;
  name: string;
  code: string;
}

const EmployeeForm = forwardRef<EmployeeFormRef, EmployeeFormProps>(({
  initialValues,
  onSubmit,
  loading = false,
  mode = 'create',
}, ref) => {
  const { t } = useTranslation(['employeeManagement', 'common']);
  const [form] = Form.useForm();

  // 暴露表单方法给父组件
  useImperativeHandle(ref, () => ({
    submit: () => form.submit(),
    getForm: () => form,
  }), [form]);

  // 下拉选项数据
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [personnelCategories, setPersonnelCategories] = useState<SelectOption[]>([]);
  const [positions, setPositions] = useState<SelectOption[]>([]);
  const [genderOptions, setGenderOptions] = useState<LookupOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<LookupOption[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<LookupOption[]>([]);
  const [educationLevelOptions, setEducationLevelOptions] = useState<LookupOption[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<LookupOption[]>([]);
  const [politicalStatusOptions, setPoliticalStatusOptions] = useState<LookupOption[]>([]);
  const [contractTypeOptions, setContractTypeOptions] = useState<LookupOption[]>([]);
  const [salaryLevelOptions, setSalaryLevelOptions] = useState<LookupOption[]>([]);
  const [salaryGradeOptions, setSalaryGradeOptions] = useState<LookupOption[]>([]);
  const [jobPositionLevelOptions, setJobPositionLevelOptions] = useState<LookupOption[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(false);

  // 加载下拉选项数据
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [
          departmentsData,
          personnelCategoriesData,
          positionsData,
          genderData,
          statusData,
          employmentTypeData,
          educationLevelData,
          maritalStatusData,
          politicalStatusData,
          contractTypeData,
          salaryLevelData,
          salaryGradeData,
          jobPositionLevelData,
        ] = await Promise.all([
          employeeManagementApi.getDepartments(),
          employeeManagementApi.getPersonnelCategories(),
          employeeManagementApi.getPositions(),
          employeeManagementApi.getLookupValues('GENDER'),
          employeeManagementApi.getLookupValues('EMPLOYEE_STATUS'),
          employeeManagementApi.getLookupValues('EMPLOYMENT_TYPE'),
          employeeManagementApi.getLookupValues('EDUCATION_LEVEL'),
          employeeManagementApi.getLookupValues('MARITAL_STATUS'),
          employeeManagementApi.getLookupValues('POLITICAL_STATUS'),
          employeeManagementApi.getLookupValues('CONTRACT_TYPE'),
          employeeManagementApi.getLookupValues('SALARY_LEVEL'),
          employeeManagementApi.getLookupValues('SALARY_GRADE'),
          employeeManagementApi.getLookupValues('JOB_POSITION_LEVEL'),
        ]);

        setDepartments(departmentsData);
        setPersonnelCategories(personnelCategoriesData);
        setPositions(positionsData);
        setGenderOptions(genderData);
        setStatusOptions(statusData);
        setEmploymentTypeOptions(employmentTypeData);
        setEducationLevelOptions(educationLevelData);
        setMaritalStatusOptions(maritalStatusData);
        setPoliticalStatusOptions(politicalStatusData);
        setContractTypeOptions(contractTypeData);
        setSalaryLevelOptions(salaryLevelData);
        setSalaryGradeOptions(salaryGradeData);
        setJobPositionLevelOptions(jobPositionLevelData);
      } catch (error) {
        console.error('加载下拉选项失败:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // 当部门变化时，更新人员类别选项
  const handleDepartmentChange = async (departmentId: number) => {
    try {
      const personnelCategoriesData = await employeeManagementApi.getPersonnelCategories(departmentId);
      setPersonnelCategories(personnelCategoriesData);
      // 清空人员类别选择
      form.setFieldValue('personnel_category_id', undefined);
    } catch (error) {
      console.error('加载人员类别失败:', error);
    }
  };

  // 设置初始值
  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        hire_date: initialValues.hire_date ? dayjs(initialValues.hire_date) : undefined,
        date_of_birth: initialValues.date_of_birth ? dayjs(initialValues.date_of_birth) : undefined,
        first_work_date: initialValues.first_work_date ? dayjs(initialValues.first_work_date) : undefined,
        career_position_level_date: initialValues.career_position_level_date ? dayjs(initialValues.career_position_level_date) : undefined,
        current_position_start_date: initialValues.current_position_start_date ? dayjs(initialValues.current_position_start_date) : undefined,
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, form]);

  // 表单提交
  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        hire_date: values.hire_date ? values.hire_date.format('YYYY-MM-DD') : undefined,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : undefined,
        first_work_date: values.first_work_date ? values.first_work_date.format('YYYY-MM-DD') : undefined,
        career_position_level_date: values.career_position_level_date ? values.career_position_level_date.format('YYYY-MM-DD') : undefined,
        current_position_start_date: values.current_position_start_date ? values.current_position_start_date.format('YYYY-MM-DD') : undefined,
      };

      if (mode === 'edit' && initialValues?.id) {
        submitData.id = initialValues.id;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('表单提交失败:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        is_active: true,
        interrupted_service_years: 0,
      }}
    >
      {/* 基本信息 */}
      <Card title={<Title level={4}>基本信息</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="employee_code"
              label="员工编号"
            >
              <Input placeholder="请输入员工编号" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="first_name"
              label="姓"
              rules={[{ required: true, message: '请输入姓' }]}
            >
              <Input placeholder="请输入姓" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="last_name"
              label="名"
              rules={[{ required: true, message: '请输入名' }]}
            >
              <Input placeholder="请输入名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="phone_number"
              label="电话号码"
            >
              <Input placeholder="请输入电话号码" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="id_number"
              label="身份证号"
            >
              <Input placeholder="请输入身份证号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="date_of_birth"
              label="出生日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="gender_lookup_value_id"
              label="性别"
            >
              <Select
                placeholder="请选择性别"
                loading={loadingOptions}
                allowClear
              >
                {genderOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="nationality"
              label="国籍"
            >
              <Input placeholder="请输入国籍" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="ethnicity"
              label="民族"
            >
              <Input placeholder="请输入民族" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="marital_status_lookup_value_id"
              label="婚姻状况"
            >
              <Select
                placeholder="请选择婚姻状况"
                loading={loadingOptions}
                allowClear
              >
                {maritalStatusOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="political_status_lookup_value_id"
              label="政治面貌"
            >
              <Select
                placeholder="请选择政治面貌"
                loading={loadingOptions}
                allowClear
              >
                {politicalStatusOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="home_address"
              label="家庭住址"
            >
              <TextArea 
                rows={3} 
                placeholder="请输入家庭住址"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="emergency_contact_name"
              label="紧急联系人"
            >
              <Input placeholder="请输入紧急联系人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="emergency_contact_phone"
              label="紧急联系人电话"
            >
              <Input placeholder="请输入紧急联系人电话" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 工作信息 */}
      <Card title={<Title level={4}>工作信息</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="hire_date"
              label="入职日期"
              rules={[{ required: true, message: '请选择入职日期' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="first_work_date"
              label="首次工作日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择首次工作日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status_lookup_value_id"
              label="员工状态"
              rules={[{ required: true, message: '请选择员工状态' }]}
            >
              <Select
                placeholder="请选择员工状态"
                loading={loadingOptions}
              >
                {statusOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="employment_type_lookup_value_id"
              label="雇佣类型"
            >
              <Select
                placeholder="请选择雇佣类型"
                loading={loadingOptions}
                allowClear
              >
                {employmentTypeOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="contract_type_lookup_value_id"
              label="合同类型"
            >
              <Select
                placeholder="请选择合同类型"
                loading={loadingOptions}
                allowClear
              >
                {contractTypeOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="education_level_lookup_value_id"
              label="教育水平"
            >
              <Select
                placeholder="请选择教育水平"
                loading={loadingOptions}
                allowClear
              >
                {educationLevelOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="department_id"
              label="部门"
            >
              <Select
                placeholder="请选择部门"
                loading={loadingOptions}
                allowClear
                onChange={handleDepartmentChange}
              >
                {departments.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="personnel_category_id"
              label="人员类别"
            >
              <Select
                placeholder="请选择人员类别"
                loading={loadingOptions}
                allowClear
              >
                {personnelCategories.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="actual_position_id"
              label="职位"
            >
              <Select
                placeholder="请选择职位"
                loading={loadingOptions}
                allowClear
              >
                {positions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="current_position_start_date"
              label="当前职位开始日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择当前职位开始日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="career_position_level_date"
              label="职位等级日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择职位等级日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="interrupted_service_years"
              label="中断服务年限"
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0}
                max={50}
                precision={1}
                placeholder="请输入中断服务年限"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 薪资等级信息 */}
      <Card title={<Title level={4}>薪资等级信息</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="salary_level_lookup_value_id"
              label="薪资等级"
            >
              <Select
                placeholder="请选择薪资等级"
                loading={loadingOptions}
                allowClear
              >
                {salaryLevelOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="salary_grade_lookup_value_id"
              label="薪资档次"
            >
              <Select
                placeholder="请选择薪资档次"
                loading={loadingOptions}
                allowClear
              >
                {salaryGradeOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="job_position_level_lookup_value_id"
              label="职位等级"
            >
              <Select
                placeholder="请选择职位等级"
                loading={loadingOptions}
                allowClear
              >
                {jobPositionLevelOptions.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="social_security_client_number"
              label="社保客户号"
            >
              <Input placeholder="请输入社保客户号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="housing_fund_client_number"
              label="公积金客户号"
            >
              <Input placeholder="请输入公积金客户号" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 状态设置 */}
      <Card title={<Title level={4}>状态设置</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="is_active"
              label="是否激活"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
});

EmployeeForm.displayName = 'EmployeeForm';

export default EmployeeForm; 