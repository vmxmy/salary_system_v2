import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Select, InputNumber, Input, Button, message, Row, Col, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { employeeService } from '../../../../services/employeeService';
import type { JobHistoryItem, Department, JobTitle, LookupValue, CreateJobHistoryPayload } from '../../types';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

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
  employeeId,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation(['employee', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<LookupValue[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(initialData?.department_id);

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
          const titlesRes = await employeeService.getJobTitlesLookup(String(initialData.department_id));
          setJobTitles(titlesRes);
        } else {
          setJobTitles([]); 
        }
      } catch (error) {
        message.error(t('employee:detail_page.job_history_tab.modal.message_load_lookups_failed', '无法加载下拉选项数据'));
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
        job_title_id: initialData.job_title_id,
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
      setLoading(true);
      employeeService.getJobTitlesLookup(String(selectedDepartmentId))
        .then(setJobTitles)
        .catch(() => message.error(t('employee:detail_page.job_history_tab.modal.message_load_job_titles_failed', '无法加载职位数据')))
        .finally(() => setLoading(false));
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
        job_title_id: values.job_title_id,
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
    form.setFieldsValue({ job_title_id: undefined });
  };

  return (
    <Modal
      title={mode === 'add' ? t('employee:detail_page.job_history_tab.modal.title_add', '添加岗位历史') : t('employee:detail_page.job_history_tab.modal.title_edit', '编辑岗位历史')}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={submitLoading}
      destroyOnClose
      maskClosable={false}
    >
      <Spin spinning={loading && departments.length === 0}>
        <Form form={form} layout="vertical" name="jobHistoryForm">
          <Form.Item
            name="effectiveDate"
            label={t('employee:detail_page.job_history_tab.table.column_start_date', '生效日期')}
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_effective_date_required', '请输入生效日期!') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="department_id"
            label={t('employee:detail_page.job_history_tab.table.column_department', '部门')}
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_department_required', '请选择部门!') }]}
          >
            <Select 
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_department', '请选择部门')}
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
            name="job_title_id"
            label={t('employee:detail_page.job_history_tab.table.column_job_title', '职位')}
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_job_title_required', '请选择职位!') }]}
          >
            <Select 
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_job_title', '请选择职位')} 
              loading={loading && selectedDepartmentId !== undefined && jobTitles.length === 0}
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
            label={t('employee:detail_page.job_history_tab.table.column_employment_type', '雇佣类型')}
            rules={[{ required: true, message: t('employee:detail_page.job_history_tab.modal.validation_employment_type_required', '请选择雇佣类型!') }]}
          >
            <Select 
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_select_employment_type', '请选择雇佣类型')} 
              loading={loading && employmentTypes.length === 0}
              options={employmentTypes.map(type => ({ value: Number(type.value), label: type.label }))}
            />
          </Form.Item>

          <Form.Item name="salary" label={t('employee:detail_page.job_history_tab.table.column_salary', '薪资')}>
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder={t('employee:detail_page.job_history_tab.modal.placeholder_input_salary', '请输入薪资')} 
              min={0} 
            />
          </Form.Item>

          <Form.Item name="remarks" label={t('common:label.remarks', '备注')}>
            <Input.TextArea 
              rows={3} 
              placeholder={t('common:placeholder.input_remarks', '请输入备注')} 
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default JobHistoryModal; 