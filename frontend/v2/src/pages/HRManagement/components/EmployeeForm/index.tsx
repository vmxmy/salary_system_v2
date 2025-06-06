import React, { useEffect, useState, useMemo } from 'react';
import { Form, Button, Row, Col, Spin, Upload, message, App } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { useTranslation } from 'react-i18next';
import { lookupService } from '../../../../services/lookupService'; // Adjusted path
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  LookupItem,
} from '../../types'; // Adjusted path

// Import new components and hooks
import BasicInfoTab from './BasicInfoTab';
import PositionContractTab from './PositionContractTab';
import ContactBankTab from './ContactBankTab';
import { useLookups } from './hooks/useLookups';
import { transformToTreeData, transformListToSelectOptions } from './utils/transforms';
import UnifiedTabs from '../../../../components/common/UnifiedTabs';

interface EmployeeFormProps {
  form: FormInstance; 
  initialValues?: Partial<Employee>;
  isEditMode: boolean;
  onSubmit: (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>;
  onCancel: () => void;
  loadingSubmit: boolean;
}

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
  
  const {
    loadingLookups,
    departmentOptions,
    personnelCategoryOptions,
    positionOptions,
    genderOptions,
    educationLevelOptions,
    employmentTypeOptions,
    maritalStatusOptions,
    politicalStatusOptions,
    contractTypeOptions,
    statusOptions,
    jobPositionLevelOptions
  } = useLookups();

  const [avatarFileList, setAvatarFileList] = useState<UploadFile[]>([]);
  const [activeTabKey, setActiveTabKey] = useState('1');

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0 && !loadingLookups) {
      
      const processedValues: Record<string, any> = {
        ...initialValues,
        date_of_birth: initialValues.date_of_birth ? dayjs(initialValues.date_of_birth).isValid() ? dayjs(initialValues.date_of_birth) : undefined : undefined,
        first_work_date: initialValues.first_work_date ? dayjs(initialValues.first_work_date).isValid() ? dayjs(initialValues.first_work_date) : undefined : undefined,
        hire_date: initialValues.hire_date ? dayjs(initialValues.hire_date).isValid() ? dayjs(initialValues.hire_date) : undefined : undefined,
        career_position_level_date: initialValues.career_position_level_date ? dayjs(initialValues.career_position_level_date).isValid() ? dayjs(initialValues.career_position_level_date) : undefined : undefined,
        current_position_start_date: initialValues.current_position_start_date ? dayjs(initialValues.current_position_start_date).isValid() ? dayjs(initialValues.current_position_start_date) : undefined : undefined,
        probationEndDate: initialValues.probationEndDate ? dayjs(initialValues.probationEndDate).isValid() ? dayjs(initialValues.probationEndDate) : undefined : undefined,
        initialContractStartDate: initialValues.initialContractStartDate ? dayjs(initialValues.initialContractStartDate).isValid() ? dayjs(initialValues.initialContractStartDate) : undefined : undefined,
        initialContractEndDate: initialValues.initialContractEndDate ? dayjs(initialValues.initialContractEndDate).isValid() ? dayjs(initialValues.initialContractEndDate) : undefined : undefined,
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
      
      form.setFieldsValue(processedValues);
      
      form.validateFields().catch(() => {
        // We don't really care about the validation result here, just want to trigger an update.
      });
      
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
  }, [initialValues, form, loadingLookups, personnelCategoryOptions]); // Added personnelCategoryOptions to dependencies

  const handleFormSubmit = async () => { // Removed formValues parameter as we get all values from form instance
    if (process.env.NODE_ENV === 'development') {
    }

    const allFormData = form.getFieldsValue(true);
    
    const requiredFieldsTab1 = ['last_name', 'first_name', 'gender_lookup_value_id', 'date_of_birth', 'id_number'];
    const requiredFieldsTab2 = ['department_id', 'personnel_category_id', 'actual_position_id', 'hire_date', 'status_lookup_value_id'];
    const requiredFieldsTab3 = ['phone_number', 'bank_name', 'bank_account_number'];


    const missingFieldsTab1 = requiredFieldsTab1.filter(field => !allFormData[field]);
    if (missingFieldsTab1.length > 0) {
      antdMessage.error(t('common:message.missing_required_fields_in_tab_param', {tabName: t('employee:form_card.title_basic_info')}));
      setActiveTabKey('1');
      return;
    }

    const missingFieldsTab2 = requiredFieldsTab2.filter(field => !allFormData[field]);
    if (missingFieldsTab2.length > 0) {
      antdMessage.error(t('common:message.missing_required_fields_in_tab_param', {tabName: t('employee:form_card.title_position_contract_info')}));
      setActiveTabKey('2');
      return;
    }
    
    const missingFieldsTab3 = requiredFieldsTab3.filter(field => !allFormData[field]);
     if (missingFieldsTab3.length > 0) {
      antdMessage.error(t('common:message.missing_required_fields_in_tab_param', {tabName: t('employee:form_card.title_contact_bank_info')}));
      setActiveTabKey('3');
      return;
    }


    if (process.env.NODE_ENV === 'development') {
    }
    
    const processedFinalPayload: Partial<CreateEmployeePayload | UpdateEmployeePayload> = {
      first_name: allFormData.first_name,
      last_name: allFormData.last_name,
      ...(isEditMode ? {} : (allFormData.employee_code ? { employee_code: allFormData.employee_code } : {})),
      gender_lookup_value_id: allFormData.gender_lookup_value_id != null 
                               ? Number(allFormData.gender_lookup_value_id)
                               : undefined,
      gender_lookup_value_name: allFormData.gender_lookup_value_id != null 
                               ? genderOptions.find(opt => opt.id === Number(allFormData.gender_lookup_value_id))?.name 
                               : undefined,
      date_of_birth: allFormData.date_of_birth ? dayjs(allFormData.date_of_birth).utc().format('YYYY-MM-DD'): undefined,
      id_number: allFormData.id_number,
      marital_status_lookup_value_id: allFormData.marital_status_lookup_value_id != null 
                                       ? Number(allFormData.marital_status_lookup_value_id)
                                       : undefined,
      marital_status_lookup_value_name: allFormData.marital_status_lookup_value_id != null 
                                       ? maritalStatusOptions.find(opt => opt.id === Number(allFormData.marital_status_lookup_value_id))?.name 
                                       : undefined,
      education_level_lookup_value_id: allFormData.education_level_lookup_value_id != null 
                                       ? Number(allFormData.education_level_lookup_value_id)
                                       : undefined,
      education_level_lookup_value_name: allFormData.education_level_lookup_value_id != null 
                                       ? educationLevelOptions.find(opt => opt.id === Number(allFormData.education_level_lookup_value_id))?.name 
                                       : undefined,
      political_status_lookup_value_id: allFormData.political_status_lookup_value_id != null 
                                       ? Number(allFormData.political_status_lookup_value_id)
                                       : undefined,
      political_status_lookup_value_name: allFormData.political_status_lookup_value_id != null 
                                       ? politicalStatusOptions.find(opt => opt.id === Number(allFormData.political_status_lookup_value_id))?.name 
                                       : undefined,
      nationality: allFormData.nationality,
      ethnicity: allFormData.ethnicity,
      first_work_date: allFormData.first_work_date ? dayjs(allFormData.first_work_date).utc().format('YYYY-MM-DD'): undefined,
      interrupted_service_years: allFormData.interrupted_service_years != null ? Number(allFormData.interrupted_service_years) : undefined,

      avatar: allFormData.avatar || (avatarFileList.length > 0 && avatarFileList[0].url) || (avatarFileList.length > 0 && avatarFileList[0].response?.url) || undefined,

      department_id: allFormData.department_id != null 
                    ? Number(allFormData.department_id)
                    : undefined,
      // department_name: // This needs to be derived carefully from tree data
      personnel_category_id: allFormData.personnel_category_id != null 
                           ? Number(allFormData.personnel_category_id)
                           : undefined,
      // personnel_category_name: // This needs to be derived carefully from tree data
      actual_position_id: allFormData.actual_position_id != null 
                        ? Number(allFormData.actual_position_id)
                        : undefined,
      position_name: allFormData.actual_position_id != null 
                   ? positionOptions.find(opt => opt.value === Number(allFormData.actual_position_id))?.label 
                   : undefined,
      hire_date: allFormData.hire_date ? dayjs(allFormData.hire_date).utc().format('YYYY-MM-DD'): undefined,
      status_lookup_value_id: allFormData.status_lookup_value_id != null 
                             ? Number(allFormData.status_lookup_value_id)
                             : undefined,
      status_lookup_value_name: allFormData.status_lookup_value_id != null 
                              ? statusOptions.find(opt => opt.id === Number(allFormData.status_lookup_value_id))?.name 
                              : undefined,
      employment_type_lookup_value_id: allFormData.employment_type_lookup_value_id != null 
                                     ? Number(allFormData.employment_type_lookup_value_id)
                                     : undefined,
      employment_type_lookup_value_name: allFormData.employment_type_lookup_value_id != null 
                                      ? employmentTypeOptions.find(opt => opt.id === Number(allFormData.employment_type_lookup_value_id))?.name 
                                      : undefined,
      contract_type_lookup_value_id: allFormData.contract_type_lookup_value_id != null 
                                   ? Number(allFormData.contract_type_lookup_value_id)
                                   : undefined,
      contract_type_lookup_value_name: allFormData.contract_type_lookup_value_id != null 
                                    ? contractTypeOptions.find(opt => opt.id === Number(allFormData.contract_type_lookup_value_id))?.name 
                                    : undefined,
      
      phone_number: allFormData.phone_number,
      email: allFormData.email,
      home_address: allFormData.home_address,
      bank_name: allFormData.bank_name,
      bank_account_number: allFormData.bank_account_number,
      emergency_contact_name: allFormData.emergency_contact_name,
      emergency_contact_phone: allFormData.emergency_contact_phone,
    };
    
    // Helper function to find name in tree data
    const findNameInTree = (id: number, tree: any[]): string | undefined => {
      for (const item of tree) {
        if (item.value === id) return item.title;
        if (item.children) {
          const found = findNameInTree(id, item.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    if (processedFinalPayload.department_id) {
      processedFinalPayload.department_name = findNameInTree(Number(processedFinalPayload.department_id), departmentOptions);
    }
    if (processedFinalPayload.personnel_category_id) {
      processedFinalPayload.personnel_category_name = findNameInTree(Number(processedFinalPayload.personnel_category_id), personnelCategoryOptions);
    }
    
    Object.keys(processedFinalPayload).forEach(keyStr => {
      const key = keyStr as keyof typeof processedFinalPayload;
      if (processedFinalPayload[key] === undefined) {
        delete processedFinalPayload[key];
      }
    });

    if (process.env.NODE_ENV === 'development') {
    }

    try {
        if (isEditMode && initialValues?.id) {
            if (process.env.NODE_ENV === 'development') {
            }
            await onSubmit(processedFinalPayload as UpdateEmployeePayload); // Ensure type assertion
        } else {
            if (process.env.NODE_ENV === 'development') {
            }
            // Additional check for create, though tab validation should cover this
            if (!processedFinalPayload.first_name || !processedFinalPayload.last_name || 
                !processedFinalPayload.hire_date || !processedFinalPayload.status_lookup_value_id) { // check ID
                antdMessage.error(t('common:message.missing_required_fields'));
                return;
            }
            await onSubmit(processedFinalPayload as CreateEmployeePayload); // Ensure type assertion
        }
    } catch (error) {
        // The onSubmit handler itself should show messages for API errors.
        // antdMessage.error(t('common:message.submission_error')); 
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
    } else if (info.file.status === 'error') {
      antdMessage.error(t('common:message.upload_failed_param', { fileName: info.file.name }));
    }
  };

  const departmentOptionsMemo = useMemo(() => departmentOptions, [departmentOptions]);
  const personnelCategoryOptionsMemo = useMemo(() => personnelCategoryOptions, [personnelCategoryOptions]);
  const positionOptionsMemo = useMemo(() => positionOptions, [positionOptions]);
  const employmentTypeOptionsMemo = useMemo(() => {
    return employmentTypeOptions.map(empType => ({
      value: empType.value,
      label: empType.label,
    }));
  }, [employmentTypeOptions]);
  const statusOptionsMemo = useMemo(() => {
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

  const tabItems = [
    {
      key: '1',
      label: t('employee:form_card.title_basic_info'),
      children: (
        <BasicInfoTab
          genderOptions={genderOptions}
          maritalStatusOptions={maritalStatusOptions}
          educationLevelOptions={educationLevelOptions}
          politicalStatusOptions={politicalStatusOptions}
          avatarFileList={avatarFileList}
          handleAvatarChange={handleAvatarChange}
          getRequiredMessage={getRequiredMessage}
          loadingLookups={loadingLookups}
          isEditMode={isEditMode}
        />
      ),
    },
    {
      key: '2',
      label: t('employee:form_card.title_position_contract_info'),
      children: (
        <PositionContractTab
          departmentOptions={departmentOptionsMemo}
          personnelCategoryOptions={personnelCategoryOptionsMemo}
          positionOptions={positionOptionsMemo}
          employmentTypeOptions={employmentTypeOptions} // pass original for Option mapping
          statusOptions={statusOptions} // pass original for Option mapping
          contractTypeOptions={contractTypeOptions}
          jobPositionLevelOptions={jobPositionLevelOptions}
          getRequiredMessage={getRequiredMessage}
          loadingLookups={loadingLookups}
        />
      ),
    },
    {
      key: '3',
      label: t('employee:form_card.title_contact_bank_info'),
      children: <ContactBankTab getRequiredMessage={getRequiredMessage} />,
    },
  ];

  const onTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  return (
    <Spin spinning={loadingSubmit || loadingLookups}> {/* Combined loading state for spin */}
      <Form layout="vertical" form={form} onFinish={handleFormSubmit} component={false}> {/* component={false} for Tabs */}
        <UnifiedTabs 
          activeKey={activeTabKey} 
          onChange={onTabChange}
          size="large"
          type="line" // forceRender is implicitly handled by antd's default behavior or can be added to items if needed
          items={tabItems.map(item => ({ ...item, forceRender: true }))} // Spread item and add forceRender if it's a valid prop for items' children
        />

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button type="primary" onClick={() => form.submit()} loading={loadingSubmit}> {/* Use form.submit() */}
            {isEditMode ? t('common:button.update') : t('common:button.create')}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={onCancel} disabled={loadingSubmit}>
            {t('common:button.cancel')}
          </Button>
        </div>
      </Form>
    </Spin>
  );
};

export default EmployeeForm;
