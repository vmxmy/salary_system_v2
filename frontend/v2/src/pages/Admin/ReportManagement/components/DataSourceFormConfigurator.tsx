import React from 'react';
import {
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  InputNumber
} from 'antd';
import { useTranslation } from 'react-i18next';
import type { DataSourceFormConfiguratorProps } from './types';

const { TextArea } = Input;
const { Option } = Select;

const DataSourceFormConfigurator: React.FC<DataSourceFormConfiguratorProps> = ({
  form,
  mode,
  dataSource
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const isEdit = mode === 'edit';

  return (
    <Form form={form} layout="vertical">
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="数据源名称"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input placeholder="请输入数据源名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="code"
            label="数据源编码"
            rules={[{ required: true, message: '请输入数据源编码' }]}
          >
            <Input placeholder="请输入唯一的数据源编码" disabled={isEdit} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="描述">
        <TextArea rows={3} placeholder="请输入数据源描述" />
      </Form.Item>

      <Row gutter={24}>
        <Col span={8}>
          <Form.Item name="category" label="分类">
            <Select placeholder="请选择分类">
              <Option value="hr">人力资源</Option>
              <Option value="finance">财务</Option>
              <Option value="business">业务</Option>
              <Option value="system">系统</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="source_type"
            label="数据源类型"
            rules={[{ required: true, message: '请选择数据源类型' }]}
          >
            <Select placeholder="请选择数据源类型">
              <Option value="table">数据表</Option>
              <Option value="view">视图</Option>
              <Option value="query">自定义查询</Option>
              <Option value="procedure">存储过程</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} placeholder="排序顺序" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="tags" label="标签">
        <Input placeholder="多个标签用逗号分隔" />
      </Form.Item>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="is_active" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="is_system" label="系统内置" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" disabled />
          </Form.Item>
        </Col>
      </Row>

      {/* 权限设置部分 */}
      <Form.Item name="access_level" label="访问级别">
        <Select placeholder="请选择访问级别">
          <Option value="public">公开</Option>
          <Option value="private">私有</Option>
          <Option value="restricted">受限</Option>
        </Select>
      </Form.Item>

      <Form.Item name="allowed_roles" label="允许访问的角色">
        <Select mode="multiple" placeholder="请选择角色">
          <Option value="admin">管理员</Option>
          <Option value="hr">HR专员</Option>
          <Option value="manager">经理</Option>
          <Option value="employee">员工</Option>
        </Select>
      </Form.Item>

      <Form.Item name="allowed_users" label="允许访问的用户">
        <Select mode="multiple" placeholder="请选择用户">
          {/* 这里可以从用户API加载 */}
        </Select>
      </Form.Item>

      {/* 性能配置部分 */}
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="cache_enabled" label="启用缓存" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="cache_duration" label="缓存时长(秒)">
            <InputNumber min={60} max={86400} placeholder="3600" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="max_rows" label="最大返回行数">
        <InputNumber min={100} max={100000} placeholder="10000" style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  );
};

export default DataSourceFormConfigurator; 