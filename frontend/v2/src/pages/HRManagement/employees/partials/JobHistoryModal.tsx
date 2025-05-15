import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Select, InputNumber, Input, message, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { employeeService } from '../../../../services/employeeService';
import type { JobHistoryItem, Department, PositionItem, EmploymentType } from '../../types';

const { Option } = Select;

interface JobHistoryModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialData?: JobHistoryItem;
  employeeId: string; // Needed for context or if API requires it directly for add/update
  onSubmit: (values: Omit<JobHistoryItem, 'id' | 'employeeId' | 'departmentName' | 'positionName'>) => Promise<void>;
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<{value: string, label: string}[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | undefined>(initialData?.departmentId);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoading(true);
        const [deptRes, empTypesRes] = await Promise.all([
          employeeService.getDepartmentsLookup(),
          employeeService.getEmploymentTypesLookup(),
        ]);
        setDepartments(deptRes);
        setEmploymentTypes(empTypesRes);
        if (initialData?.departmentId) {
          setSelectedDepartmentId(initialData.departmentId);
          const posRes = await employeeService.getPositionsLookup(initialData.departmentId);
          setPositions(posRes);
        } else {
          // Optionally fetch all positions or leave it empty until a department is selected
          setPositions([]); 
        }
      } catch (error) {
        message.error('无法加载下拉选项数据');
        console.error("Failed to load lookup data for Job History Modal:", error);
      }
      finally {
        setLoading(false);
      }
    };
    if (visible) {
        fetchLookups();
    }
  }, [visible, initialData?.departmentId]); // Re-fetch positions if initial department changes

  useEffect(() => {
    if (initialData && mode === 'edit') {
      form.setFieldsValue({
        ...initialData,
        effectiveDate: initialData.effectiveDate ? dayjs(initialData.effectiveDate) : null,
      });
      setSelectedDepartmentId(initialData.departmentId); 
    } else {
      form.resetFields();
      setSelectedDepartmentId(undefined);
      // setPositions([]); // Clear positions when resetting for 'add' mode or if initialData is gone
    }
  }, [initialData, mode, form, visible]);

  // Fetch positions when department changes
  useEffect(() => {
    if (selectedDepartmentId) {
      setLoading(true);
      employeeService.getPositionsLookup(selectedDepartmentId)
        .then(setPositions)
        .catch(() => message.error('无法加载职位数据'))
        .finally(() => setLoading(false));
    } else {
      setPositions([]); // Clear positions if no department is selected
    }
  }, [selectedDepartmentId]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const submissionData = {
        ...values,
        effectiveDate: values.effectiveDate ? (values.effectiveDate as Dayjs).format('YYYY-MM-DD') : undefined,
      };
      await onSubmit(submissionData);
      form.resetFields(); 
      // parent component will handle closing modal on successful submit
    } catch (errorInfo) {
      console.log('Validation Failed:', errorInfo);
      message.error('请检查表单输入!');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartmentId(value);
    form.setFieldsValue({ positionId: undefined }); // Reset position when department changes
  };

  return (
    <Modal
      title={mode === 'add' ? '添加岗位历史' : '编辑岗位历史'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose // Reset form state when modal is closed
      maskClosable={false}
    >
      <Spin spinning={loading && departments.length === 0}> {/* Initial full load spinner */}
        <Form form={form} layout="vertical" name="jobHistoryForm">
          <Form.Item
            name="effectiveDate"
            label="生效日期"
            rules={[{ required: true, message: '请输入生效日期!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="departmentId"
            label="部门"
            rules={[{ required: true, message: '请选择部门!' }]}
          >
            <Select 
              placeholder="请选择部门"
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
            name="positionId"
            label="职位"
            rules={[{ required: true, message: '请选择职位!' }]}
          >
            <Select 
              placeholder="请选择职位" 
              loading={loading && selectedDepartmentId !== undefined && positions.length === 0}
              disabled={!selectedDepartmentId}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={positions.map(pos => ({ value: pos.id, label: pos.name }))}
            />
          </Form.Item>

          <Form.Item
            name="employmentType"
            label="雇佣类型"
            rules={[{ required: true, message: '请选择雇佣类型!' }]}
          >
            <Select placeholder="请选择雇佣类型" loading={loading && employmentTypes.length === 0} options={employmentTypes} />
          </Form.Item>

          <Form.Item name="salary" label="薪资">
            <InputNumber style={{ width: '100%' }} placeholder="请输入薪资" min={0} />
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default JobHistoryModal; 