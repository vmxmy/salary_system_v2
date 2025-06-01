import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Spin,
  Alert,
  message
} from 'antd';
import type { FormInstance } from 'antd/lib/form';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { PayrollPeriod, CreatePayrollRunPayload } from '../types/payrollTypes';
import { getPayrollPeriods } from '../services/payrollApi';
import { PAYROLL_RUN_STATUS_OPTIONS } from '../utils/payrollUtils'; // Import status options
import { formatPayrollPeriodDisplay } from '../utils/payrollFormatUtils';

const { Option } = Select;

// Re-using status options similar to PayrollRunsPage for consistency
// Ideally, these might come from a shared source or API
// const TEMP_RUN_STATUS_OPTIONS = [ ... ]; // REMOVE THIS

interface PayrollRunFormProps {
  form: FormInstance;
  initialValues?: Partial<CreatePayrollRunPayload & { id?: number, employee_ids_str?: string }>;
  onFinish: (values: PayrollRunFormData) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean; // External loading state for submit button
  isEditMode?: boolean; // Though this form is primarily for creation now
}

// This is the data type the form will produce internally before final transformation for API
export interface PayrollRunFormData {
  payroll_period_id: number;
  run_date: Dayjs;
  status_lookup_value_id: number;
  employee_ids_str?: string; // Comma-separated string of employee IDs
  notes?: string;
}

const PayrollRunForm: React.FC<PayrollRunFormProps> = ({
  form,
  initialValues,
  onFinish,
  onCancel,
  loading: externalLoading = false,
  isEditMode = false, // Currently not differentiating much for edit mode
}) => {
  const { t } = useTranslation(['payroll_runs', 'common']);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(true);
  const [periodsError, setPeriodsError] = useState<string | null>(null);

  const fetchPeriodsForSelect = useCallback(async () => {
    setLoadingPeriods(true);
    setPeriodsError(null);
    try {
      // Fetch all active/open periods, or a reasonable subset for selection
      const response = await getPayrollPeriods({ size: 100 }); // 符合后端API限制
      console.log('[PayrollRunForm] ✅ getPayrollPeriods API response:', {
        dataCount: response.data?.length || 0,
        data: response.data,
        meta: response.meta
      });
      setPayrollPeriods(response.data);
    } catch (err: any) {
      console.error('[PayrollRunForm] ❌ getPayrollPeriods API failed:', {
        error: err,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      // 使用固定错误信息，避免t函数依赖问题
      const errorMessage = 'Failed to load payroll periods: ' + (err.message || 'Unknown error');
      setPeriodsError('Failed to load payroll periods');
      message.error(errorMessage);
    } finally {
      setLoadingPeriods(false);
    }
  }, []); // ✅ 移除t依赖，避免无限重渲染

  useEffect(() => {
    fetchPeriodsForSelect();
  }, [fetchPeriodsForSelect]);

  const handleSubmit = (values: PayrollRunFormData) => {
    // The transformation of employee_ids_str to number[] will happen in the parent page
    // before calling the actual API, or adjust onFinish to expect CreatePayrollRunPayload
    onFinish(values);
  };
  
  // Prepare initial values for the form, converting employee_ids array to string
  const preparedInitialValues = initialValues ? {
    ...initialValues,
    run_date: initialValues.run_date ? dayjs(initialValues.run_date) : undefined,
    employee_ids_str: initialValues.employee_ids?.join(', ') || (initialValues.employee_ids_str || ''),
    status_lookup_value_id: isEditMode 
      ? initialValues?.status_lookup_value_id 
      : (PAYROLL_RUN_STATUS_OPTIONS.find(opt => opt.display_name_key === 'payroll_run_status.draft')?.id || 
         (PAYROLL_RUN_STATUS_OPTIONS.length > 0 ? PAYROLL_RUN_STATUS_OPTIONS[0].id : undefined) || 
         201) // Fallback
  } : {
    // Default values for a new form if initialValues is not provided
    status_lookup_value_id: PAYROLL_RUN_STATUS_OPTIONS.find(opt => opt.display_name_key === 'payroll_run_status.draft')?.id || 
                           (PAYROLL_RUN_STATUS_OPTIONS.length > 0 ? PAYROLL_RUN_STATUS_OPTIONS[0].id : undefined) || 
                           201 // Fallback
  };

  // Use the first status from the imported options as default for new runs, if applicable
  // const defaultStatusForNewRun = !isEditMode && PAYROLL_RUN_STATUS_OPTIONS.length > 0 ? PAYROLL_RUN_STATUS_OPTIONS[0].id : undefined;
  // Find 'Draft' status by its translation key
  // const draftStatusObject = PAYROLL_RUN_STATUS_OPTIONS.find(
  //   opt => opt.display_name_key === 'payroll_run_status.draft' 
  // );
  // const initialStatusValue = isEditMode 
  //   ? initialValues?.status_lookup_value_id 
  //   : (draftStatusObject?.id || (PAYROLL_RUN_STATUS_OPTIONS.length > 0 ? PAYROLL_RUN_STATUS_OPTIONS[0].id : undefined) || 201); // Fallback to first option or hardcoded 201

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={preparedInitialValues}
    >
      <Form.Item
        name="payroll_period_id"
        label={t('payroll_run_form.label.payroll_period')}
        rules={[{ required: true, message: t('payroll_run_form.validation.payroll_period_required') }]}
      >
        <Select placeholder={t('payroll_run_form.placeholder.payroll_period')} loading={loadingPeriods} showSearch filterOption={(input, option) => (option?.children as unknown as string ?? '').toLowerCase().includes(input.toLowerCase())}>
          {payrollPeriods.map(period => (
            <Option key={period.id} value={period.id}>
              {formatPayrollPeriodDisplay(period)}
            </Option>
          ))}
        </Select>
      </Form.Item>
      {periodsError && <Alert message={periodsError} type="error" style={{ marginBottom: 16}}/>}

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="run_date"
            label={t('payroll_run_form.label.run_date')}
            rules={[{ required: true, message: t('payroll_run_form.validation.run_date_required') }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status_lookup_value_id"
            label={isEditMode ? t('payroll_run_form.label.status_edit_mode') : t('payroll_run_form.label.status_create_mode')}
            rules={[{ required: true, message: t('payroll_run_form.validation.status_required') }]}
          >
            <Select placeholder={t('payroll_run_form.placeholder.status')}>
              {PAYROLL_RUN_STATUS_OPTIONS.map(status => (
                <Option key={status.id} value={status.id}>
                  {t(status.display_name_key)}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="employee_ids_str"
        label={t('payroll_run_form.label.employee_ids')}
        tooltip={t('payroll_run_form.tooltip.employee_ids')}
      >
        <Input.TextArea 
          rows={3} 
          placeholder={t('payroll_run_form.placeholder.employee_ids')}
        />
      </Form.Item>

      <Form.Item
        name="notes"
        label={t('payroll_run_form.label.notes')}
      >
        <Input.TextArea rows={3} placeholder={t('payroll_run_form.placeholder.notes')} />
      </Form.Item>
      
      <Row justify="end" gutter={8} style={{ marginTop: 24 }}>
        {onCancel && (
          <Col>
            <Button onClick={onCancel} disabled={externalLoading}>
              {t('payroll_run_form.button.cancel')}
            </Button>
          </Col>
        )}
        <Col>
          <Button type="primary" htmlType="submit" loading={externalLoading}>
            {isEditMode ? t('payroll_run_form.button.save_changes') : t('payroll_run_form.button.create_run')}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default PayrollRunForm; 