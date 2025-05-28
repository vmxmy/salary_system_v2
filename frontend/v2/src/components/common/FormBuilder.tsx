import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Switch, 
  Radio, 
  Checkbox, 
  Upload, 
  Button,
  Row,
  Col,
  Divider,
  Space,
  App
} from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import { LookupSelect, EmployeeSelector, DateRangePicker, StatusTag } from './index';
import type { LookupType } from './LookupSelect';
import type { StatusType } from './StatusTag';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// 表单字段类型
export type FormFieldType = 
  | 'input'
  | 'textarea'
  | 'password'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'dateRange'
  | 'time'
  | 'datetime'
  | 'switch'
  | 'radio'
  | 'checkbox'
  | 'checkboxGroup'
  | 'upload'
  | 'lookupSelect'
  | 'employeeSelect'
  | 'statusTag'
  | 'divider'
  | 'custom';

// 表单字段配置
export interface FormFieldConfig {
  /** 字段名称 */
  name: string;
  /** 字段标签 */
  label?: string;
  /** 字段类型 */
  type: FormFieldType;
  /** 是否必填 */
  required?: boolean;
  /** 验证规则 */
  rules?: any[];
  /** 占位符 */
  placeholder?: string;
  /** 默认值 */
  defaultValue?: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 字段提示 */
  tooltip?: string;
  /** 帮助文本 */
  help?: string;
  /** 栅格布局 */
  span?: number;
  /** 字段依赖条件 */
  dependencies?: string[];
  /** 显示条件函数 */
  shouldShow?: (values: any) => boolean;
  
  // 特定字段类型的配置
  /** Select/Radio/Checkbox 选项 */
  options?: Array<{ label: string; value: any; disabled?: boolean }>;
  /** LookupSelect 类型 */
  lookupType?: LookupType;
  /** StatusTag 状态类型 */
  statusType?: StatusType;
  /** 数字输入配置 */
  numberConfig?: {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
  };
  /** 日期配置 */
  dateConfig?: {
    format?: string;
    showTime?: boolean;
    disabledDate?: (current: Dayjs) => boolean;
  };
  /** 上传配置 */
  uploadConfig?: {
    accept?: string;
    maxCount?: number;
    multiple?: boolean;
    listType?: 'text' | 'picture' | 'picture-card';
  };
  /** 自定义渲染函数 */
  render?: (value: any, record: any, form: any) => React.ReactNode;
  /** 字段变化回调 */
  onChange?: (value: any, allValues: any) => void;
}

// 表单布局配置
export interface FormLayoutConfig {
  /** 表单布局类型 */
  layout?: 'horizontal' | 'vertical' | 'inline';
  /** 标签列宽度 */
  labelCol?: { span?: number; offset?: number };
  /** 包装列宽度 */
  wrapperCol?: { span?: number; offset?: number };
  /** 栅格间距 */
  gutter?: number | [number, number];
  /** 是否显示冒号 */
  colon?: boolean;
}

// 表单构建器属性
export interface FormBuilderProps {
  /** 表单字段配置 */
  fields: FormFieldConfig[];
  /** 表单布局配置 */
  layout?: FormLayoutConfig;
  /** 表单初始值 */
  initialValues?: Record<string, any>;
  /** 表单值变化回调 */
  onValuesChange?: (changedValues: any, allValues: any) => void;
  /** 表单提交回调 */
  onFinish?: (values: any) => void;
  /** 表单提交失败回调 */
  onFinishFailed?: (errorInfo: any) => void;
  /** 是否显示提交按钮 */
  showSubmitButton?: boolean;
  /** 提交按钮文本 */
  submitButtonText?: string;
  /** 是否显示重置按钮 */
  showResetButton?: boolean;
  /** 重置按钮文本 */
  resetButtonText?: string;
  /** 表单加载状态 */
  loading?: boolean;
  /** 表单禁用状态 */
  disabled?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

// 表单构建器引用类型
export interface FormBuilderRef {
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

const FormBuilder = forwardRef<FormBuilderRef, FormBuilderProps>(({
  fields,
  layout = {},
  initialValues,
  onValuesChange,
  onFinish,
  onFinishFailed,
  showSubmitButton = true,
  submitButtonText,
  showResetButton = false,
  resetButtonText,
  loading = false,
  disabled = false,
  style,
  className,
}, ref) => {
  const { t } = useTranslation(['common']);
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // 暴露表单方法给父组件
  useImperativeHandle(ref, () => ({
    getForm: () => form,
    getFieldsValue: () => form.getFieldsValue(),
    setFieldsValue: (values: any) => form.setFieldsValue(values),
    validateFields: () => form.validateFields(),
    resetFields: () => form.resetFields(),
    submit: () => form.submit(),
  }));

  // 设置初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // 渲染表单字段
  const renderFormField = (fieldConfig: FormFieldConfig, formValues: any) => {
    const {
      name,
      label,
      type,
      required = false,
      rules = [],
      placeholder,
      disabled: fieldDisabled = false,
      hidden = false,
      tooltip,
      help,
      dependencies = [],
      shouldShow,
      options = [],
      lookupType,
      statusType,
      numberConfig = {},
      dateConfig = {},
      uploadConfig = {},
      render,
      onChange,
    } = fieldConfig;

    // 检查显示条件
    if (shouldShow && !shouldShow(formValues)) {
      return null;
    }

    if (hidden) {
      return null;
    }

    // 构建验证规则
    const fieldRules = [...rules];
    if (required) {
      fieldRules.unshift({
        required: true,
        message: t('form.validation.default_required_template', { fieldName: label || name }),
      });
    }

    // 字段通用属性
    const commonProps = {
      placeholder: placeholder || `${t('placeholder.input')}${label || name}`,
      disabled: disabled || fieldDisabled,
      style: { width: '100%' },
    };

    // 渲染不同类型的字段
    let fieldElement: React.ReactNode;

    switch (type) {
      case 'input':
        fieldElement = <Input {...commonProps} />;
        break;

      case 'textarea':
        fieldElement = (
          <TextArea 
            {...commonProps} 
            rows={4}
            showCount
            maxLength={500}
          />
        );
        break;

      case 'password':
        fieldElement = <Input.Password {...commonProps} />;
        break;

      case 'number':
        fieldElement = (
          <InputNumber 
            {...commonProps}
            min={numberConfig.min}
            max={numberConfig.max}
            step={numberConfig.step}
            precision={numberConfig.precision}
          />
        );
        break;

      case 'select':
        fieldElement = (
          <Select {...commonProps} allowClear>
            {options.map(option => (
              <Option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </Option>
            ))}
          </Select>
        );
        break;

      case 'multiSelect':
        fieldElement = (
          <Select {...commonProps} mode="multiple" allowClear>
            {options.map(option => (
              <Option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </Option>
            ))}
          </Select>
        );
        break;

      case 'date':
        fieldElement = (
          <DatePicker 
            {...commonProps}
            format={dateConfig.format || 'YYYY-MM-DD'}
            showTime={dateConfig.showTime}
            disabledDate={dateConfig.disabledDate}
          />
        );
        break;

      case 'dateRange':
        fieldElement = (
          <DateRangePicker 
            placeholder={[
              placeholder || `${t('placeholder.start_date')}`,
              placeholder || `${t('placeholder.end_date')}`
            ]}
            disabled={disabled || fieldDisabled}
            style={{ width: '100%' }}
            format={dateConfig.format || 'YYYY-MM-DD'}
            showTime={dateConfig.showTime}
            disabledDate={dateConfig.disabledDate}
          />
        );
        break;

      case 'datetime':
        fieldElement = (
          <DatePicker 
            {...commonProps}
            format={dateConfig.format || 'YYYY-MM-DD HH:mm:ss'}
            showTime
            disabledDate={dateConfig.disabledDate}
          />
        );
        break;

      case 'switch':
        fieldElement = (
          <Switch 
            disabled={disabled || fieldDisabled}
            checkedChildren={t('common.yes')}
            unCheckedChildren={t('common.no')}
          />
        );
        break;

      case 'radio':
        fieldElement = (
          <Radio.Group {...commonProps}>
            {options.map(option => (
              <Radio 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        );
        break;

      case 'checkbox':
        fieldElement = (
          <Checkbox disabled={disabled || fieldDisabled}>
            {label}
          </Checkbox>
        );
        break;

      case 'checkboxGroup':
        fieldElement = (
          <Checkbox.Group {...commonProps}>
            {options.map(option => (
              <Checkbox 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        );
        break;

      case 'upload':
        fieldElement = (
          <Upload 
            {...uploadConfig}
            disabled={disabled || fieldDisabled}
          >
            <Button icon={<UploadOutlined />}>
              {t('button.upload')}
            </Button>
          </Upload>
        );
        break;

      case 'lookupSelect':
        if (!lookupType) {
          console.error('FormBuilder: lookupType is required for lookupSelect field');
          return null;
        }
        fieldElement = (
          <LookupSelect 
            lookupType={lookupType}
            {...commonProps}
          />
        );
        break;

      case 'employeeSelect':
        fieldElement = (
          <EmployeeSelector 
            {...commonProps}
          />
        );
        break;

      case 'statusTag':
        if (!statusType) {
          console.error('FormBuilder: statusType is required for statusTag field');
          return null;
        }
        fieldElement = (
          <StatusTag 
            status={statusType}
            onClick={() => {}} // 可以添加点击事件
          />
        );
        break;

      case 'divider':
        return <Divider key={name}>{label}</Divider>;

      case 'custom':
        if (!render) {
          console.error('FormBuilder: render function is required for custom field');
          return null;
        }
        fieldElement = render(formValues[name], formValues, form);
        break;

      default:
        fieldElement = <Input {...commonProps} />;
        break;
    }

    // 包装表单项
    return (
      <Form.Item
        key={name}
        name={name}
        label={label}
        rules={fieldRules}
        dependencies={dependencies}
        tooltip={tooltip}
        help={help}
        valuePropName={type === 'switch' || type === 'checkbox' ? 'checked' : 'value'}
      >
        {fieldElement}
      </Form.Item>
    );
  };

  // 处理表单值变化
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // 触发字段级别的onChange回调
    Object.keys(changedValues).forEach(fieldName => {
      const fieldConfig = fields.find(f => f.name === fieldName);
      if (fieldConfig?.onChange) {
        fieldConfig.onChange(changedValues[fieldName], allValues);
      }
    });

    // 触发表单级别的onChange回调
    onValuesChange?.(changedValues, allValues);
  };

  // 获取当前表单值（用于条件渲染）
  const formValues = Form.useWatch([], form) || {};

  // 渲染表单字段（支持栅格布局）
  const renderFields = () => {
    const { gutter = 16 } = layout;
    
    return (
      <Row gutter={gutter}>
        {fields.map(fieldConfig => {
          const { span = 24 } = fieldConfig;
          const fieldElement = renderFormField(fieldConfig, formValues);
          
          if (!fieldElement) return null;
          
          return (
            <Col key={fieldConfig.name} span={span}>
              {fieldElement}
            </Col>
          );
        })}
      </Row>
    );
  };

  // 渲染操作按钮
  const renderActions = () => {
    if (!showSubmitButton && !showResetButton) return null;

    return (
      <Form.Item>
        <Space>
          {showSubmitButton && (
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={disabled}
            >
              {submitButtonText || t('button.submit')}
            </Button>
          )}
          {showResetButton && (
            <Button 
              onClick={() => form.resetFields()}
              disabled={disabled}
            >
              {resetButtonText || t('button.reset')}
            </Button>
          )}
        </Space>
      </Form.Item>
    );
  };

  return (
    <Form
      form={form}
      layout={layout.layout || 'vertical'}
      labelCol={layout.labelCol}
      wrapperCol={layout.wrapperCol}
      colon={layout.colon}
      initialValues={initialValues}
      onValuesChange={handleValuesChange}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      style={style}
      className={className}
      disabled={disabled}
    >
      {renderFields()}
      {renderActions()}
    </Form>
  );
});

FormBuilder.displayName = 'FormBuilder';

export default FormBuilder; 