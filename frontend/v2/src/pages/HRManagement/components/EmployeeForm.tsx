import React, { useEffect, useState, useMemo } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Card, TreeSelect, Spin, Upload, message } from 'antd';
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
  JobTitle,
  Gender,
  EmploymentStatus,
} from '../types';

const { Option } = Select;

interface EmployeeFormProps {
  form: FormInstance; 
  initialValues?: Partial<Employee>;
  isEditMode: boolean;
  onSubmit: (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>;
  onCancel: () => void;
  loadingSubmit: boolean;
}

const transformToTreeData = (departments: DepartmentType[]): any[] => {
  return departments.map(dept => ({
    title: dept.label || dept.name,
    value: Number(dept.value || dept.id),
    key: dept.id || dept.value,
    children: dept.children ? transformToTreeData(dept.children) : [],
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
  const [positionOptions, setPositionOptions] = useState<JobTitle[]>([]);
  const [genderOptions, setGenderOptions] = useState<LookupItem[]>([]);
  const [educationLevelOptions, setEducationLevelOptions] = useState<LookupItem[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<LookupItem[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<LookupItem[]>([]);
  const [politicalStatusOptions, setPoliticalStatusOptions] = useState<LookupItem[]>([]);
  const [contractTypeOptions, setContractTypeOptions] = useState<LookupItem[]>([]);
  const [statusOptions, setStatusOptions] = useState<LookupItem[]>([]);
  
  const [avatarFileList, setAvatarFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const [
          depts, 
          positions, 
          genders, 
          eduLevels, 
          empTypes, 
          maritals, 
          politicals, 
          contractTypesData, 
          empStatuses
        ] = await Promise.all([
          lookupService.getDepartmentsLookup(),
          lookupService.getJobTitlesLookup(),
          lookupService.getGenderLookup(),
          lookupService.getEducationLevelsLookup(),
          lookupService.getEmploymentTypesLookup(),
          lookupService.getMaritalStatusesLookup(),
          lookupService.getPoliticalStatusesLookup(),
          lookupService.getContractTypesLookup(),
          lookupService.getEmployeeStatusesLookup(),
        ]);
        setDepartmentOptions(transformToTreeData(depts));
        setPositionOptions(positions);
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
        hire_date: initialValues.hire_date ? (dayjs(initialValues.hire_date, 'YYYY-MM-DD', true).isValid() ? dayjs(initialValues.hire_date, 'YYYY-MM-DD', true) : undefined) : undefined,
        probation_end_date: initialValues.probationEndDate ? (dayjs(initialValues.probationEndDate, 'YYYY-MM-DD', true).isValid() ? dayjs(initialValues.probationEndDate, 'YYYY-MM-DD', true) : undefined) : undefined,
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
        job_title_id: initialValues.job_title_id != null ? Number(initialValues.job_title_id) : undefined,
        reports_to_employee_id: initialValues.reports_to_employee_id ? Number(initialValues.reports_to_employee_id) : undefined,
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

    // Explicitly construct the payload based on API schema and frontend types
    const payload: CreateEmployeePayload | UpdateEmployeePayload = {
      // Basic Info
      first_name: formValues.first_name,
      last_name: formValues.last_name,
      ...(isEditMode ? {} : { employee_code: formValues.employee_code }), // employee_code only for create
      gender_lookup_value_id: formValues.gender_lookup_value_id != null ? Number(formValues.gender_lookup_value_id) : undefined,
      date_of_birth: formValues.date_of_birth ? dayjs(formValues.date_of_birth).utc().format('YYYY-MM-DD') : null,
      id_number: formValues.id_number,
      marital_status_lookup_value_id: formValues.marital_status_lookup_value_id != null ? Number(formValues.marital_status_lookup_value_id) : undefined,
      education_level_lookup_value_id: formValues.education_level_lookup_value_id != null ? Number(formValues.education_level_lookup_value_id) : undefined,
      political_status_lookup_value_id: formValues.political_status_lookup_value_id != null ? Number(formValues.political_status_lookup_value_id) : undefined,
      nationality: formValues.nationality,
      avatar: avatarFileList.length > 0 && avatarFileList[0].url 
              ? avatarFileList[0].url 
              : (avatarFileList.length > 0 && avatarFileList[0].response?.url 
              ? avatarFileList[0].response.url 
              : (formValues.avatar || undefined)),

      // Position & Contract Info
      department_id: formValues.department_id != null ? Number(formValues.department_id) : undefined,
      job_title_id: formValues.job_title_id != null ? Number(formValues.job_title_id) : undefined,
      hire_date: formValues.hire_date ? dayjs(formValues.hire_date).utc().format('YYYY-MM-DD') : null,
      status_lookup_value_id: formValues.status_lookup_value_id != null ? Number(formValues.status_lookup_value_id) : undefined,
      employment_type_lookup_value_id: formValues.employment_type_lookup_value_id != null ? Number(formValues.employment_type_lookup_value_id) : undefined,
      contract_type_lookup_value_id: formValues.contract_type_lookup_value_id != null ? Number(formValues.contract_type_lookup_value_id) : undefined,
      
      probation_end_date: formValues.probation_end_date ? dayjs(formValues.probation_end_date).utc().format('YYYY-MM-DD') : null,
      reports_to_employee_id: formValues.reports_to_employee_id != null ? Number(formValues.reports_to_employee_id) : undefined,

      // Contact & Bank Info
      phone_number: formValues.phone_number,
      email: formValues.email,
      home_address: formValues.home_address,
      bank_name: formValues.bank_name,
      bank_account_number: formValues.bank_account_number,
      emergency_contact_name: formValues.emergency_contact_name,
      emergency_contact_phone: formValues.emergency_contact_phone,

      // Other fields from CreateEmployeePayload that might be in formValues (e.g., from initialValues if not on form)
      // Backend should ignore them if not part of its Update schema or handle them if they are.
      // Fields like ethnicity, personal_email, work_phone, work_location, notes might come from initialValues
      // and be present in formValues if not cleared.
      // The UpdateEmployeePayload is Partial, so undefined fields are acceptable.
      ...(formValues.ethnicity && { ethnicity: formValues.ethnicity }),
      ...(formValues.personal_email && { personal_email: formValues.personal_email }), // Check API schema if this is supported alongside 'email'
      ...(formValues.work_phone && { work_phone: formValues.work_phone }),          // Check API schema
      ...(formValues.work_location && { work_location: formValues.work_location }),
      ...(formValues.notes && { notes: formValues.notes }),
      // Fields related to initial contract dates are not on this form.
    };
    
    // Clean up undefined properties to keep payload clean.
    // This ensures that only fields with actual values (or null for dates) are sent.
    Object.keys(payload).forEach(keyStr => {
      const key = keyStr as keyof typeof payload;
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    console.log('[EmployeeForm] Constructed payload for submission (explicit, UTC dates, mapped names, cleaned):', JSON.parse(JSON.stringify(payload)));

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
    return departmentOptions.map(dept => ({
      value: dept.value,
      label: dept.title,
    }));
  }, [departmentOptions]);

  const positionOptionsMemo = useMemo(() => {
    if (!positionOptions) return [];
    return positionOptions.map(pos => ({
      value: pos.id,
      label: pos.name,
    }));
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
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip={t('common:loading.generic_loading_text')} /></div>;
  }

  return (
    <Spin spinning={loadingSubmit} tip={t('common:loading.generic_loading_text')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        initialValues={initialValues ? {
          ...initialValues,
          date_of_birth: initialValues.date_of_birth ? dayjs(initialValues.date_of_birth) : undefined,
          hire_date: initialValues.hire_date ? dayjs(initialValues.hire_date) : undefined,
          probation_end_date: initialValues.probationEndDate ? dayjs(initialValues.probationEndDate) : undefined,
          gender_lookup_value_id: initialValues.gender_lookup_value_id != null ? Number(initialValues.gender_lookup_value_id) : undefined,
          status_lookup_value_id: initialValues.status_lookup_value_id != null ? Number(initialValues.status_lookup_value_id) : undefined,
          education_level_lookup_value_id: initialValues.education_level_lookup_value_id != null ? Number(initialValues.education_level_lookup_value_id) : undefined,
          employment_type_lookup_value_id: initialValues.employment_type_lookup_value_id != null ? Number(initialValues.employment_type_lookup_value_id) : undefined,
          marital_status_lookup_value_id: initialValues.marital_status_lookup_value_id != null ? Number(initialValues.marital_status_lookup_value_id) : undefined,
          political_status_lookup_value_id: initialValues.political_status_lookup_value_id != null ? Number(initialValues.political_status_lookup_value_id) : undefined,
          contract_type_lookup_value_id: initialValues.contract_type_lookup_value_id != null ? Number(initialValues.contract_type_lookup_value_id) : undefined,
          department_id: initialValues.department_id != null ? Number(initialValues.department_id) : undefined,
          job_title_id: initialValues.job_title_id != null ? Number(initialValues.job_title_id) : undefined,
          reports_to_employee_id: initialValues.reports_to_employee_id != null ? Number(initialValues.reports_to_employee_id) : undefined,
        } : {}}
      >
      <Row gutter={24}>
        <Col xs={24} md={12} lg={8}>
            <Card title={t('employee:form_card.title_basic_info')} style={{ marginBottom: 24 }}>
              <Form.Item name="last_name" label={t('employee:detail_page.basic_info_tab.label_last_name')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_last_name') }]}>
              <Input />
            </Form.Item>
              <Form.Item name="first_name" label={t('employee:detail_page.basic_info_tab.label_first_name')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_first_name') }]}>
              <Input />
            </Form.Item>
              <Form.Item name="employee_code" label={t('employee:detail_page.basic_info_tab.label_employee_id')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_id') }]}>
              <Input disabled={isEditMode} />
            </Form.Item>
              <Form.Item name="gender_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_gender')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_gender') }]}>
                <Select placeholder={t('employee:list_page.filter_form.placeholder.gender')} loading={loadingLookups} allowClear>
                {genderOptions.map(g => <Option key={g.value as React.Key} value={Number(g.value)}>{g.label}</Option>)}
              </Select>
            </Form.Item>
              <Form.Item name="date_of_birth" label={t('employee:detail_page.basic_info_tab.label_dob')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_dob') }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
              <Form.Item name="id_number" label={t('employee:form_label.id_number')} rules={[{ required: true, message: getRequiredMessage('employee:form_label.id_number') }]}>
              <Input />
            </Form.Item>
              <Form.Item name="marital_status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_marital_status')}>
                <Select placeholder={t('employee:form_placeholder.marital_status')} loading={loadingLookups} allowClear>
                {maritalStatusOptions.map(ms => <Option key={ms.value as React.Key} value={Number(ms.value)}>{ms.label}</Option>)}
              </Select>
            </Form.Item>
              <Form.Item name="education_level_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_education_level')}>
                <Select placeholder={t('employee:list_page.filter_form.placeholder.education_level')} loading={loadingLookups} allowClear>
                {educationLevelOptions.map(el => <Option key={el.value as React.Key} value={Number(el.value)}>{el.label}</Option>)}
              </Select>
            </Form.Item>
              <Form.Item name="political_status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_political_status')}>
                <Select placeholder={t('employee:form_placeholder.political_status')} loading={loadingLookups} allowClear>
                {politicalStatusOptions.map(ps => <Option key={ps.value as React.Key} value={Number(ps.value)}>{ps.label}</Option>)}
              </Select>
            </Form.Item>
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
        </Col>

        <Col xs={24} md={12} lg={8}>
            <Card title={t('employee:form_card.title_position_contract_info')} style={{ marginBottom: 24 }}>
              <Form.Item name="department_id" label={t('employee:detail_page.basic_info_tab.label_department')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_department') }]}>
              <TreeSelect
                style={{ width: '100%' }}
                styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
                  placeholder={t('employee:list_page.filter_form.placeholder.department')}
                allowClear
                treeDefaultExpandAll
                treeData={departmentOptions}
                loading={loadingLookups}
              />
            </Form.Item>
              <Form.Item name="job_title_id" label={t('employee:detail_page.basic_info_tab.label_job_title')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_job_title') }]}>
                <Select placeholder={t('employee:list_page.filter_form.placeholder.job_title')} loading={loadingLookups} allowClear showSearch filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}>
                {positionOptions.map(pos => <Option key={pos.id} value={Number(pos.id)} label={pos.name}>{pos.name}</Option>)}
              </Select>
            </Form.Item>
              <Form.Item name="hire_date" label={t('employee:detail_page.basic_info_tab.label_hire_date')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_hire_date') }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
              <Form.Item name="status_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_employee_status')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_status') }]}>
                <Select placeholder={t('employee:list_page.filter_form.placeholder.status')} loading={loadingLookups} allowClear>
                {statusOptions.map(stat => <Option key={stat.value as React.Key} value={Number(stat.value)}>{stat.label}</Option>)}
              </Select>
            </Form.Item>
              <Form.Item name="employment_type_lookup_value_id" label={t('employee:detail_page.basic_info_tab.label_employment_type')}>
                <Select placeholder={t('employee:list_page.filter_form.placeholder.employment_type')} loading={loadingLookups} allowClear>
                {employmentTypeOptions.map(empType => <Option key={empType.value as React.Key} value={Number(empType.value)}>{empType.label}</Option>)}
              </Select>
            </Form.Item>
              <Form.Item name="contract_type_lookup_value_id" label={t('employee:form_label.contract_type')}>
                <Select placeholder={t('employee:form_placeholder.contract_type')} loading={loadingLookups} allowClear>
                {contractTypeOptions.map(ct => <Option key={ct.value as React.Key} value={Number(ct.value)}>{ct.label}</Option>)}
              </Select>
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
            <Card title={t('employee:form_card.title_contact_bank_info')} style={{ marginBottom: 24 }}>
              <Form.Item name="phone_number" label={t('employee:detail_page.basic_info_tab.label_mobile_phone')} rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_mobile_phone') }]}>
              <Input />
            </Form.Item>
              <Form.Item name="email" label={t('employee:detail_page.basic_info_tab.label_email')} rules={[{ type: 'email', message: t('common:form.validation.email_invalid') }]}>
              <Input type="email" />
            </Form.Item>
              <Form.Item name="home_address" label={t('employee:form_label.home_address')}>
              <Input.TextArea rows={2} />
            </Form.Item>
              <Form.Item name="bank_name" label={t('employee:form_label.bank_name')} rules={[{ required: true, message: getRequiredMessage('employee:form_label.bank_name') }]}>
              <Input />
            </Form.Item>
              <Form.Item name="bank_account_number" label={t('employee:form_label.bank_account_number')} rules={[{ required: true, message: getRequiredMessage('employee:form_label.bank_account_number') }]}>
              <Input />
            </Form.Item>
              <Form.Item name="emergency_contact_name" label={t('employee:form_label.emergency_contact_name')}>
              <Input />
            </Form.Item>
              <Form.Item name="emergency_contact_phone" label={t('employee:form_label.emergency_contact_phone')}>
              <Input />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Button
          onClick={onCancel}
          style={{ marginRight: 8 }}
          disabled={loadingSubmit}
          danger
          >
            {t('common:button.cancel')}
          </Button>
          <Button
          type="primary"
          htmlType="submit"
          loading={loadingSubmit}
          >
            {isEditMode
              ? t('employee:form_shared.button.update_employee')
              : t('employee:form_shared.button.create_employee')}
          </Button>
      </Form.Item>
    </Form>
    </Spin>
  );
};

export default EmployeeForm; 