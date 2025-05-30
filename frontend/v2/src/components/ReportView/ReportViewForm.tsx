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
        message.warning('请先验证SQL查询语句');
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
      message.warning('请先保存报表视图');
      return;
    }

    try {
      setSyncing(true);
      await reportViewAPI.syncReportView(initialValues.id, { force_recreate: true });
      message.success('视图同步成功');
      onSyncSuccess?.();
    } catch (error: any) {
      console.error('Failed to sync view:', error);
      message.error(`同步失败: ${error.message}`);
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
        <Card title="基础信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="报表名称"
                rules={[
                  { required: true, message: '请输入报表名称' },
                  { max: 255, message: '报表名称不能超过255个字符' },
                ]}
              >
                <Input 
                  placeholder="请输入报表名称"
                  onChange={handleNameChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="view_name"
                label="视图名称"
                rules={[
                  { required: true, message: '请输入视图名称' },
                  { max: 100, message: '视图名称不能超过100个字符' },
                  { 
                    pattern: /^[a-z][a-z0-9_]*$/,
                    message: '视图名称只能包含小写字母、数字和下划线，且必须以字母开头'
                  },
                ]}
              >
                <Input placeholder="请输入视图名称（英文）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="报表分类"
              >
                <Select placeholder="请选择报表分类" allowClear>
                  <Option value="工资报表">工资报表</Option>
                  <Option value="考勤报表">考勤报表</Option>
                  <Option value="人事报表">人事报表</Option>
                  <Option value="统计报表">统计报表</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="schema_name"
                label="数据库模式"
                rules={[{ required: true, message: '请输入数据库模式' }]}
              >
                <Input placeholder="请输入数据库模式名称" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="报表描述"
          >
            <TextArea
              rows={3}
              placeholder="请输入报表描述"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="是否启用"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_public"
                label="是否公开"
                valuePropName="checked"
              >
                <Switch checkedChildren="公开" unCheckedChildren="私有" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SQL编辑器 */}
        <Card 
          title="SQL查询语句" 
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
              { required: true, message: '请输入SQL查询语句' },
              {
                validator: (_, value) => {
                  if (value && !sqlValidation?.is_valid) {
                    return Promise.reject(new Error('SQL查询语句验证失败，请检查语法'));
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
                  {mode === 'create' ? '创建报表' : '保存修改'}
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