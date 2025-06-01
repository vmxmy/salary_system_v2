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
  Tooltip,
  Breadcrumb,
} from 'antd';
import {
  SaveOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  HomeOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SqlEditor from './SqlEditor';
import DescriptionLinesEditor from './DescriptionLinesEditor';
import TableActionButton from '../common/TableActionButton';
import { reportViewAPI } from '../../api/reportView';
import type { 
  ReportView, 
  ReportViewCreateForm, 
  ReportViewUpdateForm,
  SqlValidationResponse 
} from '../../types/reportView';
import { pinyin } from 'pinyin'; // 导入 pinyin 库

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  // 监听表单变化
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

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
      
      // 重置未保存状态
      setHasUnsavedChanges(false);
      
      // 如果是编辑模式，提供用户选择
      if (mode === 'edit') {
        const key = `save-success-${Date.now()}`;
        message.success({
          content: (
            <span>
              保存成功！
              <Button 
                type="link" 
                size="small" 
                onClick={() => {
                  message.destroy(key);
                  onCancel?.();
                }}
                style={{ marginLeft: 8 }}
              >
                返回列表
              </Button>
            </span>
          ),
          key,
          duration: 5000,
        });
      }
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
      
      // 先验证表单
      const values = await form.validateFields();
      
      // 检查SQL是否已验证
      if (!sqlValidation?.is_valid) {
        message.warning('请先验证SQL查询语句');
        return;
      }

      // 先保存当前表单内容到数据库
      message.loading({ content: '正在保存并同步视图...', key: 'sync-process' });
      
      await reportViewAPI.updateReportView(initialValues.id, values as ReportViewUpdateForm);
      
      // 然后同步视图
      await reportViewAPI.syncReportView(initialValues.id, { force_recreate: true });
      
      message.success({ content: '保存并同步成功', key: 'sync-process' });
      
      onSyncSuccess?.();
    } catch (error: any) {
      console.error('Failed to sync view:', error);
      message.error({ content: `同步失败: ${error.message}`, key: 'sync-process' });
    } finally {
      setSyncing(false);
    }
  };

  // 生成视图名称
  const generateViewName = (name: string) => {
    if (!name) return '';
    
    // 将中文名称转换为拼音
    const pinyinArray = pinyin(name, {
      style: pinyin.STYLE_NORMAL, // 不带声调的拼音
      segment: true, // 启用分词，处理多音字
    });

    let pinyinName = pinyinArray.map(item => item[0]).join('_'); // 将拼音数组转换为下划线连接的字符串

    // 进一步处理，确保符合 PostgreSQL 命名规范
    let viewName = pinyinName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '') // 移除非字母数字下划线字符
      .replace(/_+/g, '_') // 合并多个下划线
      .replace(/^_|_$/g, ''); // 移除首尾下划线

    // PostgreSQL 标识符最大长度为 63 个字符
    const MAX_LENGTH = 63;
    const PREFIX = 'view_';
    const availableLength = MAX_LENGTH - PREFIX.length;

    if (viewName.length > availableLength) {
      // 如果长度超出，进行截断
      viewName = viewName.substring(0, availableLength);
    }
    
    return `${PREFIX}${viewName}`;
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
      {/* 面包屑导航 */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <HomeOutlined />
                <span style={{ marginLeft: 4 }}>首页</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <DatabaseOutlined />
                <span style={{ marginLeft: 4 }}>视图报表管理</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                {mode === 'create' ? '新建报表视图' : 
                  <>
                    编辑报表视图: {initialValues?.name || ''}
                    {hasUnsavedChanges && (
                      <span style={{ color: '#ff7a00', marginLeft: 8 }}>
                        (有未保存的修改)
                      </span>
                    )}
                  </>
                }
              </Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          <Col>
            <Button 
              type="link" 
              icon={<CloseOutlined />}
              onClick={onCancel}
              size="small"
            >
              返回列表
            </Button>
          </Col>
        </Row>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleFormChange}
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

          <Form.Item
            name="report_title"
            label="报表标题"
          >
            <Input 
              placeholder="请输入报表标题（用于导出时的表格标题）"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="description_lines"
            label="报表说明行"
          >
            <DescriptionLinesEditor
              placeholder="请输入说明内容"
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
            hasUnsavedChanges && mode === 'edit' && (
              <span style={{ color: '#ff7a00', fontSize: '12px' }}>
                ⚠️ 修改后需要同步才能生效
              </span>
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
                <Tooltip title={mode === 'edit' ? '返回列表' : '取消编辑'}>
                  <Button 
                    type="link" 
                    icon={<CloseOutlined />}
                    onClick={onCancel}
                    size="small"
                    style={{ color: '#666' }}
                  >
                    {mode === 'edit' ? '返回列表' : '取消'}
                  </Button>
                </Tooltip>

                {/* 创建模式：只显示保存按钮 */}
                {mode === 'create' && (
                  <Tooltip title="创建新报表">
                    <Button
                      type="link"
                      icon={<SaveOutlined />}
                      loading={loading}
                      onClick={handleSubmit}
                      disabled={!sqlValidation?.is_valid}
                      size="small"
                      style={{ 
                        color: sqlValidation?.is_valid ? '#52c41a' : '#d9d9d9',
                        fontWeight: 'bold'
                      }}
                    >
                      创建报表
                    </Button>
                  </Tooltip>
                )}

                {/* 编辑模式：显示保存和同步按钮 */}
                {mode === 'edit' && initialValues?.id && (
                  <>
                    {/* 如果有未保存的修改，优先显示保存按钮 */}
                    {hasUnsavedChanges && (
                      <Tooltip title="保存当前修改">
                        <Button
                          type="link"
                          icon={<SaveOutlined />}
                          loading={loading}
                          onClick={handleSubmit}
                          disabled={!sqlValidation?.is_valid}
                          size="small"
                          style={{ 
                            color: sqlValidation?.is_valid ? '#52c41a' : '#d9d9d9'
                          }}
                        >
                          保存修改
                        </Button>
                      </Tooltip>
                    )}
                    
                    {/* 同步按钮 */}
                    <Tooltip title={hasUnsavedChanges ? "保存当前修改并同步到数据库" : "同步视图到数据库"}>
                      <Button
                        type="link"
                        icon={<SyncOutlined />}
                        loading={syncing}
                        onClick={handleSyncView}
                        disabled={hasUnsavedChanges && !sqlValidation?.is_valid}
                        size="small"
                        style={{ 
                          color: '#1890ff',
                          fontWeight: hasUnsavedChanges ? 'bold' : 'normal'
                        }}
                      >
                        {hasUnsavedChanges ? '保存并同步' : '同步视图'}
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default ReportViewForm; 