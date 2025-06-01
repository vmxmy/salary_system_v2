import React, { useEffect } from 'react';
import { Modal, Form, message, App } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PayrollRunForm, { type PayrollRunFormData } from './PayrollRunForm';
import type { PayrollRun, CreatePayrollRunPayload, UpdatePayrollRunPayload } from '../types/payrollTypes';
import { createPayrollRun, updatePayrollRun } from '../services/payrollApi';

interface PayrollRunFormModalProps {
  visible: boolean;
  run?: PayrollRun | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PayrollRunFormModal: React.FC<PayrollRunFormModalProps> = ({
  visible,
  run,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['payroll_runs', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const { message: messageApi } = App.useApp();

  const isEditMode = !!run;

  // 重置表单当模态框打开/关闭时
  useEffect(() => {
    if (visible) {
      if (run) {
        // 编辑模式：设置初始值
        const formValues: PayrollRunFormData & { employee_ids_str?: string } = {
          payroll_period_id: run.payroll_period_id,
          run_date: dayjs(run.run_date),
          status_lookup_value_id: run.status_lookup_value_id,
          employee_ids_str: run.employee_ids?.join(', ') || '',
          notes: run.notes || '',
        };
        form.setFieldsValue(formValues);
      } else {
        // 新建模式：重置表单
        form.resetFields();
      }
    }
  }, [visible, run, form]);

  // 处理表单提交
  const handleFinish = async (formData: PayrollRunFormData) => {
    setLoading(true);
    try {
      let employeeIds: number[] | undefined = undefined;
      if (formData.employee_ids_str && formData.employee_ids_str.trim() !== '') {
        employeeIds = formData.employee_ids_str
          .split(',')
          .map(idStr => parseInt(idStr.trim(), 10))
          .filter(id => !isNaN(id) && id > 0);
        if (employeeIds.length === 0) employeeIds = undefined;
      }

      const commonPayload = {
        payroll_period_id: formData.payroll_period_id,
        run_date: formData.run_date.format('YYYY-MM-DD'),
        status_lookup_value_id: formData.status_lookup_value_id,
        employee_ids: employeeIds,
        notes: formData.notes,
      };

      if (isEditMode && run) {
        const updatePayload: UpdatePayrollRunPayload = { ...commonPayload };
        await updatePayrollRun(run.id, updatePayload);
        messageApi.success(t('runs_page.message.update_success'));
      } else {
        const createPayload: CreatePayrollRunPayload = { ...commonPayload };
        await createPayrollRun(createPayload);
        messageApi.success(t('runs_page.message.create_success'));
      }

      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || (
        isEditMode 
          ? t('runs_page.error.update_failed')
          : t('runs_page.error.create_failed')
      );
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditMode ? t('runs_page.modal_title.edit') : t('runs_page.modal_title.create')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={650}
      destroyOnClose
    >
      <PayrollRunForm
        form={form}
        onFinish={handleFinish}
        loading={loading}
        isEditMode={isEditMode}
      />
    </Modal>
  );
};

export default PayrollRunFormModal;