import React from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  InputNumber
} from 'antd';
import { useTranslation } from 'react-i18next';
import type { DataSourceField } from './types';

const { TextArea } = Input;
const { Option } = Select;

interface FieldEditModalProps {
  visible: boolean;
  currentField: Partial<DataSourceField> | null;
  form: any;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const FieldEditModal: React.FC<FieldEditModalProps> = ({
  visible,
  currentField,
  form,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);

  return (
    <Modal
      title={currentField && 'id' in currentField ? '编辑字段' : '添加字段'}
      open={visible}
      onOk={onSave}
      onCancel={onCancel}
      width={800}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="field_name"
              label="字段名"
              rules={[{ required: true, message: '请输入字段名' }]}
            >
              <Input placeholder="field_name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="field_alias" label="字段别名">
              <Input placeholder="字段别名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="display_name_zh" label="中文显示名">
              <Input placeholder="中文显示名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="display_name_en" label="英文显示名">
              <Input placeholder="English Display Name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="field_type" label="字段类型">
              <Select placeholder="选择类型">
                <Option value="string">字符串</Option>
                <Option value="number">数字</Option>
                <Option value="date">日期</Option>
                <Option value="boolean">布尔值</Option>
                <Option value="text">文本</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="field_group" label="字段分组">
              <Input placeholder="字段分组" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="sort_order" label="排序">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="描述">
          <TextArea rows={2} placeholder="字段描述" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="is_visible" label="可见" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="is_searchable" label="可搜索" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="is_sortable" label="可排序" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="is_filterable" label="可筛选" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="is_exportable" label="可导出" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="enable_aggregation" label="启用聚合" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default FieldEditModal; 