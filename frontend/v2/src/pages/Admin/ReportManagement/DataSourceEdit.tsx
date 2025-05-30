import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Button,
  Space,
  Tabs,
  message,
  Tag,
  Spin,
  Badge
} from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  EyeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { dataSourceAPI } from '../../../api/reports';
import {
  DataSourceFormConfigurator,
  DataPreviewTable,
  APIConnectionSettings,
  FieldsManagement
} from './components';
import type {
  ConnectionStatus,
  DataSource,
  DataSourceField,
  DataSourceCreateRequest,
  DataSourceUpdateRequest,
  DetectedField,
  FieldDetectionRequest,
  ConnectionTestRequest,
  TabsProps
} from './components/types';
import { Typography } from 'antd';

const { Title } = Typography;

interface DataSourceEditProps {
  mode?: 'create' | 'edit';
}

const DataSourceEdit: React.FC<DataSourceEditProps> = ({ mode: propMode }) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const mode = propMode || (id ? 'edit' : 'create');
  const isEdit = mode === 'edit';
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [detectingFields, setDetectingFields] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [fields, setFields] = useState<DataSourceField[]>([]);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ 
    tested: false, 
    success: false, 
    message: '' 
  });

  // 加载数据源详情
  const loadDataSource = useCallback(async () => {
    if (!isEdit || !id) return;
    
    setLoading(true);
    try {
      const response = await dataSourceAPI.getDataSource(Number(id));
      setDataSource(response.data);
      setFields(response.data.fields || []);
      
      form.setFieldsValue({
        ...response.data,
        tags: response.data.tags?.join(', ') || ''
      });
    } catch (error) {
      message.error('加载数据源失败');
    } finally {
      setLoading(false);
    }
  }, [isEdit, id, form]);

  useEffect(() => {
    loadDataSource();
  }, [loadDataSource]);

  // 测试连接
  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields([
        'connection_type', 'connection_config', 'schema_name'
      ]);
      
      setTestingConnection(true);
      const testData: ConnectionTestRequest = {
        connection_type: values.connection_type,
        connection_config: values.connection_config || {},
        schema_name: values.schema_name,
        table_name: values.table_name
      };
      
      const response = await dataSourceAPI.testConnection(testData);
      setConnectionStatus({
        tested: true,
        success: response.data.success,
        message: response.data.message,
        responseTime: response.data.response_time
      });
      
      if (response.data.success) {
        message.success('连接测试成功！');
      } else {
        message.error(`连接测试失败：${response.data.message}`);
      }
    } catch (error) {
      message.error('连接测试失败');
      setConnectionStatus({
        tested: true,
        success: false,
        message: '连接配置有误'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // 检测字段
  const handleDetectFields = async () => {
    try {
      const values = await form.validateFields([
        'schema_name', 'table_name', 'view_name', 'custom_query', 'source_type'
      ]);
      
      setDetectingFields(true);
      const detectData: FieldDetectionRequest = {
        schema_name: values.schema_name,
        table_name: values.source_type === 'table' ? values.table_name : undefined,
        view_name: values.source_type === 'view' ? values.view_name : undefined,
        custom_query: values.source_type === 'query' ? values.custom_query : undefined,
        connection_config: values.connection_config
      };
      
      const response = await dataSourceAPI.detectFields(detectData);
      setDetectedFields(response.data.fields);
      message.success(`成功检测到 ${response.data.total_count} 个字段`);
      
      setActiveTab('fields');
    } catch (error) {
      message.error('字段检测失败');
    } finally {
      setDetectingFields(false);
    }
  };

  // 保存数据源
  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const tags = values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
      
      const saveData = {
        ...values,
        tags,
        fields: fields.map(field => ({
          ...field,
          data_source_id: undefined
        }))
      };
      
      if (isEdit && id) {
        const updateData: DataSourceUpdateRequest = saveData;
        await dataSourceAPI.updateDataSource(Number(id), updateData);
        message.success('数据源更新成功！');
      } else {
        const createData: DataSourceCreateRequest = saveData;
        const response = await dataSourceAPI.createDataSource(createData);
        message.success('数据源创建成功！');
        navigate(`/admin/report-management/data-sources/${response.data.id}`);
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 标签页配置
  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: (
        <Space>
          <SettingOutlined />
          基础信息
        </Space>
      ),
      children: (
        <Card>
          <DataSourceFormConfigurator 
            form={form} 
            mode={mode} 
            dataSource={dataSource} 
          />
        </Card>
      )
    },
    {
      key: 'connection',
      label: (
        <Space>
          <DatabaseOutlined />
          连接配置
          {connectionStatus.tested && (
            <Badge status={connectionStatus.success ? 'success' : 'error'} />
          )}
        </Space>
      ),
      children: (
        <Card>
          <APIConnectionSettings
            form={form}
            connectionStatus={connectionStatus}
            onTestConnection={handleTestConnection}
            onDetectFields={handleDetectFields}
            testingConnection={testingConnection}
            detectingFields={detectingFields}
          />
        </Card>
      )
    },
    {
      key: 'fields',
      label: (
        <Space>
          <FieldTimeOutlined />
          字段管理
          <Badge count={fields.length} />
        </Space>
      ),
      children: (
        <FieldsManagement
          dataSourceId={id ? Number(id) : undefined}
          fields={fields}
          detectedFields={detectedFields}
          isEdit={isEdit}
          onFieldsChange={setFields}
          onDetectedFieldsChange={setDetectedFields}
          onReload={loadDataSource}
        />
      )
    }
  ];

  if (isEdit) {
    tabItems.push({
      key: 'preview',
      label: (
        <Space>
          <EyeOutlined />
          数据预览
        </Space>
      ),
      children: (
        <DataPreviewTable 
          dataSourceId={id ? Number(id) : undefined} 
          fields={fields} 
        />
      )
    });
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/report-management/data-sources')}
          >
            返回
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {isEdit ? '编辑数据源' : '创建数据源'}
          </Title>
          {isEdit && dataSource && (
            <Tag color={dataSource.is_active ? 'green' : 'red'}>
              {dataSource.is_active ? '已启用' : '已禁用'}
            </Tag>
          )}
        </Space>
      </div>

      <Spin spinning={loading}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems}
        />
      </Spin>

      <div style={{ 
        position: 'fixed', 
        bottom: 24, 
        right: 24, 
        zIndex: 1000,
        background: '#fff',
        padding: '12px 16px',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #d9d9d9'
      }}>
        <Space>
          <Button onClick={() => navigate('/admin/report-management/data-sources')}>
            取消
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            保存
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default DataSourceEdit; 