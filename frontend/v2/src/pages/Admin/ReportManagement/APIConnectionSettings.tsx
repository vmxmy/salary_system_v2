// frontend/v2/src/pages/Admin/ReportManagement/APIConnectionSettings.tsx
import React from 'react';
import { Form, Input, Select, Row, Col, Typography, Card, Divider } from 'antd';
import type { APIConnectionParams } from './types';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface Props {
  params: APIConnectionParams;
  onChange: (params: APIConnectionParams) => void;
  // form: any; // Pass form instance from parent if needed for validation
}

const APIConnectionSettings: React.FC<Props> = ({ params, onChange }) => {
  // Note: Form.Item names should match keys in APIConnectionParams
  // The actual form instance and validation will likely be handled in the parent component
  // This component focuses on rendering the form fields and calling onChange

  const handleFormChange = (changedValues: any, allValues: any) => {
    // Ensure connection_config is an object if it's being changed
    if (changedValues.connection_config && typeof changedValues.connection_config === 'string') {
       try {
         changedValues.connection_config = JSON.parse(changedValues.connection_config);
       } catch (e) {
         // Keep as string if invalid JSON, parent validation will handle
       }
    }
     // Handle nested changes for connection_config if form is not passed from parent
     const updatedParams = { ...params, ...allValues };
     if (changedValues.connection_config && typeof changedValues.connection_config === 'object') {
        updatedParams.connection_config = { ...params.connection_config, ...changedValues.connection_config };
     }


    onChange(updatedParams);
  };

  // Helper to safely get nested connection_config values for initialValues
  const getNestedConfigValue = (key: string) => {
    try {
      const config = typeof params?.connection_config === 'string' ? JSON.parse(params.connection_config) : params?.connection_config;
      return config ? config[key] : undefined;
    } catch (e) {
      return undefined;
    }
  };


  return (
    <Card title="API 连接设置" className="api-settings">
      <Form
        layout="vertical"
        initialValues={{
          ...params,
          // Flatten nested connection_config for initialValues if needed, or handle in parent
          // For JSON string input, initialValue should be the string
          connection_config: typeof params?.connection_config === 'object' ? JSON.stringify(params.connection_config, null, 2) : params?.connection_config,
          // Example for nested fields if not using JSON string input for config:
          // endpoint: getNestedConfigValue('endpoint'),
          // auth_method: getNestedConfigValue('auth_method'),
          // apiKey: getNestedConfigValue('apiKey'),
          // headers: getNestedConfigValue('headers') ? JSON.stringify(getNestedConfigValue('headers'), null, 2) : undefined,
          // request_params: getNestedConfigValue('params') ? JSON.stringify(getNestedConfigValue('params'), null, 2) : undefined,

        }}
        onValuesChange={handleFormChange}
        // form={form} // Use this if passing form from parent
      >
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="connection_type"
              label="连接类型"
              rules={[{ required: true, message: '请选择连接类型' }]}
            >
              <Select placeholder="请选择连接类型">
                {/* TODO: Fetch connection types from backend */}
                <Option value="postgresql">PostgreSQL</Option>
                <Option value="mysql">MySQL</Option>
                <Option value="mongodb">MongoDB</Option>
                <Option value="api">API</Option>
                {/* Add other types as needed */}
              </Select>
            </Form.Item>
          </Col>
          <Col span={16}>
            {/* connection_config is a flexible object, might need dynamic rendering */}
            {/* For simplicity, using a TextArea for JSON config for now */}
            <Form.Item
              name="connection_config"
              label="连接配置 (JSON)"
              rules={[
                { required: true, message: '请输入连接配置' },
                {
                  validator: (_, value) => {
                    try {
                      JSON.parse(value);
                      return Promise.resolve();
                    } catch (e) {
                      return Promise.reject(new Error('无效的 JSON 格式'));
                    }
                  },
                },
              ]}
            >
              <TextArea rows={4} placeholder='请输入连接配置 JSON，例如: {"url": "...", "apiKey": "..."}' />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item name="source_type" label="数据源类型">
              <Select placeholder="请选择数据源类型">
                <Option value="table">表</Option>
                <Option value="view">视图</Option>
                <Option value="query">自定义查询</Option>
              </Select>
            </Form.Item>
          </Col>
          {params?.source_type === 'table' && (
            <Col span={8}>
              <Form.Item name="table_name" label="表名" rules={[{ required: true, message: '请输入表名' }]}>
                <Input placeholder="请输入表名" />
              </Form.Item>
            </Col>
          )}
          {params?.source_type === 'view' && (
            <Col span={8}>
              <Form.Item name="view_name" label="视图名" rules={[{ required: true, message: '请输入视图名' }]}>
                <Input placeholder="请输入视图名" />
              </Form.Item>
            </Col>
          )}
          {params?.source_type !== 'query' && (
             <Col span={8}>
              <Form.Item name="schema_name" label="Schema 名称">
                <Input placeholder="请输入 Schema 名称 (可选)" />
              </Form.Item>
            </Col>
          )}
        </Row>

        {params?.source_type === 'query' && (
          <Form.Item name="custom_query" label="自定义查询" rules={[{ required: true, message: '请输入自定义查询' }]}>
            <TextArea rows={6} placeholder="请输入 SQL 查询语句或 API 请求配置" />
          </Form.Item>
        )}

        {/* Add more API specific fields here based on connection_type if needed */}
        {/* Example: API Key input, OAuth config fields */}
        {params?.connection_type === 'api' && (
           <>
             <Divider orientation="left">API 认证与请求设置</Divider>
             <Row gutter={24}>
               <Col span={12}>
                 {/* If using JSON string for connection_config, these nested fields won't work directly */}
                 {/* You would need to parse/stringify in onChange or use a custom form field */}
                 <Form.Item name={['connection_config', 'endpoint']} label="API 端点 URL" rules={[{ required: true, message: '请输入 API 端点 URL' }]}>
                   <Input placeholder="例如: https://api.example.com/data" />
                 </Form.Item>
               </Col>
               <Col span={12}>
                 <Form.Item name={['connection_config', 'auth_method']} label="认证方式">
                   <Select placeholder="选择认证方式">
                     <Option value="none">无</Option>
                     <Option value="apiKey">API Key</Option>
                     <Option value="oauth2">OAuth 2.0</Option>
                     {/* Add other auth methods */}
                   </Select>
                 </Form.Item>
               </Col>
             </Row>
             {/* Conditional rendering for auth method details */}
             {/* This requires connection_config to be an object, not a JSON string */}
             {/* If using JSON string, you'd need to parse params.connection_config */}
             {typeof params?.connection_config === 'object' && params?.connection_config?.auth_method === 'apiKey' && (
               <Form.Item name={['connection_config', 'apiKey']} label="API Key" rules={[{ required: true, message: '请输入 API Key' }]}>
                 <Input.Password placeholder="请输入 API Key" />
               </Form.Item>
             )}
             {/* Add fields for other auth methods */}

             {/* Request Headers and Params - assuming JSON string input for simplicity */}
             <Form.Item name={['connection_config', 'headers']} label="请求头 (JSON)">
               <TextArea rows={3} placeholder='请输入请求头 JSON，例如: {"Authorization": "Bearer token"}' />
             </Form.Item>

             <Form.Item name={['connection_config', 'params']} label="请求参数 (JSON)">
               <TextArea rows={3} placeholder='请输入请求参数 JSON，例如: {"limit": 100, "offset": 0}' />
             </Form.Item>
           </>
        )}

      </Form>
    </Card>
  );
};

export default APIConnectionSettings;