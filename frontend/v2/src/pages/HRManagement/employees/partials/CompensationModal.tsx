import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Select, InputNumber, Input, message, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { employeeService } from '../../../../services/employeeService';
import type { CompensationItem, PayFrequency, CreateCompensationPayload, UpdateCompensationPayload } from '../../types';

const { Option } = Select;

interface CompensationModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialData?: CompensationItem;
  employeeId: string; // Needed for context
  onSubmit: (values: CreateCompensationPayload | UpdateCompensationPayload) => Promise<void>;
  onCancel: () => void;
}

interface LookupOption {
  value: string;
  label: string;
}

const CompensationModal: React.FC<CompensationModalProps> = ({ visible, mode, initialData, employeeId, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [payFrequencies, setPayFrequencies] = useState<LookupOption[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      setLookupsLoading(true);
      try {
        const freqRes = await employeeService.getPayFrequenciesLookup();
        setPayFrequencies(freqRes.map(f => ({ value: f.value, label: f.label })));
      } catch (error) {
        message.error('Failed to load lookup data for compensation.');
        console.error('Error fetching compensation lookups:', error);
      }
      setLookupsLoading(false);
    };

    if (visible) {
      fetchLookups();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && mode === 'edit' && initialData) {
      form.setFieldsValue({
        ...initialData,
        effectiveDate: initialData.effectiveDate ? dayjs(initialData.effectiveDate) : null,
      });
    } else if (visible && mode === 'add') {
      form.resetFields();
      form.setFieldsValue({ currency: 'CNY' }); // Default currency
    }
  }, [visible, mode, initialData, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        effectiveDate: (values.effectiveDate as Dayjs).format('YYYY-MM-DD'),
      };
      await onSubmit(payload);
      setLoading(false);
    } catch (errorInfo) {
      console.log('Validation Failed:', errorInfo);
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === 'add' ? 'Add New Compensation Record' : 'Edit Compensation Record'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
      width={600}
    >
      {lookupsLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin>
            <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>Loading options...</div>
          </Spin>
        </div>
      ) : (
        <Form form={form} layout="vertical" name="compensationForm">
          <Form.Item
            name="effectiveDate"
            label="Effective Date"
            rules={[{ required: true, message: 'Please select the effective date!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="basicSalary"
            label="Basic Salary"
            rules={[{ required: true, message: 'Please input the basic salary!', type: 'number' }]}
          >
            <InputNumber style={{ width: '100%' }} precision={2} min={0} />
          </Form.Item>
          <Form.Item
            name="allowances"
            label="Allowances"
            rules={[{ type: 'number', message: 'Please input a valid number for allowances' }]}
          >
            <InputNumber style={{ width: '100%' }} precision={2} min={0} />
          </Form.Item>
          <Form.Item
            name="payFrequency"
            label="Pay Frequency"
            rules={[{ required: true, message: 'Please select the pay frequency!' }]}
          >
            <Select placeholder="Select pay frequency">
              {payFrequencies.map(freq => (
                <Option key={freq.value} value={freq.value}>{freq.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="currency"
            label="Currency"
            initialValue="CNY" // Also set in useEffect for add mode reset
            rules={[{ required: true, message: 'Please input the currency code (e.g., CNY)'}]}
          >
            <Input maxLength={3} />
          </Form.Item>
          <Form.Item
            name="changeReason"
            label="Reason for Change"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default CompensationModal;