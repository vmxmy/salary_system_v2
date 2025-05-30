import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Space,
  Button,
  Tabs,
  Card,
  Row,
  Col,
  Tag,
  App
} from 'antd';
import { useTranslation } from 'react-i18next';
import type { ReportDataSource } from '../types';
import { dataSourceAPI } from '../../../../api/reports';

const { Option } = Select;
const { TextArea } = Input;

interface DataSourceFormProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialValues?: ReportDataSource | null;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

const DataSourceForm: React.FC<DataSourceFormProps> = ({
  visible,
  mode,
  initialValues,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
      setConnectionTestResult(null);
    }
  }, [visible, mode, initialValues, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const values = await form.validateFields([
        'connection_type',
        'schema_name',
        'table_name',
        'connection_config'
      ]);
      
      const response = await dataSourceAPI.testConnection({
        connection_type: values.connection_type,
        connection_config: values.connection_config || {},
        schema_name: values.schema_name,
        table_name: values.table_name
      });
      
      setConnectionTestResult({
        success: response.data.success,
        message: response.data.message
      });
      
      if (response.data.success) {
        message.success(t('connectionTestSuccess'));
      } else {
        message.error(response.data.message || t('connectionTestFailed'));
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionTestResult({
        success: false,
        message: t('connectionTestFailed')
      });
      message.error(t('connectionTestFailed'));
    } finally {
      setTestingConnection(false);
    }
  };

  // 定义 Tabs 的 items
  const tabItems = [
    {
      key: 'basic',
      label: t('basicInfo'),
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={t('dataSourceCode')}
                rules={[{ required: true, message: t('dataSourceCodeRequired') }]}
              >
                <Input placeholder={t('dataSourceCodePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('dataSourceName')}
                rules={[{ required: true, message: t('dataSourceNameRequired') }]}
              >
                <Input placeholder={t('dataSourceNamePlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={t('description')}
          >
            <TextArea
              rows={3}
              placeholder={t('descriptionPlaceholder')}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label={t('category')}
              >
                <Select placeholder={t('selectCategory')}>
                  <Option value="hr">{t('hrData')}</Option>
                  <Option value="payroll">{t('payrollData')}</Option>
                  <Option value="finance">{t('financeData')}</Option>
                  <Option value="system">{t('systemData')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="source_type"
                label={t('sourceType')}
                rules={[{ required: true, message: t('sourceTypeRequired') }]}
              >
                <Select placeholder={t('selectSourceType')}>
                  <Option value="table">{t('table')}</Option>
                  <Option value="view">{t('view')}</Option>
                  <Option value="query">{t('customQuery')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label={t('status')}
                valuePropName="checked"
              >
                <Switch
                  checkedChildren={t('active')}
                  unCheckedChildren={t('inactive')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label={t('sortOrder')}
              >
                <InputNumber
                  min={0}
                  placeholder={t('sortOrderPlaceholder')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tags"
            label={t('tags')}
          >
            <Select
              mode="tags"
              placeholder={t('tagsPlaceholder')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </>
      )
    },
    {
      key: 'connection',
      label: t('connectionConfig'),
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="connection_type"
                label={t('connectionType')}
                rules={[{ required: true, message: t('connectionTypeRequired') }]}
              >
                <Select placeholder={t('selectConnectionType')}>
                  <Option value="postgresql">PostgreSQL</Option>
                  <Option value="mysql">MySQL</Option>
                  <Option value="sqlserver">SQL Server</Option>
                  <Option value="oracle">Oracle</Option>
                  <Option value="sqlite">SQLite</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="schema_name"
                label={t('schemaName')}
                rules={[{ required: true, message: t('schemaNameRequired') }]}
              >
                <Input placeholder={t('schemaNamePlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.source_type !== currentValues.source_type
            }
          >
            {({ getFieldValue }) => {
              const sourceType = getFieldValue('source_type');
              
              if (sourceType === 'table') {
                return (
                  <Form.Item
                    name="table_name"
                    label={t('tableName')}
                    rules={[{ required: true, message: t('tableNameRequired') }]}
                  >
                    <Input placeholder={t('tableNamePlaceholder')} />
                  </Form.Item>
                );
              }
              
              if (sourceType === 'view') {
                return (
                  <Form.Item
                    name="view_name"
                    label={t('viewName')}
                    rules={[{ required: true, message: t('viewNameRequired') }]}
                  >
                    <Input placeholder={t('viewNamePlaceholder')} />
                  </Form.Item>
                );
              }
              
              if (sourceType === 'query') {
                return (
                  <Form.Item
                    name="custom_query"
                    label={t('customQuery')}
                    rules={[{ required: true, message: t('customQueryRequired') }]}
                  >
                    <TextArea
                      rows={6}
                      placeholder={t('customQueryPlaceholder')}
                    />
                  </Form.Item>
                );
              }
              
              return null;
            }}
          </Form.Item>

          {connectionTestResult && (
            <Card
              size="small"
              style={{
                marginTop: 16,
                borderColor: connectionTestResult.success ? '#52c41a' : '#ff4d4f'
              }}
            >
              <Space>
                <Tag color={connectionTestResult.success ? 'success' : 'error'}>
                  {connectionTestResult.success ? t('connectionSuccess') : t('connectionFailed')}
                </Tag>
                <span>{connectionTestResult.message}</span>
              </Space>
            </Card>
          )}
        </>
      )
    },
    {
      key: 'access',
      label: t('accessControl'),
      children: (
        <>
          <Form.Item
            name="access_level"
            label={t('accessLevel')}
          >
            <Select placeholder={t('selectAccessLevel')}>
              <Option value="public">{t('public')}</Option>
              <Option value="protected">{t('protected')}</Option>
              <Option value="private">{t('private')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="allowed_roles"
            label={t('allowedRoles')}
          >
            <Select
              mode="multiple"
              placeholder={t('selectAllowedRoles')}
              style={{ width: '100%' }}
            >
              <Option value="admin">{t('admin')}</Option>
              <Option value="hr_manager">{t('hrManager')}</Option>
              <Option value="payroll_manager">{t('payrollManager')}</Option>
              <Option value="employee">{t('employee')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="allowed_users"
            label={t('allowedUsers')}
          >
            <Select
              mode="tags"
              placeholder={t('allowedUsersPlaceholder')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </>
      )
    },
    {
      key: 'performance',
      label: t('performanceConfig'),
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cache_enabled"
                label={t('cacheEnabled')}
                valuePropName="checked"
              >
                <Switch
                  checkedChildren={t('enabled')}
                  unCheckedChildren={t('disabled')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cache_duration"
                label={t('cacheDuration')}
              >
                <InputNumber
                  min={0}
                  placeholder={t('cacheDurationPlaceholder')}
                  style={{ width: '100%' }}
                  addonAfter={t('seconds')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="max_rows"
            label={t('maxRows')}
          >
            <InputNumber
              min={1}
              max={100000}
              placeholder={t('maxRowsPlaceholder')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </>
      )
    }
  ];

  return (
    <Modal
      title={mode === 'create' ? t('addDataSource') : t('editDataSource')}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('cancel')}
        </Button>,
        <Button
          key="test"
          type="default"
          loading={testingConnection}
          onClick={handleTestConnection}
        >
          {t('testConnection')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {t('save')}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          source_type: 'table',
          access_level: 'public',
          cache_enabled: true,
          cache_duration: 300,
          max_rows: 10000,
          is_active: true,
          sort_order: 0
        }}
      >
        <Tabs defaultActiveKey="basic" items={tabItems} />
      </Form>
    </Modal>
  );
};

export default DataSourceForm; 