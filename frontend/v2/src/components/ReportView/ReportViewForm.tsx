/**
 * 报表视图表单组件
 * @description 用于新增和编辑报表视图的表单
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Card,
  Typography,
  message,
  Divider,
} from 'antd';
import {
  SaveOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SqlEditor from './SqlEditor';
import { reportViewAPI } from '../../api/reportView';
import type { 
  ReportView, 
  ReportViewCreateForm, 
  ReportViewUpdateForm,
  SqlValidationResponse 
} from '../../types/reportView';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

interface ReportViewFormProps {
  initialValues?: Partial<ReportView>;
  onSubmit?: (values: ReportViewCreateForm | ReportViewUpdateForm) => void;
  onCancel?: () => void;
  onSyncSuccess?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

const ReportViewForm: React.FC<ReportViewFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  onSyncSuccess,
  loading = false,
  mode = 'create',
}) => {
  const { t } = useTranslation(['reportView', 'common']);
  const [form] = Form.useForm();
  const [sqlValidation, setSqlValidation] = useState<SqlValidationResponse | null>(null);
  const [syncing, setSyncing] = useState(false);

  // 初始化表单值
  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      // 编辑模式：使用传入的初始值
      form.setFieldsValue({
        ...initialValues,
        schema_name: initialValues.schema_name || 'reports',
        is_active: initialValues.is_active ?? true,
        is_public: initialValues.is_public ?? false,
      });
      
      // 如果有SQL查询语句，自动验证一次
      if (initialValues.sql_query) {
        setTimeout(() => {
          // 延迟执行，确保SqlEditor组件已经接收到值
          const validateInitialSql = async () => {
            try {
              const result = await reportViewAPI.validateSql({
                sql_query: initialValues.sql_query!,
                schema_name: initialValues.schema_name || 'reports',
              });
              setSqlValidation(result);
            } catch (error) {
              console.error('Failed to validate initial SQL:', error);
            }
          };
          validateInitialSql();
        }, 100);
      }
    } else if (mode === 'create') {
      // 创建模式：设置默认值
      form.setFieldsValue({
        schema_name: 'reports',
        is_active: true,
        is_public: false,
      });
    }
  }, [initialValues, form, mode]);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 检查SQL是否已验证
      if (!sqlValidation?.is_valid) {
        message.warning({t('components:auto_sql_e8afb7')});
        return;
      }

      onSubmit?.(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 处理SQL验证结果
  const handleSqlValidation = (result: SqlValidationResponse | null) => {
    setSqlValidation(result);
  };

  // 同步视图到数据库
  const handleSyncView = async () => {
    if (!initialValues?.id) {
      message.warning({t('components:auto_text_e8afb7')});
      return;
    }

    try {
      setSyncing(true);
      await reportViewAPI.syncReportView(initialValues.id, { force_recreate: true });
      message.success({t('components:auto_text_e8a786')});
      onSyncSuccess?.();
    } catch (error: any) {
      console.error('Failed to sync view:', error);
      message.error({t('components:auto__error_message__e5908c')});
    } finally {
      setSyncing(false);
    }
  };

  // 生成视图名称
  const generateViewName = (name: string) => {
    if (!name) return '';
    
    // 将中文名称转换为英文视图名称
    const viewName = name
      .toLowerCase()
      .replace(/[\s\u4e00-\u9fa5]+/g, '_') // 替换空格和中文为下划线
      .replace(/[^a-z0-9_]/g, '') // 移除非字母数字下划线字符
      .replace(/_+/g, '_') // 合并多个下划线
      .replace(/^_|_$/g, ''); // 移除首尾下划线
    
    return `view_${viewName}`;
  };

  // 监听报表名称变化，自动生成视图名称
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (mode === 'create' && name) {
      const viewName = generateViewName(name);
      form.setFieldValue('view_name', viewName);
    }
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* 基础信息 */}
        <Card title={t('components:auto_text_e59fba')} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('components:auto_text_e68aa5')}
                rules={[
                  { required: true, message: {t('components:auto_text_e8afb7')} },
                  { max: 255, message: {t('components:auto_255_e68aa5')} },
                ]}
              >
                <Input 
                  placeholder={t('components:auto_text_e8afb7')}
                  onChange={handleNameChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="view_name"
                label={t('components:auto_text_e8a786')}
                rules={[
                  { required: true, message: {t('components:auto_text_e8afb7')} },
                  { max: 100, message: {t('components:auto_100_e8a786')} },
                  { 
                    pattern: /^[a-z][a-z0-9_]*$/,
                    message: {t('components:auto____e8a786')}
                  },
                ]}
              >
                <Input placeholder={t('components:auto____e8afb7')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label={t('components:auto_text_e68aa5')}
              >
                <Select placeholder={t('components:auto_text_e8afb7')} allowClear>
                  <Option value={t('components:auto_text_e5b7a5')}>工资报表</Option>
                  <Option value={t('components:auto_text_e88083')}>考勤报表</Option>
                  <Option value={t('components:auto_text_e4baba')}>人事报表</Option>
                  <Option value={t('components:auto_text_e7bb9f')}>统计报表</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="schema_name"
                label={t('components:auto_text_e695b0')}
                rules={[{ required: true, message: {t('components:auto_text_e8afb7')} }]}
              >
                <Input placeholder={t('components:auto_text_e8afb7')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={t('components:auto_text_e68aa5')}
          >
            <TextArea
              rows={3}
              placeholder={t('components:auto_text_e8afb7')}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label={t('components:auto_text_e698af')}
                valuePropName="checked"
              >
                <Switch checkedChildren={t('components:auto_text_e590af')} unCheckedChildren={t('components:auto_text_e7a681')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_public"
                label={t('components:auto_text_e698af')}
                valuePropName="checked"
              >
                <Switch checkedChildren={t('components:auto_text_e585ac')} unCheckedChildren={t('components:auto_text_e7a781')} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SQL编辑器 */}
        <Card 
          title={t('components:auto_sql_53514c')} 
          style={{ marginBottom: 16 }}
          extra={
            mode === 'edit' && initialValues?.id && (
              <Button
                type="primary"
                icon={<SyncOutlined />}
                loading={syncing}
                onClick={handleSyncView}
                size="small"
              >
                同步视图
              </Button>
            )
          }
        >
          <Form.Item
            name="sql_query"
            rules={[
              { required: true, message: {t('components:auto_sql_e8afb7')} },
              {
                validator: (_, value) => {
                  if (value && !sqlValidation?.is_valid) {
                    return Promise.reject(new Error({t('components:auto_sql__53514c')}));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <SqlEditor
              height={400}
              onValidate={handleSqlValidation}
              schemaName={form.getFieldValue('schema_name')}
            />
          </Form.Item>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <Row justify="end">
            <Col>
              <Space>
                <Button onClick={onCancel}>
                  取消
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={!sqlValidation?.is_valid}
                >
                  {mode === 'create' ? {t('components:auto_text_e5889b')} : {t('components:auto_text_e4bf9d')}}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default ReportViewForm; 