import React, { useState, useEffect, useMemo } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Tabs, message, Spin } from 'antd';
import type { TabsProps } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

// API服务
import { configApi } from '../../api/config';
import { optimizedApi } from '../../api/optimizedApi';
import apiClient from '../../api/apiClient';

// 类型定义
interface EmployeeFormProps {
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

interface LookupOption {
  value: number;
  label: string;
}

const { Option } = Select;

/**
 * 员工表单组件
 * 支持创建和编辑模式
 */
const EmployeeForm = React.forwardRef<any, EmployeeFormProps>(({
  initialValues,
  onSubmit,
  loading = false,
  mode = 'create'
}, ref) => {
  const { t } = useTranslation(['employee', 'common']);
  const [form] = Form.useForm();
  
  // 暴露表单实例给父组件
  React.useImperativeHandle(ref, () => ({
    submit: async () => {
      try {
        // 先进行表单验证
        const values = await form.validateFields();
        console.log('✅ 表单验证通过:', values);
        await handleFinish(values);
      } catch (errorInfo) {
        console.log('❌ 表单验证失败:', errorInfo);
        
        // 提取具体的错误信息
        if (errorInfo.errorFields && errorInfo.errorFields.length > 0) {
          const errors = errorInfo.errorFields.map(field => {
            const fieldName = field.name?.[0];
            const errorMessage = field.errors?.[0];
            return `${fieldName}: ${errorMessage}`;
          });
          console.log('所有验证失败字段:', errors);
          
          const firstError = errorInfo.errorFields[0];
          const errorMessage = firstError.errors?.[0];
          message.error(`${errorMessage || '请检查必填字段'}`);
        } else {
          message.error('表单验证失败，请检查必填字段');
        }
      }
    },
    reset: () => {
      form.resetFields();
    },
    getFieldsValue: () => {
      return form.getFieldsValue();
    }
  }));
  
  // 状态管理
  const [dataLoading, setDataLoading] = useState(true);
  const [departments, setDepartments] = useState<LookupOption[]>([]);
  const [positions, setPositions] = useState<LookupOption[]>([]);
  const [personnelCategories, setPersonnelCategories] = useState<LookupOption[]>([]);
  const [lookupValues, setLookupValues] = useState<Record<string, LookupOption[]>>({});

  // 需要加载的查找值类型（只使用后端支持的公共类型）
  const lookupTypes = useMemo(() => [
    'GENDER',
    'EMPLOYEE_STATUS',
    'EMPLOYMENT_TYPE',
    'EDUCATION_LEVEL',
    'MARITAL_STATUS',
    'POLITICAL_STATUS',
    'CONTRACT_TYPE',
    'JOB_POSITION_LEVEL'
  ], []);

  // 加载基础数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        
        // 并行加载所有数据
        const [hrData, positionsRes, ...lookupResponses] = await Promise.all([
          optimizedApi.getHRBasicDataOptimized(),
          // 从positions API获取职位数据
          apiClient.get('/positions?size=1000').catch((error) => {
            console.warn('⚠️ 职位API调用失败:', error);
            return { data: { data: [] } };
          }),
          ...lookupTypes.map(type => configApi.getLookupValues({ lookup_type_code: type, page: 1, size: 100 }))
        ]);

        // 处理部门数据
        setDepartments(hrData.departments.map((dept: any) => ({
          value: dept.id,
          label: dept.name
        })));

        // 处理职位数据
        if (positionsRes && positionsRes.data && positionsRes.data.data && Array.isArray(positionsRes.data.data)) {
          setPositions(positionsRes.data.data.map((pos: any) => ({
            value: pos.id,
            label: pos.name
          })));
        } else {
          console.warn('⚠️ 职位数据获取失败或格式错误:', positionsRes);
          setPositions([]);
        }

        // 处理人员类别数据
        setPersonnelCategories(hrData.personnelCategories.map((cat: any) => ({
          value: cat.id,
          label: cat.name
        })));

        // 处理查找值数据
        const lookupData: Record<string, LookupOption[]> = {};
        lookupTypes.forEach((type, index) => {
          if (lookupResponses[index] && lookupResponses[index].data && lookupResponses[index].data.data) {
            lookupData[type] = lookupResponses[index].data.data.map((item: any) => ({
              value: item.id,
              label: item.name || item.code || ''  // 后端返回的是name字段作为显示名称
            }));
            console.log(`✅ 加载lookup ${type}:`, lookupData[type].length, '项');
          } else {
            console.warn(`⚠️ lookup ${type} 数据获取失败:`, lookupResponses[index]);
            lookupData[type] = [];
          }
        });
        setLookupValues(lookupData);

        // 为新建员工设置默认的员工状态为"在职"
        if (mode === 'create') {
          const employeeStatusOptions = lookupData.EMPLOYEE_STATUS || [];
          const activeStatus = employeeStatusOptions.find(s => s.label === '在职' || s.label === 'ACTIVE');
          if (activeStatus) {
            form.setFieldValue('status_lookup_value_id', activeStatus.value);
          }
        }

        // 添加总体数据加载情况的日志
        console.log('📊 员工表单数据加载完成:', {
          departments: hrData.departments?.length || 0,
          positions: positionsRes?.data?.data?.length || 0, 
          personnelCategories: hrData.personnelCategories?.length || 0,
          lookupTypes: Object.keys(lookupData).map(key => `${key}:${lookupData[key].length}`).join(', ')
        });

      } catch (error) {
        console.error('Failed to load form data:', error);
        message.error(t('employee:loadDataError'));
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [t, lookupTypes]);

  // 设置初始值
  useEffect(() => {
    if (initialValues && mode === 'edit') {
      const formValues = {
        ...initialValues,
        date_of_birth: initialValues.date_of_birth ? dayjs(initialValues.date_of_birth) : undefined,
        hire_date: initialValues.hire_date ? dayjs(initialValues.hire_date) : undefined,
        first_work_date: initialValues.first_work_date ? dayjs(initialValues.first_work_date) : undefined,
        career_position_level_date: initialValues.career_position_level_date ? dayjs(initialValues.career_position_level_date) : undefined,
        current_position_start_date: initialValues.current_position_start_date ? dayjs(initialValues.current_position_start_date) : undefined,
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, mode, form]);

  // 处理表单提交
  const handleFinish = async (values: any) => {
    try {
      console.log('📝 表单原始数据:', values);
      
      // 手动验证必填字段
      const errors: string[] = [];
      
      if (!values.last_name) errors.push(t('employee:lastNameRequired'));
      if (!values.first_name) errors.push(t('employee:firstNameRequired'));
      if (!values.hire_date) errors.push(t('employee:hireDateRequired'));
      if (!values.department_id) errors.push(t('employee:departmentRequired'));
      if (!values.actual_position_id) errors.push(t('employee:positionRequired'));
      if (!values.personnel_category_id) errors.push(t('employee:personnelCategoryRequired'));
      if (!values.status_lookup_value_id) errors.push(t('employee:statusRequired'));
      
      if (errors.length > 0) {
        message.error(errors.join(', '));
        return;
      }
      
      // 转换日期格式
      const processedValues = {
        ...values,
        date_of_birth: values.date_of_birth?.format('YYYY-MM-DD'),
        hire_date: values.hire_date?.format('YYYY-MM-DD'),
        first_work_date: values.first_work_date?.format('YYYY-MM-DD'),
        career_position_level_date: values.career_position_level_date?.format('YYYY-MM-DD'),
        current_position_start_date: values.current_position_start_date?.format('YYYY-MM-DD'),
      };

      console.log('🔄 处理后的数据:', processedValues);

      await onSubmit(processedValues);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip={t('common:loading')} />
      </div>
    );
  }

  // 定义Tabs的items配置
  const tabItems: TabsProps['items'] = [
    // 基本信息
    {
      key: 'basic',
      label: t('employee:basicInfo'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="employee_code"
              label={t('employee:employeeCode')}
              rules={[{ max: 50 }]}
            >
              <Input placeholder={t('employee:autoGenerateIfEmpty')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="last_name"
              label={t('employee:lastName')}
              rules={[
                { required: true, message: t('employee:lastNameRequired') },
                { max: 100 }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="first_name"
              label={t('employee:firstName')}
              rules={[
                { required: true, message: t('employee:firstNameRequired') },
                { max: 100 }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="gender_lookup_value_id"
              label={t('employee:gender')}
            >
              <Select placeholder={t('common:pleaseSelect')} allowClear>
                {lookupValues.GENDER?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="id_number"
              label={t('employee:idNumber')}
              rules={[
                { max: 50 },
                { pattern: /^[0-9X]+$/, message: t('employee:idNumberFormat') }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="date_of_birth"
              label={t('employee:dateOfBirth')}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="nationality"
              label={t('employee:nationality')}
              rules={[{ max: 100 }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="ethnicity"
              label={t('employee:ethnicity')}
              rules={[{ max: 100 }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    },

    // 工作信息
    {
      key: 'work',
      label: t('employee:workInfo'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="hire_date"
              label={t('employee:hireDate')}
              rules={[{ required: true, message: t('employee:hireDateRequired') }]}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="department_id"
              label={t('employee:department')}
              rules={[{ required: true, message: t('employee:departmentRequired') }]}
            >
              <Select placeholder={t('common:pleaseSelect')} showSearch optionFilterProp="children">
                {departments.map(dept => (
                  <Option key={dept.value} value={dept.value}>
                    {dept.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="actual_position_id"
              label={t('employee:position')}
              rules={[{ required: true, message: t('employee:positionRequired') }]}
            >
              <Select placeholder={t('common:pleaseSelect')} showSearch optionFilterProp="children">
                {positions.map(pos => (
                  <Option key={pos.value} value={pos.value}>
                    {pos.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="personnel_category_id"
              label={t('employee:personnelCategory')}
              rules={[{ required: true, message: t('employee:personnelCategoryRequired') }]}
            >
              <Select placeholder={t('common:pleaseSelect')} showSearch optionFilterProp="children">
                {personnelCategories.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="status_lookup_value_id"
              label={t('employee:status')}
              rules={[{ required: true, message: t('employee:statusRequired') }]}
            >
              <Select placeholder={t('common:pleaseSelect')}>
                {lookupValues.EMPLOYEE_STATUS?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="employment_type_lookup_value_id"
              label={t('employee:employmentType')}
            >
              <Select placeholder={t('common:pleaseSelect')} allowClear>
                {lookupValues.EMPLOYMENT_TYPE?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="job_position_level_lookup_value_id"
              label={t('employee:jobPositionLevel')}
            >
              <Select placeholder={t('common:pleaseSelect')} allowClear>
                {lookupValues.JOB_POSITION_LEVEL?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      ),
    },

    // 联系信息
    {
      key: 'contact',
      label: t('employee:contactInfo'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="email"
              label={t('employee:email')}
              rules={[
                { type: 'email', message: t('employee:emailFormat') },
                { max: 100 }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="phone_number"
              label={t('employee:phoneNumber')}
              rules={[{ max: 50 }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Form.Item
              name="home_address"
              label={t('employee:homeAddress')}
            >
              <Input.TextArea rows={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="emergency_contact_name"
              label={t('employee:emergencyContactName')}
              rules={[{ max: 255 }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="emergency_contact_phone"
              label={t('employee:emergencyContactPhone')}
              rules={[{ max: 50 }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    },

    // 个人资料
    {
      key: 'personal',
      label: t('employee:personalInfo'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="education_level_lookup_value_id"
              label={t('employee:educationLevel')}
            >
              <Select placeholder={t('common:pleaseSelect')} allowClear>
                {lookupValues.EDUCATION_LEVEL?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="marital_status_lookup_value_id"
              label={t('employee:maritalStatus')}
            >
              <Select placeholder={t('common:pleaseSelect')} allowClear>
                {lookupValues.MARITAL_STATUS?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="political_status_lookup_value_id"
              label={t('employee:politicalStatus')}
            >
              <Select placeholder={t('common:pleaseSelect')} allowClear>
                {lookupValues.POLITICAL_STATUS?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="contract_type_lookup_value_id"
              label={t('employee:contractType')}
            >
              <Select placeholder={t('common:pleaseSelect')} allowClear>
                {lookupValues.CONTRACT_TYPE?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      ),
    },

    // 银行信息
    {
      key: 'bank',
      label: t('employee:bankInfo'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="bank_name"
              label={t('employee:bankName')}
              rules={[{ max: 255 }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="bank_account_number"
              label={t('employee:bankAccountNumber')}
              rules={[{ max: 100 }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    },

    // 职业信息
    {
      key: 'career',
      label: t('employee:careerInfo'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="first_work_date"
              label={t('employee:firstWorkDate')}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="interrupted_service_years"
              label={t('employee:interruptedServiceYears')}
              rules={[{ type: 'number', min: 0, max: 99.99 }]}
            >
              <InputNumber className="w-full" precision={2} min={0} max={99.99} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="career_position_level_date"
              label={t('employee:careerPositionLevelDate')}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="current_position_start_date"
              label={t('employee:currentPositionStartDate')}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>
      ),
    },

    // 社保信息
    {
      key: 'insurance',
      label: t('employee:socialInsuranceInfo'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="social_security_client_number"
              label={t('employee:socialSecurityClientNumber')}
              rules={[{ max: 50 }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="housing_fund_client_number"
              label={t('employee:housingFundClientNumber')}
              rules={[{ max: 50 }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      autoComplete="off"
      requiredMark={true}
    >
      <Tabs defaultActiveKey="basic" items={tabItems} />
    </Form>
  );
});

EmployeeForm.displayName = 'EmployeeForm';

export default EmployeeForm;