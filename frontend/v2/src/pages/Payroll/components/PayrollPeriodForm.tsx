import React from 'react';
import { Form, Input, DatePicker, Select, Button, Row, Col } from 'antd';
import type { FormInstance } from 'antd/lib/form';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs'; // Import dayjs for date conversion
import { useTranslation } from 'react-i18next'; // Added
import type { PayrollPeriod } from '../types/payrollTypes'; // Removed LookupValue as it's not directly used in this simplified form's props
import { PAYROLL_PERIOD_STATUS_OPTIONS } from '../utils/payrollUtils';

interface PayrollPeriodFormProps {
  form: FormInstance; // More specific type for Ant Design Form instance
  initialValues?: Partial<PayrollPeriod> & { start_date?: string | Dayjs, end_date?: string | Dayjs }; // Allow string or Dayjs for dates
  onFinish: (values: PayrollPeriodFormData) => void | Promise<void>; // Allow async onFinish
  onCancel?: () => void;
  loading?: boolean;
  isEditMode?: boolean;
  onStartDateChange?: (date: Dayjs | null) => void; // 添加开始日期变化回调
}

export interface PayrollPeriodFormData {
  name: string;
  start_date: Dayjs; // Ensure Dayjs
  end_date: Dayjs;   // Ensure Dayjs
  pay_date: Dayjs;   // 支付日期
  frequency_lookup_value_id: number; // 频率ID
  status_lookup_value_id: number; // Changed from status to match Pydantic model
}

const PayrollPeriodForm: React.FC<PayrollPeriodFormProps> = ({
  form,
  initialValues,
  onFinish,
  onCancel,
  loading,
  isEditMode = false,
  onStartDateChange,
}) => {
  const { t } = useTranslation(['payroll_periods', 'common']); // Added with namespace

  const handleSubmit = (values: any) => {
    const transformedValues: PayrollPeriodFormData = {
      name: values.name,
      start_date: values.start_date, // Already Dayjs objects from DatePicker
      end_date: values.end_date,     // Already Dayjs objects from DatePicker
      pay_date: values.pay_date,     // Already Dayjs objects from DatePicker
      frequency_lookup_value_id: values.frequency_lookup_value_id,
      status_lookup_value_id: values.status_lookup_value_id,
    };
    onFinish(transformedValues);
  };

  // Prepare initial values for the form, converting date strings to Dayjs objects
  const preparedInitialValues = initialValues ? {
    ...initialValues,
    start_date: initialValues.start_date ? dayjs(initialValues.start_date) : undefined,
    end_date: initialValues.end_date ? dayjs(initialValues.end_date) : undefined,
    pay_date: initialValues.pay_date ? dayjs(initialValues.pay_date) : undefined,
    frequency_lookup_value_id: initialValues.frequency_lookup_value_id || 117, // 确保有默认值
    status_lookup_value_id: initialValues.status_lookup_value_id || 137, // 确保有默认值
  } : {
    frequency_lookup_value_id: 117, // 默认月度
    status_lookup_value_id: 137 // 默认计划中
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={preparedInitialValues}
    >
      <Form.Item
        name="name"
        label={t('payroll_periods:payroll_period_form.label.name')}
        rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.name_required') }]}
      >
        <Input placeholder={t('payroll_periods:payroll_period_form.placeholder.name')} />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="start_date"
            label={t('payroll_periods:payroll_period_form.label.start_date')}
            rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.start_date_required') }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="YYYY-MM-DD" 
              onChange={onStartDateChange} 
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="end_date"
            label={t('payroll_periods:payroll_period_form.label.end_date')}
            rules={[
              { required: true, message: t('payroll_periods:payroll_period_form.validation.end_date_required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('start_date')) {
                    return Promise.resolve();
                  }
                  if (value.isBefore(getFieldValue('start_date'))) {
                    return Promise.reject(new Error(t('payroll_periods:payroll_period_form.validation.end_date_before_start_date')));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="pay_date"
            label={t('payroll_periods:payroll_period_form.label.pay_date')}
            rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.pay_date_required') }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="frequency_lookup_value_id"
            label={t('payroll_periods:payroll_period_form.label.frequency')}
            rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.frequency_required') }]}
          >
            <Select placeholder={t('payroll_periods:payroll_period_form.placeholder.frequency')}>
              <Select.Option value={117}>月度</Select.Option>
              <Select.Option value={118}>季度</Select.Option>
              <Select.Option value={119}>年度</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="status_lookup_value_id" // Changed from "status"
        label={t('payroll_periods:payroll_period_form.label.status')}
        rules={[{ required: true, message: t('payroll_periods:payroll_period_form.validation.status_required') }]}
      >
        <Select placeholder={t('payroll_periods:payroll_period_form.placeholder.status')}>
          {PAYROLL_PERIOD_STATUS_OPTIONS.map((statusOpt) => (
            <Select.Option key={statusOpt.id} value={statusOpt.id}>
              {String(t(statusOpt.display_name_key, { ns: 'payroll_periods' }))}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      
      <Row justify="end" gutter={8} style={{ marginTop: 24 }}>
        {onCancel && (
          <Col>
            <Button onClick={onCancel} disabled={loading}>
              {t('payroll_periods:payroll_period_form.button.cancel')}
            </Button>
          </Col>
        )}
        <Col>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditMode ? t('payroll_periods:payroll_period_form.button.save_changes') : t('payroll_periods:payroll_period_form.button.create_period')}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default PayrollPeriodForm; 