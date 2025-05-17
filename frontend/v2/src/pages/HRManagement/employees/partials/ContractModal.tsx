import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Select, Input, message, Spin, Button, Row, Col } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { employeeService } from '../../services/employeeService';
import type { ContractItem, ContractType, ContractStatus, CreateContractPayload, UpdateContractPayload } from '../../types';
import type { FormInstance } from 'antd/lib/form';

const { Option } = Select;

interface ContractModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialData?: ContractItem;
  employeeId: string; // Needed for context, though not directly part of contract form itself for add/edit
  onSubmit: (values: CreateContractPayload | UpdateContractPayload) => Promise<void>;
  onCancel: () => void;
}

interface LookupOption {
  value: string;
  label: string;
}

const ContractModal: React.FC<ContractModalProps> = ({ visible, mode, initialData, employeeId, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contractTypes, setContractTypes] = useState<LookupOption[]>([]);
  const [contractStatuses, setContractStatuses] = useState<LookupOption[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      setLookupsLoading(true);
      try {
        const [typesRes, statusesRes] = await Promise.all([
          employeeService.getContractTypesLookup(),
          employeeService.getContractStatusesLookup(),
        ]);
        setContractTypes(typesRes.map(t => ({ value: t.value, label: t.label })));
        setContractStatuses(statusesRes.map(s => ({ value: s.value, label: s.label })));
      } catch (error) {
        message.error('Failed to load lookup data for contracts.');
        console.error('Error fetching contract lookups:', error);
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
        startDate: initialData.startDate ? dayjs(initialData.startDate) : null,
        endDate: initialData.endDate ? dayjs(initialData.endDate) : null,
      });
    } else if (visible && mode === 'add') {
      form.resetFields();
    }
  }, [visible, mode, initialData, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        startDate: (values.startDate as Dayjs).format('YYYY-MM-DD'),
        endDate: (values.endDate as Dayjs).format('YYYY-MM-DD'),
      };
      await onSubmit(payload);
      setLoading(false);
      // onCancel(); // Usually called by parent after successful submission
    } catch (errorInfo) {
      console.log('Validation Failed:', errorInfo);
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === 'add' ? 'Add New Contract' : 'Edit Contract'}
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
        <Form form={form} layout="vertical" name="contractForm">
          <Form.Item
            name="contractNumber"
            label="Contract Number"
            rules={[{ required: true, message: 'Please input the contract number!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contractType"
            label="Contract Type"
            rules={[{ required: true, message: 'Please select the contract type!' }]}
          >
            <Select placeholder="Select contract type">
              {contractTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: 'Please select the start date!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[
              { required: true, message: 'Please select the end date!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('startDate')) {
                    return Promise.resolve();
                  }
                  if (dayjs(value).isAfter(dayjs(getFieldValue('startDate')))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('End date must be after start date!'));
                },
              }),
            ]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select the status!' }]}
          >
            <Select placeholder="Select status">
              {contractStatuses.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default ContractModal;