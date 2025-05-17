import React, { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Card, TreeSelect, Spin, Upload, message } from 'antd';
import ActionButton from '../../../components/common/ActionButton';
import type { FormInstance } from 'antd/es/form';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { lookupService } from '../../../services/lookupService';
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  LookupItem,
  Department as DepartmentType,
  JobTitle,
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
  const { t } = useTranslation();
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
        message.error(t('employee_form.message_load_options_failed'));
        console.error('Failed to load lookups:', error);
      }
      setLoadingLookups(false);
    };
    fetchLookups();
  }, [t]);

  useEffect(() => {
    if (initialValues && !loadingLookups) {
      const processedValues: Record<string, any> = {
        ...initialValues,
        dob: initialValues.dob ? (dayjs(initialValues.dob, 'YYYY-MM-DD', true).isValid() ? dayjs(initialValues.dob, 'YYYY-MM-DD', true) : undefined) : undefined,
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
      
      delete processedValues.name;
      delete processedValues.departmentId;
      delete processedValues.positionId;

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
    const payload: CreateEmployeePayload | UpdateEmployeePayload = {
      ...formValues,
      dob: formValues.dob ? dayjs(formValues.dob).format('YYYY-MM-DD') : null,
      hire_date: formValues.hire_date ? dayjs(formValues.hire_date).format('YYYY-MM-DD') : null,
      probation_end_date: formValues.probation_end_date ? dayjs(formValues.probation_end_date).format('YYYY-MM-DD') : null,
      gender_lookup_value_id: formValues.gender_lookup_value_id != null ? Number(formValues.gender_lookup_value_id) : undefined,
      status_lookup_value_id: formValues.status_lookup_value_id != null ? Number(formValues.status_lookup_value_id) : undefined,
      education_level_lookup_value_id: formValues.education_level_lookup_value_id != null ? Number(formValues.education_level_lookup_value_id) : undefined,
      employment_type_lookup_value_id: formValues.employment_type_lookup_value_id != null ? Number(formValues.employment_type_lookup_value_id) : undefined,
      marital_status_lookup_value_id: formValues.marital_status_lookup_value_id != null ? Number(formValues.marital_status_lookup_value_id) : undefined,
      political_status_lookup_value_id: formValues.political_status_lookup_value_id != null ? Number(formValues.political_status_lookup_value_id) : undefined,
      contract_type_lookup_value_id: formValues.contract_type_lookup_value_id != null ? Number(formValues.contract_type_lookup_value_id) : undefined,
      department_id: formValues.department_id != null ? Number(formValues.department_id) : undefined,
      job_title_id: formValues.job_title_id != null ? Number(formValues.job_title_id) : undefined,
      avatar: avatarFileList.length > 0 && avatarFileList[0].url 
              ? avatarFileList[0].url 
              : (avatarFileList.length > 0 && avatarFileList[0].response?.url 
              ? avatarFileList[0].response.url 
              : (formValues.avatar || undefined)),
    };

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
      message.success(t('employee_form.message_file_upload_success_param', { fileName: info.file.name }));
      form.setFieldsValue({ avatar: info.file.response.url }); 
    } else if (info.file.status === 'error') {
      message.error(t('employee_form.message_file_upload_failed_param', { fileName: info.file.name }));
    }
  };

  if (loadingLookups) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip={t('employee_form.spin_tip_loading_options')} /></div>;
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
      <Row gutter={24}>
        <Col xs={24} md={12} lg={8}>
          <Card title={t('employee_form.card_title_basic_info')} style={{ marginBottom: 24 }}>
            <Form.Item name="last_name" label={t('employee_form.label_last_name')} rules={[{ required: true, message: t('employee_form.validation_last_name_required') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="first_name" label={t('employee_form.label_first_name')} rules={[{ required: true, message: t('employee_form.validation_first_name_required') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="employee_code" label={t('employee_form.label_employee_code')} rules={[{ required: true, message: t('employee_form.validation_employee_code_required') }]}>
              <Input disabled={isEditMode} />
            </Form.Item>
            <Form.Item name="gender_lookup_value_id" label={t('employee_form.label_gender')} rules={[{ required: true, message: t('employee_form.validation_gender_required') }]}>
              <Select placeholder={t('employee_form.placeholder_gender')} loading={loadingLookups} allowClear>
                {genderOptions.map(g => <Option key={g.value as React.Key} value={Number(g.value)}>{g.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="dob" label={t('employee_form.label_dob')} rules={[{ required: true, message: t('employee_form.validation_dob_required') }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="id_number" label={t('employee_form.label_id_number')} rules={[{ required: true, message: t('employee_form.validation_id_number_required') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="marital_status_lookup_value_id" label={t('employee_form.label_marital_status')}>
              <Select placeholder={t('employee_form.placeholder_marital_status')} loading={loadingLookups} allowClear>
                {maritalStatusOptions.map(ms => <Option key={ms.value as React.Key} value={Number(ms.value)}>{ms.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="education_level_lookup_value_id" label={t('employee_form.label_education_level')}>
              <Select placeholder={t('employee_form.placeholder_education_level')} loading={loadingLookups} allowClear>
                {educationLevelOptions.map(el => <Option key={el.value as React.Key} value={Number(el.value)}>{el.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="political_status_lookup_value_id" label={t('employee_form.label_political_status')}>
              <Select placeholder={t('employee_form.placeholder_political_status')} loading={loadingLookups} allowClear>
                {politicalStatusOptions.map(ps => <Option key={ps.value as React.Key} value={Number(ps.value)}>{ps.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="nationality" label={t('employee_form.label_nationality')}>
              <Input />
            </Form.Item>
            <Form.Item name="avatar" label={t('employee_form.label_avatar')}>
              <Upload 
                action="/api/v2/files/upload" 
                listType="picture-card"
                fileList={avatarFileList}
                onChange={handleAvatarChange}
                name="file" 
                maxCount={1}
              >
                {avatarFileList.length < 1 && <div><UploadOutlined /><div style={{marginTop: 8}}>{t('employee_form.upload_text')}</div></div>}
              </Upload>
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Card title={t('employee_form.card_title_position_contract_info')} style={{ marginBottom: 24 }}>
            <Form.Item name="department_id" label={t('employee_form.label_department')} rules={[{ required: true, message: t('employee_form.validation_department_required') }]}>
              <TreeSelect
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder={t('employee_form.placeholder_department')}
                allowClear
                treeDefaultExpandAll
                treeData={departmentOptions}
                loading={loadingLookups}
              />
            </Form.Item>
            <Form.Item name="job_title_id" label={t('employee_form.label_job_title')} rules={[{ required: true, message: t('employee_form.validation_job_title_required') }]}>
              <Select placeholder={t('employee_form.placeholder_job_title')} loading={loadingLookups} allowClear showSearch filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}>
                {positionOptions.map(pos => <Option key={pos.id} value={Number(pos.id)} label={pos.name}>{pos.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="hire_date" label={t('employee_form.label_hire_date')} rules={[{ required: true, message: t('employee_form.validation_hire_date_required') }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="status_lookup_value_id" label={t('employee_form.label_employee_status')} rules={[{ required: true, message: t('employee_form.validation_employee_status_required') }]}>
              <Select placeholder={t('employee_form.placeholder_employee_status')} loading={loadingLookups} allowClear>
                {statusOptions.map(stat => <Option key={stat.value as React.Key} value={Number(stat.value)}>{stat.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="employment_type_lookup_value_id" label={t('employee_form.label_employment_type')}>
              <Select placeholder={t('employee_form.placeholder_employment_type')} loading={loadingLookups} allowClear>
                {employmentTypeOptions.map(empType => <Option key={empType.value as React.Key} value={Number(empType.value)}>{empType.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="contract_type_lookup_value_id" label={t('employee_form.label_contract_type')}>
              <Select placeholder={t('employee_form.placeholder_contract_type')} loading={loadingLookups} allowClear>
                {contractTypeOptions.map(ct => <Option key={ct.value as React.Key} value={Number(ct.value)}>{ct.label}</Option>)}
              </Select>
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Card title={t('employee_form.card_title_contact_bank_info')} style={{ marginBottom: 24 }}>
            <Form.Item name="mobile_phone" label={t('employee_form.label_mobile_phone')}>
              <Input />
            </Form.Item>
            <Form.Item name="work_email" label={t('employee_form.label_work_email')}>
              <Input type="email" />
            </Form.Item>
            <Form.Item name="home_address" label={t('employee_form.label_home_address')}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="bank_name" label={t('employee_form.label_bank_name')}>
              <Input />
            </Form.Item>
            <Form.Item name="bank_account_number" label={t('employee_form.label_bank_account_number')}>
              <Input />
            </Form.Item>
            <Form.Item name="emergency_contact_name" label={t('employee_form.label_emergency_contact_name')}>
              <Input />
            </Form.Item>
            <Form.Item name="emergency_contact_phone" label={t('employee_form.label_emergency_contact_phone')}>
              <Input />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
        <ActionButton
          onClick={onCancel}
          style={{ marginRight: 8 }}
          disabled={loadingSubmit}
          actionType="delete"
          danger
          tooltipTitle={t('employee_form.tooltip_cancel')}
        />
        <ActionButton
          type="primary"
          htmlType="submit"
          loading={loadingSubmit}
          actionType="edit"
          tooltipTitle={isEditMode
            ? t('employee_form.tooltip_update')
            : t('employee_form.tooltip_create')}
        />
      </Form.Item>
    </Form>
  );
};

export default EmployeeForm; 