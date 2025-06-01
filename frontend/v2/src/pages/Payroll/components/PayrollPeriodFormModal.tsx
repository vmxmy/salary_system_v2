import React, { useEffect } from 'react';
import { Modal, Form, message } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PayrollPeriodForm, { type PayrollPeriodFormData } from './PayrollPeriodForm';
import type { PayrollPeriod } from '../types/payrollTypes';
import { createPayrollPeriod, updatePayrollPeriod } from '../services/payrollApi';
import { getPayrollPeriodNameTranslation } from '../utils/payrollFormatUtils';

interface PayrollPeriodFormModalProps {
  visible: boolean;
  period?: PayrollPeriod | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PayrollPeriodFormModal: React.FC<PayrollPeriodFormModalProps> = ({
  visible,
  period,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const isEditMode = !!period;

  // 重置表单当模态框打开/关闭时
  useEffect(() => {
    if (visible) {
      if (period) {
        // 编辑模式：设置初始值
        form.setFieldsValue({
          name: period.name,
          start_date: period.start_date ? dayjs(period.start_date) : undefined,
          end_date: period.end_date ? dayjs(period.end_date) : undefined,
          pay_date: period.pay_date ? dayjs(period.pay_date) : undefined,
          frequency_lookup_value_id: period.frequency_lookup_value_id || 117,
          status_lookup_value_id: period.status_lookup_value_id || 137,
        });
      } else {
        // 新建模式：重置表单
        form.resetFields();
      }
    }
  }, [visible, period, form]);

  // 处理开始日期变化，自动生成名称
  const handleStartDateChange = (date: dayjs.Dayjs | null) => {
    if (date && !isEditMode) {
      const translationInfo = getPayrollPeriodNameTranslation(date);
      const generatedName = t(translationInfo.key, translationInfo.params) as string;
      form.setFieldsValue({ name: generatedName });
    }
  };

  // 处理表单提交
  const handleFinish = async (values: PayrollPeriodFormData) => {
    setLoading(true);
    try {
      const formattedData = {
        name: values.name,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        pay_date: values.pay_date.format('YYYY-MM-DD'),
        frequency_lookup_value_id: Number(values.frequency_lookup_value_id),
        status_lookup_value_id: Number(values.status_lookup_value_id),
      };

      if (isEditMode && period) {
        await updatePayrollPeriod(period.id, formattedData);
        message.success(t('payroll_periods_page.message.update_success'));
      } else {
        await createPayrollPeriod(formattedData);
        message.success(t('payroll_periods_page.message.create_success'));
      }

      onSuccess();
    } catch (error) {
      message.error(
        isEditMode 
          ? t('payroll_periods_page.message.update_failed')
          : t('payroll_periods_page.message.create_failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditMode ? t('pageTitle:edit_payroll_period') : t('pageTitle:create_payroll_period')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <PayrollPeriodForm
        form={form}
        onFinish={handleFinish}
        onCancel={onClose}
        loading={loading}
        isEditMode={isEditMode}
        onStartDateChange={handleStartDateChange}
      />
    </Modal>
  );
};

export default PayrollPeriodFormModal;