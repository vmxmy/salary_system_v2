import React, { useEffect, useState, useMemo } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Card, TreeSelect, Spin, Upload, message, Steps, App } from 'antd';
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

// New helper function to transform tree structure to flat Select options
const transformTreeToFlatSelectOptions = (
  treeItems: Array<{ id: any; name: string; children?: any[], code?: string }>, // Added code for potential use in label
  options: Array<{ value: number; label: string; key: number }> = [],
  level = 0, // Add level for indentation
  parentName = '' // Add parentName for context
): Array<{ value: number; label: string; key: number }> => {
  const prefix = level > 0 ? '\u00A0\u00A0'.repeat(level) + '- ' : ''; // Indentation prefix
  for (const item of treeItems) {
    if (item.id !== null && item.id !== undefined && !isNaN(Number(item.id))) {
      // Example of adding parent context to label if needed, or just use item.name
      // const label = parentName ? `${parentName} > ${item.name}` : item.name;
      const label = prefix + item.name.trim(); // Use prefix for indentation
      options.push({
        value: Number(item.id),
        label: label,
        key: Number(item.id),
      });
    }
    if (item.children && item.children.length > 0) {
      // Pass current item's name as parentName for the next level
      transformTreeToFlatSelectOptions(item.children, options, level + 1, item.name);
    }
  }
  return options;
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
  const { message: antdMessage } = App.useApp();
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
  
  const [allStepsData, setAllStepsData] = useState<Partial<CreateEmployeePayload | UpdateEmployeePayload>>({});
  const [stepData, setStepData] = useState<Record<number, any>>({});

  useEffect(() => {
    if (isEditMode && initialValues) {
      setAllStepsData(initialValues as Partial<CreateEmployeePayload | UpdateEmployeePayload>);
      setStepData({
        0: initialValues,
        1: initialValues,
        2: initialValues,
      });
    }
  }, [isEditMode, initialValues]);

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
        
        console.log('[EmployeeForm] Raw personnelCategoriesData from lookupService:', JSON.parse(JSON.stringify(personnelCategoriesData)));

        setDepartmentOptions(transformToTreeData(depts));
        setPersonnelCategoryOptions(transformToTreeData(personnelCategoriesData as any[]));
        setPositionOptions(transformListToSelectOptions(positionsData as PositionType[]));
        setGenderOptions(genders);
        setEducationLevelOptions(eduLevels);
        setEmploymentTypeOptions(empTypes);
        setMaritalStatusOptions(maritals);
        setPoliticalStatusOptions(politicals);
        setContractTypeOptions(contractTypesData);
        setStatusOptions(empStatuses);
      } catch (error) {
        antdMessage.error(t('common:message.data_loading_error'));
        console.error('Failed to load lookups:', error);
      }
      setLoadingLookups(false);
    };
    fetchLookups();
  }, [t, antdMessage]);

  useEffect(() => {
    console.log('[EmployeeForm] Checking conditions to set form values:', {
      hasInitialValues: !!initialValues,
      initialValuesKeyCount: initialValues ? Object.keys(initialValues).length : 0,
      isLoadingLookups: loadingLookups
    });
    if (initialValues && Object.keys(initialValues).length > 0 && !loadingLookups) {
      console.log('[EmployeeForm] Dependencies met for setting form values. initialValues:', JSON.parse(JSON.stringify(initialValues)));
      console.log('[EmployeeForm] initialValues.personnel_category_id:', initialValues?.personnel_category_id);
      console.log('[EmployeeForm] Current personnelCategoryOptions when setting form values (first 5):', JSON.parse(JSON.stringify(personnelCategoryOptions.slice(0, 5))));
      
      const targetPersonnelCategoryId = initialValues?.personnel_category_id;
      if (targetPersonnelCategoryId !== undefined && targetPersonnelCategoryId !== null) {
        const matchingOption = personnelCategoryOptions.find(option => option.value === Number(targetPersonnelCategoryId));
        console.log(`[EmployeeForm] Matching personnelCategory option for ID ${targetPersonnelCategoryId}:`, matchingOption ? JSON.parse(JSON.stringify(matchingOption)) : 'NOT FOUND');
      }

      const processedValues: Record<string, any> = {
        ...initialValues,
        
        date_of_birth: initialValues.date_of_birth ? dayjs(initialValues.date_of_birth) : undefined,
        first_work_date: initialValues.first_work_date ? dayjs(initialValues.first_work_date) : undefined,
        hire_date: initialValues.hire_date ? dayjs(initialValues.hire_date) : undefined,
        probationEndDate: initialValues.probationEndDate ? dayjs(initialValues.probationEndDate) : undefined,
        initialContractStartDate: initialValues.initialContractStartDate ? dayjs(initialValues.initialContractStartDate) : undefined,
        initialContractEndDate: initialValues.initialContractEndDate ? dayjs(initialValues.initialContractEndDate) : undefined,

        gender_lookup_value_id: initialValues.gender_lookup_value_id != null ? Number(initialValues.gender_lookup_value_id) : undefined,
        status_lookup_value_id: initialValues.status_lookup_value_id != null ? Number(initialValues.status_lookup_value_id) : undefined,
        education_level_lookup_value_id: initialValues.education_level_lookup_value_id != null ? Number(initialValues.education_level_lookup_value_id) : undefined,
        employment_type_lookup_value_id: initialValues.employment_type_lookup_value_id != null ? Number(initialValues.employment_type_lookup_value_id) : undefined,
        marital_status_lookup_value_id: initialValues.marital_status_lookup_value_id != null ? Number(initialValues.marital_status_lookup_value_id) : undefined,
        political_status_lookup_value_id: initialValues.political_status_lookup_value_id != null ? Number(initialValues.political_status_lookup_value_id) : undefined,
        contract_type_lookup_value_id: initialValues.contract_type_lookup_value_id != null ? Number(initialValues.contract_type_lookup_value_id) : undefined,
        department_id: initialValues.department_id != null ? Number(initialValues.department_id) : undefined,
        personnel_category_id: initialValues.personnel_category_id != null ? Number(initialValues.personnel_category_id) : undefined,
        actual_position_id: initialValues.actual_position_id != null ? Number(initialValues.actual_position_id) : undefined,
        reports_to_employee_id: initialValues.reports_to_employee_id != null ? Number(initialValues.reports_to_employee_id) : undefined,
      };
      
      console.log('[EmployeeForm] Processed values for form.setFieldsValue:', JSON.parse(JSON.stringify(processedValues)));
      form.setFieldsValue(processedValues);
      console.log('[EmployeeForm] Values in form instance AFTER setFieldsValue:', JSON.parse(JSON.stringify(form.getFieldsValue(true))));
      
      // Attempt to force a re-render or validation update
      form.validateFields().catch(() => {
        // console.log('[EmployeeForm] Validate fields catch block (expected if form is invalid, or just for update)');
        // We don't really care about the validation result here, just want to trigger an update.
        // It's possible that if fields are initially empty and have rules, this might log errors, which is fine for now.
      });
      
      if (isEditMode) {
        setAllStepsData(prev => ({...prev, ...processedValues}));
      }
      
      if (initialValues.avatar) {
        setAvatarFileList([{
          uid: '-1',
          name: 'avatar.png',
          status: 'done',
          url: initialValues.avatar,
        }]);
      } else {
        setAvatarFileList([]);
      }
    }
  }, [initialValues, form, loadingLookups, isEditMode]);

  /*
  useEffect(() => {
    if (allStepsData && Object.keys(allStepsData).length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[EmployeeForm] Step changed to ${currentStep}`);
      }
      
      form.setFieldsValue(allStepsData);
    }
  }, [currentStep, form]);
  */

  const handleFormSubmit = async (formValues: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[EmployeeForm] Form submission started');
    }

    const currentFieldsValue = form.getFieldsValue(true);
    
    setStepData(prev => ({
      ...prev,
      [currentStep]: currentFieldsValue
    }));
    
    const allStepDataCombined = { 
      ...stepData[0], 
      ...stepData[1], 
      ...stepData[2], 
      ...currentFieldsValue 
    };
    
    setAllStepsData(allStepDataCombined);
    
    const requiredFields = ['first_name', 'last_name', 'hire_date', 'status_lookup_value_id'];
    const missingFields = requiredFields.filter(field => !allStepDataCombined[field]);
    
    if (missingFields.length > 0) {
      console.error('[EmployeeForm] Missing required fields:', missingFields);
      antdMessage.error(t('common:message.missing_required_fields'));
      
      if (missingFields.includes('first_name') || missingFields.includes('last_name')) {
        setCurrentStep(0);
        return;
      } else if (missingFields.includes('hire_date') || missingFields.includes('status_lookup_value_id')) {
        setCurrentStep(1);
        return;
      }
      return;
    }

    const processedFinalPayload: Partial<CreateEmployeePayload | UpdateEmployeePayload> = {
      first_name: allStepDataCombined.first_name,
      last_name: allStepDataCombined.last_name,
      ...(isEditMode ? {} : (allStepDataCombined.employee_code ? { employee_code: allStepDataCombined.employee_code } : {})),
      gender_lookup_value_name: allStepDataCombined.gender_lookup_value_id != null 
                               ? genderOptions.find(opt => opt.id === Number(allStepDataCombined.gender_lookup_value_id))?.name 
                               : undefined,
      date_of_birth: allStepDataCombined.date_of_birth ? dayjs(allStepDataCombined.date_of_birth).utc().format('YYYY-MM-DD') : undefined,
      id_number: allStepDataCombined.id_number,
      marital_status_lookup_value_name: allStepDataCombined.marital_status_lookup_value_id != null 
                                       ? maritalStatusOptions.find(opt => opt.id === Number(allStepDataCombined.marital_status_lookup_value_id))?.name 
                                       : undefined,
      education_level_lookup_value_name: allStepDataCombined.education_level_lookup_value_id != null 
                                       ? educationLevelOptions.find(opt => opt.id === Number(allStepDataCombined.education_level_lookup_value_id))?.name 
                                       : undefined,
      political_status_lookup_value_name: allStepDataCombined.political_status_lookup_value_id != null 
                                       ? politicalStatusOptions.find(opt => opt.id === Number(allStepDataCombined.political_status_lookup_value_id))?.name 
                                       : undefined,
      nationality: allStepDataCombined.nationality,
      ethnicity: allStepDataCombined.ethnicity,
      first_work_date: allStepDataCombined.first_work_date ? dayjs(allStepDataCombined.first_work_date).utc().format('YYYY-MM-DD') : undefined,
      interrupted_service_years: allStepDataCombined.interrupted_service_years != null ? Number(allStepDataCombined.interrupted_service_years) : undefined,

      avatar: allStepDataCombined.avatar || (avatarFileList.length > 0 && avatarFileList[0].url) || (avatarFileList.length > 0 && avatarFileList[0].response?.url) || undefined,

      department_name: allStepDataCombined.department_id != null 
                      ? departmentOptions.find(opt => opt.value === Number(allStepDataCombined.department_id))?.title 
                      : undefined,
      personnel_category_name: allStepDataCombined.personnel_category_id != null 
                             ? personnelCategoryOptions.find(opt => opt.value === Number(allStepDataCombined.personnel_category_id))?.label 
                             : undefined,
      position_name: allStepDataCombined.actual_position_id != null 
                   ? positionOptions.find(opt => opt.value === Number(allStepDataCombined.actual_position_id))?.label 
                   : undefined,
      hire_date: allStepDataCombined.hire_date ? dayjs(allStepDataCombined.hire_date).utc().format('YYYY-MM-DD') : undefined,
      status_lookup_value_name: allStepDataCombined.status_lookup_value_id != null 
                              ? statusOptions.find(opt => opt.id === Number(allStepDataCombined.status_lookup_value_id))?.name 
                              : undefined,
      employment_type_lookup_value_name: allStepDataCombined.employment_type_lookup_value_id != null 
                                      ? employmentTypeOptions.find(opt => opt.id === Number(allStepDataCombined.employment_type_lookup_value_id))?.name 
                                      : undefined,
      contract_type_lookup_value_name: allStepDataCombined.contract_type_lookup_value_id != null 
                                    ? contractTypeOptions.find(opt => opt.id === Number(allStepDataCombined.contract_type_lookup_value_id))?.name 
                                    : undefined,
      
      phone_number: allStepDataCombined.phone_number,
      email: allStepDataCombined.email,
      home_address: allStepDataCombined.home_address,
      bank_name: allStepDataCombined.bank_name,
      bank_account_number: allStepDataCombined.bank_account_number,
      emergency_contact_name: allStepDataCombined.emergency_contact_name,
      emergency_contact_phone: allStepDataCombined.emergency_contact_phone,
    };
    
    Object.keys(processedFinalPayload).forEach(keyStr => {
      const key = keyStr as keyof typeof processedFinalPayload;
      if (processedFinalPayload[key] === undefined) {
        delete processedFinalPayload[key];
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[EmployeeForm] Payload prepared for submission');
    }

    if (isEditMode && initialValues?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[EmployeeForm] Executing update operation');
      }
      const updatePayload = {
        ...processedFinalPayload,
      } as Partial<UpdateEmployeePayload>;
      await onSubmit(updatePayload);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[EmployeeForm] Executing create operation');
      }
      if (!processedFinalPayload.first_name || !processedFinalPayload.last_name || 
          !processedFinalPayload.hire_date || !processedFinalPayload.status_lookup_value_name) {
        console.error('[EmployeeForm] Missing required fields for employee creation');
        antdMessage.error(t('common:message.missing_required_fields'));
        return;
      }
      const createPayload = processedFinalPayload as CreateEmployeePayload;
      await onSubmit(createPayload);
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
      antdMessage.success(t('common:message.upload_success_param', { fileName: info.file.name }));
      form.setFieldsValue({ avatar: info.file.response.url }); 
      setAllStepsData(prev => ({...prev, avatar: info.file.response.url}));
    } else if (info.file.status === 'error') {
      antdMessage.error(t('common:message.upload_failed_param', { fileName: info.file.name }));
    }
  };

  const departmentOptionsMemo = useMemo(() => {
    if (!departmentOptions) return [];
    return departmentOptions; 
  }, [departmentOptions]);

  const personnelCategoryOptionsMemo = useMemo(() => {
    return personnelCategoryOptions;
  }, [personnelCategoryOptions]);

  const positionOptionsMemo = useMemo(() => {
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
                  <TreeSelect 
                    style={{ width: '100%' }}
                    styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
                    placeholder={t('employee:list_page.filter_form.placeholder.job_title')} 
                    treeData={personnelCategoryOptionsMemo}
                    loading={loadingLookups} 
                    allowClear 
                    showSearch
                    treeDefaultExpandAll
                    treeNodeFilterProp="title"
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

  const next = async () => {
    try {
      await form.validateFields();
      
      const currentFieldsValue = form.getFieldsValue(true);
      
      setStepData(prev => ({
        ...prev,
        [currentStep]: currentFieldsValue
      }));
      setAllStepsData(prevData => ({ 
        ...prevData, 
        ...currentFieldsValue 
      }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[EmployeeForm] Saved data for step ${currentStep}`, currentFieldsValue);
        console.log(`[EmployeeForm] All steps data after step ${currentStep}`, allStepsData);
      }
      
      const nextStepValue = currentStep + 1;
      setCurrentStep(nextStepValue);

    } catch (errorInfo) {
      console.log('Validation Failed:', errorInfo);
      antdMessage.error(t('common:form.validation_error_please_check'));
    }
  };

  const prev = () => {
    const currentFieldsValue = form.getFieldsValue(true);
    
    setStepData(prev => ({
      ...prev,
      [currentStep]: currentFieldsValue
    }));
    setAllStepsData(prevData => ({
      ...prevData,
      ...currentFieldsValue
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EmployeeForm] Saved data for step ${currentStep}`, currentFieldsValue);
    }
    
    const prevStepValue = currentStep - 1;
    setCurrentStep(prevStepValue);
  };

  const renderStepContent = () => {
    return steps[currentStep].content;
  };

  return (
    <Spin spinning={loadingLookups || loadingSubmit}>
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title={t('employee:form_steps.basic_info')} />
        <Step title={t('employee:form_steps.position_info')} />
        <Step title={t('employee:form_steps.contact_info')} />
      </Steps>

      <Form layout="vertical" form={form} onFinish={handleFormSubmit}>
        {renderStepContent()}

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          {currentStep > 0 && (
            <Button style={{ marginRight: 8 }} onClick={prev}>
              {t('common:button.previous')}
            </Button>
          )}
          {currentStep < (3 - 1) && (
            <Button type="primary" onClick={next}>
              {t('common:button.next')}
            </Button>
          )}
          {currentStep === (3 - 1) && (
            <Button type="primary" htmlType="submit" loading={loadingSubmit}>
              {isEditMode ? t('common:button.update') : t('common:button.create')}
            </Button>
          )}
          <Button style={{ marginLeft: 8 }} onClick={onCancel} disabled={loadingSubmit}>
            {t('common:button.cancel')}
          </Button>
        </div>
      </Form>
    </Spin>
  );
};

export default EmployeeForm; 