import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { 
  Form, 
  Row, 
  Col, 
  Button, 
  Space, 
  Collapse,
  Card,
  Typography
} from 'antd';
import { SearchOutlined, ReloadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import FormBuilder from './FormBuilder';
import type { FormFieldConfig, FormLayoutConfig } from './FormBuilder';

const { Panel } = Collapse;
const { Title } = Typography;

// 搜索表单配置
export interface SearchFormConfig {
  /** 基础搜索字段 */
  basicFields: FormFieldConfig[];
  /** 高级搜索字段 */
  advancedFields?: FormFieldConfig[];
  /** 表单布局配置 */
  layout?: FormLayoutConfig;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 是否显示展开/收起按钮 */
  showToggle?: boolean;
  /** 默认是否展开高级搜索 */
  defaultExpanded?: boolean;
  /** 搜索按钮文本 */
  searchButtonText?: string;
  /** 重置按钮文本 */
  resetButtonText?: string;
  /** 展开按钮文本 */
  expandButtonText?: string;
  /** 收起按钮文本 */
  collapseButtonText?: string;
}

// 搜索表单属性
export interface SearchFormProps {
  /** 搜索表单配置 */
  config: SearchFormConfig;
  /** 初始搜索值 */
  initialValues?: Record<string, any>;
  /** 搜索回调 */
  onSearch: (values: Record<string, any>) => void;
  /** 重置回调 */
  onReset?: () => void;
  /** 表单值变化回调 */
  onValuesChange?: (changedValues: any, allValues: any) => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 表单标题 */
  title?: string;
}

// 搜索表单引用类型
export interface SearchFormRef {
  /** 获取表单值 */
  getFieldsValue: () => any;
  /** 设置表单值 */
  setFieldsValue: (values: any) => void;
  /** 重置表单 */
  resetFields: () => void;
  /** 提交搜索 */
  submit: () => void;
  /** 切换高级搜索展开状态 */
  toggleAdvanced: () => void;
}

const SearchForm = forwardRef<SearchFormRef, SearchFormProps>(({
  config,
  initialValues,
  onSearch,
  onReset,
  onValuesChange,
  loading = false,
  style,
  className,
  title,
}, ref) => {
  const { t } = useTranslation(['common']);
  const [form] = Form.useForm();
  
  // 状态管理
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(
    config.defaultExpanded ?? false
  );

  // 解构配置
  const {
    basicFields,
    advancedFields = [],
    layout = {},
    showReset = true,
    showToggle = true,
    searchButtonText,
    resetButtonText,
    expandButtonText,
    collapseButtonText,
  } = config;

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getFieldsValue: () => form.getFieldsValue(),
    setFieldsValue: (values: any) => form.setFieldsValue(values),
    resetFields: () => form.resetFields(),
    submit: () => handleSearch(),
    toggleAdvanced: () => setIsAdvancedExpanded(!isAdvancedExpanded),
  }));

  // 处理搜索
  const handleSearch = useCallback(() => {
    const values = form.getFieldsValue();
    // 过滤掉空值
    const filteredValues = Object.keys(values).reduce((acc, key) => {
      const value = values[key];
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    onSearch(filteredValues);
  }, [form, onSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    form.resetFields();
    onReset?.();
    // 重置后自动搜索
    setTimeout(() => {
      onSearch({});
    }, 0);
  }, [form, onReset, onSearch]);

  // 切换高级搜索
  const toggleAdvanced = useCallback(() => {
    setIsAdvancedExpanded(!isAdvancedExpanded);
  }, [isAdvancedExpanded]);

  // 处理表单值变化
  const handleValuesChange = useCallback((changedValues: any, allValues: any) => {
    onValuesChange?.(changedValues, allValues);
  }, [onValuesChange]);

  // 渲染基础搜索字段
  const renderBasicFields = () => {
    if (basicFields.length === 0) return null;

    return (
      <FormBuilder
        fields={basicFields}
        layout={layout}
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
        showSubmitButton={false}
        showResetButton={false}
      />
    );
  };

  // 渲染高级搜索字段
  const renderAdvancedFields = () => {
    if (advancedFields.length === 0 || !isAdvancedExpanded) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <FormBuilder
          fields={advancedFields}
          layout={layout}
          onValuesChange={handleValuesChange}
          showSubmitButton={false}
          showResetButton={false}
        />
      </div>
    );
  };

  // 渲染操作按钮
  const renderActions = () => (
    <Row justify="end" style={{ marginTop: 16 }}>
      <Col>
        <Space>
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            {searchButtonText || t('button.search')}
          </Button>
          
          {showReset && (
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={loading}
            >
              {resetButtonText || t('button.reset')}
            </Button>
          )}
          
          {showToggle && advancedFields.length > 0 && (
            <Button 
              type="link"
              icon={isAdvancedExpanded ? <UpOutlined /> : <DownOutlined />}
              onClick={toggleAdvanced}
              disabled={loading}
            >
              {isAdvancedExpanded 
                ? (collapseButtonText || t('button.collapse'))
                : (expandButtonText || t('button.expand'))
              }
            </Button>
          )}
        </Space>
      </Col>
    </Row>
  );

  // 渲染表单内容
  const renderFormContent = () => (
    <Form
      form={form}
      layout={layout.layout || 'horizontal'}
      labelCol={layout.labelCol}
      wrapperCol={layout.wrapperCol}
      colon={layout.colon}
      initialValues={initialValues}
      onValuesChange={handleValuesChange}
    >
      {renderBasicFields()}
      {renderAdvancedFields()}
      {renderActions()}
    </Form>
  );

  // 如果有标题，使用 Card 包装
  if (title) {
    return (
      <Card 
        title={title}
        style={style}
        className={className}
        size="small"
      >
        {renderFormContent()}
      </Card>
    );
  }

  // 普通渲染
  return (
    <div style={style} className={className}>
      {renderFormContent()}
    </div>
  );
});

SearchForm.displayName = 'SearchForm';

export default SearchForm; 