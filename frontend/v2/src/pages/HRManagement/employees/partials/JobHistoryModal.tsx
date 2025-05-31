import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Select, InputNumber, Input, message, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { employeeService } from '../../../../services/employeeService';
import type { JobHistoryItem, Department, PersonnelCategory, LookupValue, CreateJobHistoryPayload } from '../../types';
import { useTranslation } from 'react-i18next';


interface JobHistoryModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialData?: JobHistoryItem;
  employeeId: string;
  onSubmit: (values: CreateJobHistoryPayload) => Promise<void>;
  onCancel: () => void;
}

const JobHistoryModal: React.FC<JobHistoryModalProps> = ({
  visible,
  mode,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation(['employee', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<PersonnelCategory[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<LookupValue[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(initialData?.department_id);
  const [loadingJobTitles, setLoadingJobTitles] = useState<boolean>(false);

  useEffect(() => {
    const fetchLookups = async () => {
      setLoading(true);
      try {
        const [deptRes, empTypesRes] = await Promise.all([
          employeeService.getDepartmentsLookup(),
          employeeService.getEmploymentTypesLookup(),
        ]);
        setDepartments(deptRes);
        setEmploymentTypes(empTypesRes.map(item => ({ ...item, value: String(item.value) })));
        
        if (initialData?.department_id) {
          setSelectedDepartmentId(initialData.department_id);
          const titlesRes = await employeeService.getPersonnelCategoriesLookup(String(initialData.department_id));
          if (titlesRes) {
            setJobTitles(titlesRes);
          }
        } else {
          setJobTitles([]); 
        }
      } catch (error) {
        message.error(t('employee:detail_page.job_history_tab.modal.message_load_lookups_failed', {t('hr:auto_text_e697a0')}));
        console.error("Failed to load lookup data for Job History Modal:", error);
      }
      finally {
        setLoading(false);
      }
    };
    if (visible) {
        fetchLookups();
    }
  }, [visible, initialData?.department_id, t]);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      form.setFieldsValue({
        ...initialData,
        effectiveDate: initialData.effectiveDate ? dayjs(initialData.effectiveDate) : null,
        department_id: initialData.department_id,
        personnel_category_id: initialData.personnel_category_id,
        employment_type_lookup_value_id: initialData.employment_type_lookup_value_id,
        salary: initialData.salary,
        remarks: initialData.remarks,
      });
      setSelectedDepartmentId(initialData.department_id); 
    } else {
      form.resetFields();
      setSelectedDepartmentId(undefined);
    }
  }, [initialData, mode, form, visible]);

  useEffect(() => {
    if (selectedDepartmentId) {
      setLoadingJobTitles(true);
      employeeService.getPersonnelCategoriesLookup(String(selectedDepartmentId))
        .then(setJobTitles)
        .catch(() => message.error(t('employee:detail_page.job_history_tab.modal.message_load_job_titles_failed', {t('hr:auto_text_e697a0')})))
        .finally(() => setLoadingJobTitles(false));
    } else {
      setJobTitles([]); 
    }
  }, [selectedDepartmentId, t]);

  const handleOk = async () => {
    try {
      setSubmitLoading(true);
      const values = await form.validateFields();
      const submissionData: CreateJobHistoryPayload = {
        department_id: values.department_id,
        personnel_category_id: values.personnel_category_id,
        position_id: values.position_id || 0,
        effectiveDate: values.effectiveDate ? (values.effectiveDate as Dayjs).format('YYYY-MM-DD') : '',
        employment_type_lookup_value_id: values.employment_type_lookup_value_id,
        salary: values.salary,
        remarks: values.remarks,
      };
      await onSubmit(submissionData);
    } catch (errorInfo) {
      console.log('Validation Failed:', errorInfo);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDepartmentChange = (value: number) => {
    setSelectedDepartmentId(value);
    form.setFieldsValue({ personnel_category_id: undefined });
  };

  return (
    <Modal
      title={mode === 'add' ? t('employee:detail_page.job_history_tab.modal.title_add', {t('hr:auto_text_e6b7bb')}) : t('employee:detail_page.job_history_tab.modal.title_edit', {t('hr:auto_text_e7bc96')})}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={submitLoading}
      destroyOnHidden
      maskClosable={false}
    >
      <Spin spinning={loading && departments.length === 0}>
        <Form form={form} layout="vertical" name="jobHistoryForm">
          <Form.Item
            name="effectiveDate"
            label={t('employee:detail_page.job_history_tab.table.column_start_date', {t('hr:auto_text_e7949f')})}
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_effective_date_required', {t('hr:auto___e8afb7')}) }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="department_id"
            label={t('employee:detail_page.job_history_tab.table.column_department', {t('hr:auto_text_e983a8')})}
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_department_required', {t('hr:auto___e8afb7')}) }]}
          >
            <Select 
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_department', {t('hr:auto_text_e8afb7')})}
              onChange={handleDepartmentChange}
              loading={loading && departments.length === 0}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
            />
          </Form.Item>

          <Form.Item
            name="personnel_category_id"
            label={t('employee:detail_page.job_history_tab.table.column_job_title', {t('hr:auto_text_e8818c')})}
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_job_title_required', {t('hr:auto___e8afb7')}) }]}
          >
            <Select 
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_job_title', {t('hr:auto_text_e8afb7')})} 
              loading={loadingJobTitles && selectedDepartmentId !== undefined && jobTitles.length === 0}
              disabled={!selectedDepartmentId}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={jobTitles.map(title => ({ value: title.id, label: title.name }))}
            />
          </Form.Item>

          <Form.Item
            name="employment_type_lookup_value_id"
            label={t('employee:detail_page.job_history_tab.table.column_employment_type', {t('hr:auto_text_e99b87')})}
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_employment_type_required', {t('hr:auto___e8afb7')}) }]}
          >
            <Select 
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_employment_type', {t('hr:auto_text_e8afb7')})} 
              loading={loading && employmentTypes.length === 0}
              options={employmentTypes.map(type => ({ value: Number(type.value), label: type.label }))}
            />
          </Form.Item>

          <Form.Item name="salary" label={t('employee:detail_page.job_history_tab.table.column_salary', {t('hr:auto_text_e896aa')})}>
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_input_salary', {t('hr:auto_text_e8afb7')})} 
              min={0} 
            />
          </Form.Item>

          <Form.Item name="remarks" label={t('common:label.remarks', {t('hr:auto_text_e5a487')})}>
            <Input.TextArea 
              rows={3} 
              placeholder={t('common:placeholder.input_remarks', {t('hr:auto_text_e8afb7')})} 
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default JobHistoryModal; 