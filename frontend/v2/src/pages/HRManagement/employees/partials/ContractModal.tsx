import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Select, Input, message, Spin, Button, Row, Col } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { employeeService } from '../../../../services/employeeService';
import type { ContractItem, CreateContractPayload, UpdateContractPayload, LookupValue } from '../../types';
import type { FormInstance } from 'antd/lib/form';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface ContractModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialData?: ContractItem;
  employeeId: string; // Needed for context, though not directly part of contract form itself for add/edit
  onSubmit: (values: CreateContractPayload | UpdateContractPayload) => Promise<void>;
  onCancel: () => void;
}

interface InternalLookupOption {
  value: string;
  label: string;
}

const ContractModal: React.FC<ContractModalProps> = ({ visible, mode, initialData, employeeId, onSubmit, onCancel }) => {
  const { t } = useTranslation(['employee', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contractTypes, setContractTypes] = useState<InternalLookupOption[]>([]);
  const [contractStatuses, setContractStatuses] = useState<InternalLookupOption[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      setLookupsLoading(true);
      try {
        const [typesRes, statusesRes] = await Promise.all([
          employeeService.getContractTypesLookup(),
          employeeService.getContractStatusesLookup(),
        ]);
        setContractTypes(typesRes.map((item: any) => ({ 
          value: String(item.id || item.value || item.value_code || ''), 
          label: item.label || item.value_name || String(item.id) 
        })));
        setContractStatuses(statusesRes.map((item: any) => ({ 
          value: String(item.id || item.value || item.value_code || ''), 
          label: item.label || item.value_name || String(item.id) 
        })));
      } catch (error) {
        message.error(t('employee:detail_page.contracts_tab.modal.message_load_lookups_failed'));
      }
      setLookupsLoading(false);
    };

    if (visible) {
      fetchLookups();
    }
  }, [visible, t]);

  useEffect(() => {
    if (visible && mode === 'edit' && initialData) {
      form.setFieldsValue({
        contract_number: initialData.contract_number,
        contract_type_lookup_value_id: initialData.contract_type_lookup_value_id,
        start_date: initialData.start_date ? dayjs(initialData.start_date) : null,
        end_date: initialData.end_date ? dayjs(initialData.end_date) : null,
        contract_status_lookup_value_id: initialData.contract_status_lookup_value_id,
        remarks: initialData.remarks,
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
        start_date: (values.start_date as Dayjs).format('YYYY-MM-DD'),
        end_date: (values.end_date as Dayjs).format('YYYY-MM-DD'),
      };
      await onSubmit(payload);
      setLoading(false);
      // onCancel(); // Usually called by parent after successful submission
    } catch (errorInfo) {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === 'add' ? t('employee:detail_page.contracts_tab.modal.title_add') : t('employee:detail_page.contracts_tab.modal.title_edit')}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnHidden
      width={600}
    >
      {lookupsLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin>
            <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('employee:detail_page.contracts_tab.modal.loading_options')}</div>
          </Spin>
        </div>
      ) : (
        <Form form={form} layout="vertical" name="contractForm">
          <Form.Item
            name="contract_number"
            label={t('employee:detail_page.contracts_tab.table.column_contract_number')}
            rules={[{ required: true, message: t('employee:detail_page.contracts_tab.modal.validation_contract_number_required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contract_type_lookup_value_id"
            label={t('employee:detail_page.contracts_tab.table.column_contract_type')}
            rules={[{ required: true, message: t('employee:detail_page.contracts_tab.modal.validation_contract_type_required') }]}
          >
            <Select placeholder={t('employee:detail_page.contracts_tab.modal.placeholder_select_contract_type')}>
              {contractTypes.map((type: InternalLookupOption) => (
                <Option key={type.value} value={Number(type.value)}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="start_date"
            label={t('employee:detail_page.contracts_tab.table.column_start_date')}
            rules={[{ required: true, message: t('employee:detail_page.contracts_tab.modal.validation_start_date_required') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="end_date"
            label={t('employee:detail_page.contracts_tab.table.column_end_date')}
            rules={[
              { required: true, message: t('employee:detail_page.contracts_tab.modal.validation_end_date_required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('start_date')) {
                    return Promise.resolve();
                  }
                  if (dayjs(value).isAfter(dayjs(getFieldValue('start_date')))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('employee:detail_page.contracts_tab.modal.validation_end_date_after_start_date')));
                },
              }),
            ]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="contract_status_lookup_value_id"
            label={t('employee:detail_page.contracts_tab.table.column_status')}
            rules={[{ required: true, message: t('employee:detail_page.contracts_tab.modal.validation_status_required') }]}
          >
            <Select placeholder={t('employee:detail_page.contracts_tab.modal.placeholder_select_status')}>
              {contractStatuses.map((status: InternalLookupOption) => (
                <Option key={status.value} value={Number(status.value)}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="remarks"
            label={t('common:label.remarks')}
          >
            <Input.TextArea rows={3} placeholder={t('common:placeholder.input_remarks')} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default ContractModal;