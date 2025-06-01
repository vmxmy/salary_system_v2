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
        message.warning(t('components:auto_sql_e8afb7'));
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
    }
  };

  // 处理SQL验证结果
  const handleSqlValidation = (result: SqlValidationResponse | null) => {
    setSqlValidation(result);
  };

  // 同步视图到数据库
  const handleSyncView = async () => {
    if (!initialValues?.id) {
      message.warning(t('components:auto_text_e8afb7'));
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
        <Card title={t('components:auto_text_e59fba')} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('components:auto_text_e68aa5')}
                rules={[
                  { required: true, message: t('components:auto_text_e8afb7') },
                  { max: 255, message: t('components:auto_255_e68aa5') },
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
                  { required: true, message: t('components:auto_text_e8afb7') },
                  { max: 100, message: t('components:auto_100_e8a786') },
                  { 
                    pattern: /^[a-z][a-z0-9_]*$/,
                    message: t('components:auto____e8a786')
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
                rules={[{ required: true, message: t('components:auto_text_e8afb7') }]}
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
              { required: true, message: t('components:auto_sql_e8afb7') },
              {
                validator: (_, value) => {
                  if (value && !sqlValidation?.is_valid) {
                    return Promise.reject(new Error(t('components:auto_sql__53514c')));
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
              </Space>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default ReportViewForm; 