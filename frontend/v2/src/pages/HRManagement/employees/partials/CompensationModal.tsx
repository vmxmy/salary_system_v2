import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Select, InputNumber, Input, message, Spin, Row, Col } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { employeeService } from '../../../../services/employeeService';
import type { CompensationItem, CreateCompensationPayload, UpdateCompensationPayload, LookupValue } from '../../types';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface CompensationModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialData?: CompensationItem;
  employeeId: string;
  onSubmit: (values: CreateCompensationPayload | UpdateCompensationPayload) => Promise<void>;
  onCancel: () => void;
}

interface InternalLookupOption {
  value: string;
  label: string;
}

const CompensationModal: React.FC<CompensationModalProps> = ({ visible, mode, initialData, employeeId, onSubmit, onCancel }) => {
  const { t } = useTranslation(['employee', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [payFrequencies, setPayFrequencies] = useState<InternalLookupOption[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      setLookupsLoading(true);
      try {
        const freqRes = await employeeService.getPayFrequenciesLookup();
        setPayFrequencies(freqRes.map((f: any) => ({ 
          value: String(f.id || f.value || f.value_code || ''), 
          label: f.label || f.value_name || String(f.id) 
        })));
      } catch (error) {
        message.error(t('employee:detail_page.compensation_tab.modal.message_load_lookups_failed', 'Failed to load lookup data for compensation.'));
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
        effective_date: initialData.effective_date ? dayjs(initialData.effective_date) : null,
        basic_salary: initialData.basic_salary,
        allowances: initialData.allowances,
        pay_frequency_lookup_value_id: initialData.pay_frequency_lookup_value_id,
        currency: initialData.currency,
        change_reason: initialData.change_reason,
        remarks: initialData.remarks,
      });
    } else if (visible && mode === 'add') {
      form.resetFields();
      form.setFieldsValue({ currency: 'CNY' });
    }
  }, [visible, mode, initialData, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        effective_date: (values.effective_date as Dayjs).format('YYYY-MM-DD'),
      };
      await onSubmit(payload);
      setLoading(false);
    } catch (errorInfo) {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === 'add' ? t('employee:detail_page.compensation_tab.modal.title_add', 'Add New Compensation Record') : t('employee:detail_page.compensation_tab.modal.title_edit', 'Edit Compensation Record')}
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
            <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('employee:detail_page.compensation_tab.modal.loading_options', 'Loading options...')}</div>
          </Spin>
        </div>
      ) : (
        <Form form={form} layout="vertical" name="compensationForm">
          <Form.Item
            name="effective_date"
            label={t('employee:detail_page.compensation_tab.table.column_effective_date', 'Effective Date')}
            rules={[{ required: true, message: t('employee:detail_page.compensation_tab.modal.validation_effective_date_required', 'Please select the effective date!') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="basic_salary"
            label={t('employee:detail_page.compensation_tab.table.column_basic_salary', 'Basic Salary')}
            rules={[{ required: true, message: t('employee:detail_page.compensation_tab.modal.validation_basic_salary_required', 'Please input the basic salary!'), type: 'number' }]}
          >
            <InputNumber style={{ width: '100%' }} precision={2} min={0} />
          </Form.Item>
          <Form.Item
            name="allowances"
            label={t('employee:detail_page.compensation_tab.table.column_allowances', 'Allowances')}
            rules={[{ type: 'number', message: t('employee:detail_page.compensation_tab.modal.validation_allowances_number', 'Please input a valid number for allowances') }]}
          >
            <InputNumber style={{ width: '100%' }} precision={2} min={0} />
          </Form.Item>
          <Form.Item
            name="pay_frequency_lookup_value_id"
            label={t('employee:detail_page.compensation_tab.table.column_pay_frequency', 'Pay Frequency')}
            rules={[{ required: true, message: t('employee:detail_page.compensation_tab.modal.validation_pay_frequency_required', 'Please select the pay frequency!') }]}
          >
            <Select placeholder={t('employee:detail_page.compensation_tab.modal.placeholder_select_pay_frequency', 'Select pay frequency')}>
              {payFrequencies.map((freq: InternalLookupOption) => (
                <Option key={freq.value} value={Number(freq.value)}>{freq.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="currency"
            label={t('employee:detail_page.compensation_tab.table.column_currency', 'Currency')}
            initialValue="CNY"
            rules={[{ required: true, message: t('employee:detail_page.compensation_tab.modal.validation_currency_required', 'Please input the currency code (e.g., CNY)')}]}
          >
            <Input maxLength={3} />
          </Form.Item>
          <Form.Item
            name="change_reason"
            label={t('employee:detail_page.compensation_tab.table.column_change_reason', 'Reason for Change')}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="remarks"
            label={t('common:label.remarks', 'Remarks')}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default CompensationModal;