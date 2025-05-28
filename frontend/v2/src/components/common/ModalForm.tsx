import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { Modal, App } from 'antd';
import { useTranslation } from 'react-i18next';
import FormBuilder from './FormBuilder';
import type { FormFieldConfig, FormLayoutConfig, FormBuilderRef } from './FormBuilder';

// 模态框表单模式
export type ModalFormMode = 'create' | 'edit' | 'view';

// 模态框表单配置
export interface ModalFormConfig {
  /** 表单字段配置 */
  fields: FormFieldConfig[];
  /** 表单布局配置 */
  layout?: FormLayoutConfig;
  /** 模态框标题配置 */
  titles?: {
    create?: string;
    edit?: string;
    view?: string;
  };
  /** 模态框宽度 */
  width?: number | string;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否显示全屏按钮 */
  showFullscreen?: boolean;
  /** 提交按钮文本配置 */
  submitTexts?: {
    create?: string;
    edit?: string;
  };
  /** 是否在提交成功后关闭模态框 */
  closeOnSuccess?: boolean;
}

// 模态框表单属性
export interface ModalFormProps {
  /** 是否显示模态框 */
  visible: boolean;
  /** 模态框表单模式 */
  mode: ModalFormMode;
  /** 模态框表单配置 */
  config: ModalFormConfig;
  /** 初始数据（编辑模式时使用） */
  initialData?: Record<string, any>;
  /** 提交回调 */
  onSubmit: (values: Record<string, any>, mode: ModalFormMode) => Promise<boolean>;
  /** 取消回调 */
  onCancel: () => void;
  /** 表单值变化回调 */
  onValuesChange?: (changedValues: any, allValues: any) => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 自定义类名 */
  className?: string;
}

// 模态框表单引用类型
export interface ModalFormRef {
  /** 获取表单实例 */
  getForm: () => any;
  /** 获取表单值 */
  getFieldsValue: () => any;
  /** 设置表单值 */
  setFieldsValue: (values: any) => void;
  /** 验证表单 */
  validateFields: () => Promise<any>;
  /** 重置表单 */
  resetFields: () => void;
  /** 提交表单 */
  submit: () => void;
}

const ModalForm = forwardRef<ModalFormRef, ModalFormProps>(({
  visible,
  mode,
  config,
  initialData,
  onSubmit,
  onCancel,
  onValuesChange,
  loading = false,
  className,
}, ref) => {
  const { t } = useTranslation(['common']);
  const { message } = App.useApp();
  const formBuilderRef = React.useRef<FormBuilderRef>(null);

  // 解构配置
  const {
    fields,
    layout = {},
    titles = {},
    width = 600,
    draggable = false,
    showFullscreen = false,
    submitTexts = {},
    closeOnSuccess = true,
  } = config;

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getForm: () => formBuilderRef.current?.getForm(),
    getFieldsValue: () => formBuilderRef.current?.getFieldsValue(),
    setFieldsValue: (values: any) => formBuilderRef.current?.setFieldsValue(values),
    validateFields: () => formBuilderRef.current?.validateFields() || Promise.resolve(),
    resetFields: () => formBuilderRef.current?.resetFields(),
    submit: () => handleSubmit(),
  }));

  // 设置初始数据
  useEffect(() => {
    if (visible && initialData && formBuilderRef.current) {
      formBuilderRef.current.setFieldsValue(initialData);
    }
  }, [visible, initialData]);

  // 重置表单（当模态框关闭时）
  useEffect(() => {
    if (!visible && formBuilderRef.current) {
      formBuilderRef.current.resetFields();
    }
  }, [visible]);

  // 处理提交
  const handleSubmit = async () => {
    try {
      if (!formBuilderRef.current) return;
      
      const values = await formBuilderRef.current.validateFields();
      const success = await onSubmit(values, mode);
      
      if (success) {
        message.success(
          mode === 'create' 
            ? t('message.create_success')
            : t('message.update_success')
        );
        
        if (closeOnSuccess) {
          onCancel();
        }
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    onCancel();
  };

  // 获取模态框标题
  const getTitle = () => {
    switch (mode) {
      case 'create':
        return titles.create || t('modal.title.create');
      case 'edit':
        return titles.edit || t('modal.title.edit');
      case 'view':
        return titles.view || t('modal.title.view');
      default:
        return t('modal.title.default');
    }
  };

  // 获取提交按钮文本
  const getSubmitText = () => {
    switch (mode) {
      case 'create':
        return submitTexts.create || t('button.create');
      case 'edit':
        return submitTexts.edit || t('button.update');
      default:
        return t('button.submit');
    }
  };

  // 处理表单字段（根据模式调整）
  const processedFields = fields.map(field => {
    if (mode === 'view') {
      // 查看模式下所有字段都禁用
      return { ...field, disabled: true };
    }
    return field;
  });

  return (
    <Modal
      title={getTitle()}
      open={visible}
      onCancel={handleCancel}
      onOk={mode === 'view' ? undefined : handleSubmit}
      okText={mode === 'view' ? undefined : getSubmitText()}
      cancelText={t('button.cancel')}
      confirmLoading={loading}
      width={width}
      className={className}
      destroyOnHidden
      maskClosable={false}
      footer={mode === 'view' ? [
        <button key="close" onClick={handleCancel}>
          {t('button.close')}
        </button>
      ] : undefined}
    >
      <FormBuilder
        ref={formBuilderRef}
        fields={processedFields}
        layout={layout}
        initialValues={initialData}
        onValuesChange={onValuesChange}
        showSubmitButton={false}
        showResetButton={false}
        disabled={mode === 'view'}
      />
    </Modal>
  );
});

ModalForm.displayName = 'ModalForm';

export default ModalForm; 