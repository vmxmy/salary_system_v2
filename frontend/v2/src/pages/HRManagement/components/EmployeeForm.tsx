import React, { useEffect, useState, useMemo } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Card, TreeSelect, Spin, Upload, message, Steps } from 'antd';
import ActionButton from '../../../components/common/ActionButton';
import type { FormInstance } from 'antd/es/form';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { useTranslation } from 'react-i18next';
import { lookupService } from '../../../services/lookupService';
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  LookupItem,
  Department as DepartmentType,
  PersonnelCategory,
  Position as PositionType,
  Gender,
  EmploymentStatus,
} from '../types';

const { Option } = Select;
const { Step } = Steps;

interface EmployeeFormProps {
  form: FormInstance; 
  initialValues?: Partial<Employee>;
  isEditMode: boolean;
  onSubmit: (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>;
  onCancel: () => void;
  loadingSubmit: boolean;
}

const transformToTreeData = (items: Array<{ id: number | string; name: string; label?: string; value?: number | string; children?: any[] }>, valueKey = 'id', labelKey = 'name'): any[] => {
  return items.map(item => ({
    title: item.label || item[labelKey as keyof typeof item],
    value: Number(item.value || item[valueKey as keyof typeof item]),
    key: item.id || item.value,
    children: item.children ? transformToTreeData(item.children, valueKey, labelKey) : [],
  }));
};

// Helper to transform flat list to Select options
const transformListToSelectOptions = (items: Array<{ id: any; name: string }>) => {
  if (!items || !Array.isArray(items)) return [];
  return items
    .filter(item => item.id !== null && item.id !== undefined && !isNaN(Number(item.id)))
    .map(item => ({
      value: Number(item.id),
      label: item.name,
      key: Number(item.id), // Ensure key is also a valid number
    }));
};

const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  form, 
  initialValues, 
  isEditMode, 
  onSubmit, 
  onCancel, 
  loadingSubmit 
}) => {
  const { t } = useTranslation(['employee', 'common']);
  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [personnelCategoryOptions, setPersonnelCategoryOptions] = useState<any[]>([]);
  const [positionOptions, setPositionOptions] = useState<any[]>([]);
  const [genderOptions, setGenderOptions] = useState<LookupItem[]>([]);
  const [educationLevelOptions, setEducationLevelOptions] = useState<LookupItem[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<LookupItem[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<LookupItem[]>([]);
  const [politicalStatusOptions, setPoliticalStatusOptions] = useState<LookupItem[]>([]);
  const [contractTypeOptions, setContractTypeOptions] = useState<LookupItem[]>([]);
  const [statusOptions, setStatusOptions] = useState<LookupItem[]>([]);
  
  const [avatarFileList, setAvatarFileList] = useState<UploadFile[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const [
          depts, 
          personnelCategoriesData,
          positionsData,
          genders, 
          eduLevels, 
          empTypes, 
          maritals, 
          politicals, 
          contractTypesData, 
          empStatuses
        ] = await Promise.all([
          lookupService.getDepartmentsLookup(),
          lookupService.getPersonnelCategoriesLookup(),
          lookupService.getPositionsLookup(),
          lookupService.getGenderLookup(),
          lookupService.getEducationLevelsLookup(),
          lookupService.getEmploymentTypesLookup(),
          lookupService.getMaritalStatusesLookup(),
          lookupService.getPoliticalStatusesLookup(),
          lookupService.getContractTypesLookup(),
          lookupService.getEmployeeStatusesLookup(),
        ]);
        setDepartmentOptions(transformToTreeData(depts));
        setPersonnelCategoryOptions(transformListToSelectOptions(personnelCategoriesData as any[]));
        setPositionOptions(transformListToSelectOptions(positionsData as PositionType[]));
        setGenderOptions(genders);
        setEducationLevelOptions(eduLevels);
        setEmploymentTypeOptions(empTypes);
        setMaritalStatusOptions(maritals);
        setPoliticalStatusOptions(politicals);
        setContractTypeOptions(contractTypesData);
        setStatusOptions(empStatuses);
      } catch (error) {
        message.error(t('common:message.data_loading_error'));
        console.error('Failed to load lookups:', error);
      }
      setLoadingLookups(false);
    };
    fetchLookups();
  }, [t]);

  useEffect(() => {
    if (initialValues && !loadingLookups) {
      console.log('[EmployeeForm] Received initialValues:', JSON.parse(JSON.stringify(initialValues)));
      const processedValues: Record<string, any> = {
        ...initialValues,
        date_of_birth: initialValues.date_of_birth ? (dayjs(initialValues.date_of_birth, 'YYYY-MM-DD', true).isValid() ? dayjs(initialValues.date_of_birth, 'YYYY-MM-DD', true) : undefined) : undefined,
        first_work_date: initialValues.first_work_date ? (dayjs(initialValues.first_work_date, 'YYYY-MM-DD', true).isValid() ? dayjs(initialValues.first_work_date, 'YYYY-MM-DD', true) : undefined) : undefined,
        hire_date: initialValues.hire_date ? (dayjs(initialValues.hire_date, 'YYYY-MM-DD', true).isValid() ? dayjs(initialValues.hire_date, 'YYYY-MM-DD', true) : undefined) : undefined,
        gender_lookup_value_id: initialValues.gender_lookup_value_id != null 
                                ? Number(initialValues.gender_lookup_value_id) 
                                : undefined,
        status_lookup_value_id: initialValues.status_lookup_value_id != null
                                ? Number(initialValues.status_lookup_value_id)
                                : undefined,
        education_level_lookup_value_id: initialValues.education_level_lookup_value_id != null
                                ? Number(initialValues.education_level_lookup_value_id)
                                : undefined,
        employment_type_lookup_value_id: initialValues.employment_type_lookup_value_id != null
                                ? Number(initialValues.employment_type_lookup_value_id)
                                : undefined,
        marital_status_lookup_value_id: initialValues.marital_status_lookup_value_id != null
                                ? Number(initialValues.marital_status_lookup_value_id)
                                : undefined,
        political_status_lookup_value_id: initialValues.political_status_lookup_value_id != null
                                ? Number(initialValues.political_status_lookup_value_id)
                                : undefined,
        contract_type_lookup_value_id: initialValues.contract_type_lookup_value_id != null
                                ? Number(initialValues.contract_type_lookup_value_id)
                                : undefined,
        department_id: initialValues.department_id != null ? Number(initialValues.department_id) : undefined,
        personnel_category_id: initialValues.personnel_category_id != null ? Number(initialValues.personnel_category_id) : undefined,
        actual_position_id: initialValues.actual_position_id != null ? Number(initialValues.actual_position_id) : undefined,
      };
      
      console.log('[EmployeeForm] Processed values for form.setFieldsValue:', JSON.parse(JSON.stringify(processedValues)));
      form.setFieldsValue(processedValues);
      if (initialValues.avatar) {
        setAvatarFileList([{
          uid: '-1',
          name: 'avatar.png',
          status: 'done',
          url: initialValues.avatar,
        }]);
      }
    }
  }, [initialValues, form, loadingLookups]);

  const handleFormSubmit = async (formValues: any) => {
    console.log('[EmployeeForm] Raw formValues from onFinish:', JSON.parse(JSON.stringify(formValues)));

    const payload: CreateEmployeePayload | UpdateEmployeePayload = {
      // Basic Info
      first_name: formValues.first_name,
      last_name: formValues.last_name,
      ...(isEditMode ? {} : { employee_code: formValues.employee_code }), 
      gender_lookup_value_id: formValues.gender_lookup_value_id != null ? Number(formValues.gender_lookup_value_id) : undefined,
      date_of_birth: formValues.date_of_birth ? dayjs(formValues.date_of_birth).utc().format('YYYY-MM-DD') : undefined,
      id_number: formValues.id_number,
      marital_status_lookup_value_id: formValues.marital_status_lookup_value_id != null ? Number(formValues.marital_status_lookup_value_id) : undefined,
      education_level_lookup_value_id: formValues.education_level_lookup_value_id != null ? Number(formValues.education_level_lookup_value_id) : undefined,
      political_status_lookup_value_id: formValues.political_status_lookup_value_id != null ? Number(formValues.political_status_lookup_value_id) : undefined,
      nationality: formValues.nationality,
      ethnicity: formValues.ethnicity,
      first_work_date: formValues.first_work_date ? dayjs(formValues.first_work_date).utc().format('YYYY-MM-DD') : undefined,
      interrupted_service_years: formValues.interrupted_service_years != null ? Number(formValues.interrupted_service_years) : undefined,

      avatar: avatarFileList.length > 0 && avatarFileList[0].url 
              ? avatarFileList[0].url 
              : (avatarFileList.length > 0 && avatarFileList[0].response?.url 
              ? avatarFileList[0].response.url 
              : (formValues.avatar || undefined)),

      // Position & Contract Info
      department_id: formValues.department_id != null ? Number(formValues.department_id) : undefined,
      personnel_category_id: formValues.personnel_category_id != null ? Number(formValues.personnel_category_id) : undefined,
      actual_position_id: formValues.actual_position_id != null ? Number(formValues.actual_position_id) : undefined,
      hire_date: formValues.hire_date ? dayjs(formValues.hire_date).utc().format('YYYY-MM-DD') : undefined,
      status_lookup_value_id: formValues.status_lookup_value_id != null ? Number(formValues.status_lookup_value_id) : undefined,
      employment_type_lookup_value_id: formValues.employment_type_lookup_value_id != null ? Number(formValues.employment_type_lookup_value_id) : undefined,
      contract_type_lookup_value_id: formValues.contract_type_lookup_value_id != null ? Number(formValues.contract_type_lookup_value_id) : undefined,
      
      // Contact & Bank Info
      phone_number: formValues.phone_number,
      email: formValues.email,
      home_address: formValues.home_address,
      bank_name: formValues.bank_name,
      bank_account_number: formValues.bank_account_number,
      emergency_contact_name: formValues.emergency_contact_name,
      emergency_contact_phone: formValues.emergency_contact_phone,
    };
    
    Object.keys(payload).forEach(keyStr => {
      const key = keyStr as keyof typeof payload;
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    console.log('[EmployeeForm] Constructed payload for submission:', JSON.parse(JSON.stringify(payload)));

    if (isEditMode && initialValues?.id) {
      await onSubmit(payload as UpdateEmployeePayload);
    } else {
      await onSubmit(payload as CreateEmployeePayload);
    }
  };
  
  const handleAvatarChange = (info: UploadChangeParam<UploadFile>) => {
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1); 
    fileList = fileList.map(file => {
      if (file.response) {
        file.url = file.response.url; 
      }
      return file;
    });
    setAvatarFileList(fileList);
    if (info.file.status === 'done') {
      message.success(t('common:message.upload_success_param', { fileName: info.file.name }));
      form.setFieldsValue({ avatar: info.file.response.url }); 
    } else if (info.file.status === 'error') {
      message.error(t('common:message.upload_failed_param', { fileName: info.file.name }));
    }
  };

  const departmentOptionsMemo = useMemo(() => {
    if (!departmentOptions) return [];
    // Assuming departmentOptions from transformToTreeData already has title as label and value as value
    return departmentOptions; 
  }, [departmentOptions]);

  const personnelCategoryOptionsMemo = useMemo(() => {
    // personnelCategoryOptions is already transformed by transformListToSelectOptions
    return personnelCategoryOptions;
  }, [personnelCategoryOptions]);

  const positionOptionsMemo = useMemo(() => {
    // positionOptions is already transformed by transformListToSelectOptions
    return positionOptions;
  }, [positionOptions]);

  const employmentTypeOptionsMemo = useMemo(() => {
    if (!employmentTypeOptions) return [];
    return employmentTypeOptions.map(empType => ({
      value: empType.value,
      label: empType.label,
    }));
  }, [employmentTypeOptions]);

  const statusOptionsMemo = useMemo(() => {
    if (!statusOptions) return [];
    return statusOptions.map(stat => ({
      value: stat.value,
      label: stat.label,
    }));
  }, [statusOptions]);

  const getRequiredMessage = (fieldNameKey: string) => {
    return t('common:form.validation.default_required_template', { fieldName: t(fieldNameKey) });
  };

  if (loadingLookups) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip={t('common:loading.generic_loading_text')}><div style={{ padding: 50 }} /></Spin></div>;
  }

  const steps = [
    {
      title: t('employee:form_card.title_basic_info'),
      content: (
        <Card title={null} style={{ marginBottom: 24, border: 'none' }}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="last_name" label={t('employee:detail_page.basic_info_tab.label_last_name')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_last_name') }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="first_name" label={t('employee:detail_page.basic_info_tab.label_first_name')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_first_name') }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="employee_code" label={t('employee:detail_page.basic_info_tab.label_employee_id')} rules={[{ required: false, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_id') }]}>
                  <Input disabled={isEditMode} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="gender_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_gender')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_gender') }]}>
                  <Select placeholder={t('employee:list_page.filter_form.placeholder.gender')} loading={loadingLookups} allowClear>
                    {genderOptions.map(g => <Option key={g.value as React.Key} value={Number(g.value)}>{g.label}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="date_of_birth" label={t('employee:detail_page.basic_info_tab.label_dob')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_dob') }]}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="id_number" label={t('employee:form_label.id_number')} rules={[{ required: true, message: getRequiredMessage('employee:form_label.id_number') }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="marital_status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_marital_status')}>
                  <Select placeholder={t('employee:form_placeholder.marital_status')} loading={loadingLookups} allowClear>
                    {maritalStatusOptions.map(ms => <Option key={ms.value as React.Key} value={Number(ms.value)}>{ms.label}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="education_level_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_education_level')}>
                  <Select placeholder={t('employee:list_page.filter_form.placeholder.education_level')} loading={loadingLookups} allowClear>
                    {educationLevelOptions.map(el => <Option key={el.value as React.Key} value={Number(el.value)}>{el.label}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="political_status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_political_status')}>
                  <Select placeholder={t('employee:form_placeholder.political_status')} loading={loadingLookups} allowClear>
                    {politicalStatusOptions.map(ps => <Option key={ps.value as React.Key} value={Number(ps.value)}>{ps.label}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="ethnicity" label={t('employee:form_label.ethnicity')}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="nationality" label={t('employee:form_label.nationality')}>
              <Input />
            </Form.Item>
            <Form.Item name="avatar" label={t('employee:form_label.avatar')}>
              <Upload 
                action="/api/v2/files/upload" 
                listType="picture-card"
                fileList={avatarFileList}
                onChange={handleAvatarChange}
                name="file" 
                maxCount={1}
              >
                  {avatarFileList.length < 1 && <div><UploadOutlined /><div style={{marginTop: 8}}>{t('employee:form_upload.avatar_text')}</div></div>}
              </Upload>
            </Form.Item>
        </Card>
      ),
    },
    {
      title: t('employee:form_card.title_position_contract_info'),
      content: (
        <Card title={null} style={{ marginBottom: 24, border: 'none' }}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="department_id" label={t('employee:detail_page.basic_info_tab.label_department')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_department') }]}>
                  <TreeSelect
                    style={{ width: '100%' }}
                    styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
                    placeholder={t('employee:list_page.filter_form.placeholder.department')}
                    allowClear
                    treeDefaultExpandAll
                    treeData={departmentOptionsMemo}
                    loading={loadingLookups}
                    treeNodeFilterProp="title"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="personnel_category_id" label={t('employee:detail_page.basic_info_tab.label_job_title')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_job_title') }]}>
                  <Select 
                    placeholder={t('employee:list_page.filter_form.placeholder.job_title')} 
                    options={personnelCategoryOptionsMemo}
                    loading={loadingLookups} 
                    allowClear 
                    showSearch 
                    filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="actual_position_id" label={t('employee:detail_page.basic_info_tab.label_actual_position')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_actual_position') }]}>
                  <Select 
                    placeholder={t('employee:list_page.filter_form.placeholder.actual_position')} 
                    options={positionOptionsMemo}
                    loading={loadingLookups} 
                    allowClear 
                    showSearch 
                    filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="hire_date" label={t('employee:detail_page.basic_info_tab.label_hire_date')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_hire_date') }]}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_employee_status')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_status') }]}>
                  <Select placeholder={t('employee:list_page.filter_form.placeholder.status')} loading={loadingLookups} allowClear>
                    {statusOptions.map(stat => <Option key={stat.value as React.Key} value={Number(stat.value)}>{stat.label}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="employment_type_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_employment_type')}>
                  <Select placeholder={t('employee:list_page.filter_form.placeholder.employment_type')} loading={loadingLookups} allowClear>
                    {employmentTypeOptions.map(empType => <Option key={empType.value as React.Key} value={Number(empType.value)}>{empType.label}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="contract_type_lookup_value_id" label={t('employee:form_label.contract_type')}>
              <Select placeholder={t('employee:form_placeholder.contract_type')} loading={loadingLookups} allowClear>
                {contractTypeOptions.map(ct => <Option key={ct.value as React.Key} value={Number(ct.value)}>{ct.label}</Option>)}
              </Select>
            </Form.Item>
        </Card>
      ),
    },
    {
      title: t('employee:form_card.title_contact_bank_info'),
      content: (
        <Card title={null} style={{ marginBottom: 24, border: 'none' }}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="phone_number" label={t('employee:detail_page.basic_info_tab.label_mobile_phone')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_mobile_phone') }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="email" label={t('employee:detail_page.basic_info_tab.label_email')} rules={[{ type: 'email', message: t('common:form.validation.email_invalid') }]}>
                  <Input type="email" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="home_address" label={t('employee:form_label.home_address')}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="bank_name" label={t('employee:form_label.bank_name')} rules={[{ required: true, message: getRequiredMessage('employee:form_label.bank_name') }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="bank_account_number" label={t('employee:form_label.bank_account_number')} rules={[{ required: true, message: getRequiredMessage('employee:form_label.bank_account_number') }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="emergency_contact_name" label={t('employee:form_label.emergency_contact_name')}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="emergency_contact_phone" label={t('employee:form_label.emergency_contact_phone')}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
        </Card>
      ),
    },
  ];

  const next = () => {
    // Validate current step's fields before proceeding
    // This is a basic example; you might need more specific validation based on fields in each step
    form.validateFields().then(() => {
        setCurrentStep(currentStep + 1);
    }).catch(info => {
        console.log('Validate Failed:', info);
        // Optionally, focus on the first error field or show a message
    });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Spin spinning={loadingSubmit} tip={t('common:loading.generic_loading_text')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        initialValues={{ 
          ...initialValues, 
          // Ensure date fields are initialized with dayjs objects for DatePicker
          date_of_birth: initialValues?.date_of_birth ? dayjs(initialValues.date_of_birth) : undefined,
          first_work_date: initialValues?.first_work_date ? dayjs(initialValues.first_work_date) : undefined,
          hire_date: initialValues?.hire_date ? dayjs(initialValues.hire_date) : undefined,
          probation_end_date: initialValues?.probationEndDate ? dayjs(initialValues.probationEndDate) : undefined,
          // Ensure numeric lookup IDs are numbers
          gender_lookup_value_id: initialValues?.gender_lookup_value_id != null ? Number(initialValues.gender_lookup_value_id) : undefined,
          status_lookup_value_id: initialValues?.status_lookup_value_id != null ? Number(initialValues.status_lookup_value_id) : undefined,
          education_level_lookup_value_id: initialValues?.education_level_lookup_value_id != null ? Number(initialValues.education_level_lookup_value_id) : undefined,
          employment_type_lookup_value_id: initialValues?.employment_type_lookup_value_id != null ? Number(initialValues.employment_type_lookup_value_id) : undefined,
          marital_status_lookup_value_id: initialValues?.marital_status_lookup_value_id != null ? Number(initialValues.marital_status_lookup_value_id) : undefined,
          political_status_lookup_value_id: initialValues?.political_status_lookup_value_id != null ? Number(initialValues.political_status_lookup_value_id) : undefined,
          contract_type_lookup_value_id: initialValues?.contract_type_lookup_value_id != null ? Number(initialValues.contract_type_lookup_value_id) : undefined,
          department_id: initialValues?.department_id != null ? Number(initialValues.department_id) : undefined,
          personnel_category_id: initialValues?.personnel_category_id != null ? Number(initialValues.personnel_category_id) : undefined,
          actual_position_id: initialValues?.actual_position_id != null ? Number(initialValues.actual_position_id) : undefined,
        }}
      >
        <Steps current={currentStep} items={steps.map(item => ({ key: item.title, title: item.title }))} style={{ marginBottom: 24 }} />
        
        <div className="steps-content">{steps[currentStep].content}</div>

        <div className="steps-action" style={{ textAlign: 'right', marginTop: 24 }}>
          {currentStep > 0 && (
            <Button style={{ margin: '0 8px' }} onClick={() => prev()} disabled={loadingSubmit}>
              {t('common:button.previous_step')}
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={() => next()} loading={loadingSubmit}>
              {t('common:button.next_step')}
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" htmlType="submit" loading={loadingSubmit}>
              {isEditMode
                ? t('employee:form_shared.button.update_employee')
                : t('employee:form_shared.button.create_employee')}
            </Button>
          )}
           <Button
            onClick={onCancel}
            style={{ marginLeft: 8 }}
            disabled={loadingSubmit}
            danger
          >
            {t('common:button.cancel')}
          </Button>
        </div>
      </Form>
    </Spin>
  );
};

export default EmployeeForm; 