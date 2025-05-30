import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Alert,
  Divider,
  Form,
  Tag,
  Tooltip,
  Popconfirm,
  message
} from 'antd';
import {
  PlusOutlined,
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { dataSourceAPI } from '../../../../api/reports';
import FieldEditModal from './FieldEditModal';
import type { DataSourceField, DetectedField, ColumnsType } from './types';

interface FieldsManagementProps {
  dataSourceId?: number;
  fields: DataSourceField[];
  detectedFields: DetectedField[];
  isEdit: boolean;
  onFieldsChange: (fields: DataSourceField[]) => void;
  onDetectedFieldsChange: (fields: DetectedField[]) => void;
  onReload: () => Promise<void>;
}

const FieldsManagement: React.FC<FieldsManagementProps> = ({
  dataSourceId,
  fields,
  detectedFields,
  isEdit,
  onFieldsChange,
  onDetectedFieldsChange,
  onReload
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<Partial<DataSourceField> | null>(null);
  const [fieldForm] = Form.useForm();

  // 🔄 同步字段
  const handleSyncFields = async () => {
    if (!isEdit || !dataSourceId) return;
    
    try {
      await dataSourceAPI.syncFields(dataSourceId);
      message.success('字段同步成功！');
      await onReload();
    } catch (error) {
      message.error('字段同步失败');
    }
  };

  // 🏷️ 编辑字段
  const handleEditField = (field: DataSourceField | DetectedField) => {
    setCurrentField(field);
    fieldForm.setFieldsValue(field);
    setFieldModalVisible(true);
  };

  // ➕ 应用检测到的字段
  const handleApplyDetectedFields = () => {
    const newFields: Partial<DataSourceField>[] = detectedFields.map((detected, index) => ({
      field_name: detected.field_name,
      field_type: detected.field_type,
      data_type: detected.data_type,
      is_nullable: detected.is_nullable,
      is_primary_key: detected.is_primary_key,
      is_foreign_key: detected.is_foreign_key,
      is_indexed: detected.is_indexed,
      display_name_zh: detected.comment || detected.field_name,
      display_name_en: detected.field_name,
      description: detected.comment,
      is_visible: true,
      is_searchable: true,
      is_sortable: true,
      is_filterable: true,
      is_exportable: true,
      sort_order: index,
      enable_aggregation: ['number', 'integer', 'decimal', 'float', 'double'].includes(detected.field_type.toLowerCase())
    }));
    
    onFieldsChange([...fields, ...newFields] as DataSourceField[]);
    onDetectedFieldsChange([]);
    message.success(`已添加 ${newFields.length} 个字段`);
  };

  // 保存字段编辑
  const handleSaveField = async () => {
    try {
      const values = await fieldForm.validateFields();
      if (currentField && 'id' in currentField) {
        // 更新现有字段
        onFieldsChange(fields.map(field => 
          field.id === currentField.id ? { ...field, ...values } : field
        ));
      } else {
        // 添加新字段
        const newField: Partial<DataSourceField> = {
          ...values,
          id: Date.now(), // 临时ID
          sort_order: fields.length
        };
        onFieldsChange([...fields, newField as DataSourceField]);
      }
      
      setFieldModalVisible(false);
      setCurrentField(null);
      fieldForm.resetFields();
      message.success('字段保存成功');
    } catch (error) {
      message.error('字段保存失败');
    }
  };

  // 删除字段
  const handleDeleteField = (fieldId: number) => {
    onFieldsChange(fields.filter(field => field.id !== fieldId));
    message.success('字段删除成功');
  };

  // 关闭模态框
  const handleModalCancel = () => {
    setFieldModalVisible(false);
    setCurrentField(null);
    fieldForm.resetFields();
  };

  // 📋 表格列配置
  const fieldsColumns: ColumnsType<DataSourceField> = [
    {
      title: '字段名',
      dataIndex: 'field_name',
      key: 'field_name',
      width: 150,
      fixed: 'left',
      render: (text, record) => (
        <Space>
          <DatabaseOutlined style={{ color: record.is_primary_key ? '#faad14' : '#1890ff' }} />
          <span style={{ fontWeight: record.is_primary_key ? 'bold' : 'normal' }}>{text}</span>
          {record.is_primary_key && <Tag color="gold">主键</Tag>}
          {record.is_foreign_key && <Tag color="cyan">外键</Tag>}
        </Space>
      )
    },
    {
      title: '显示名称',
      dataIndex: 'display_name_zh',
      key: 'display_name_zh',
      width: 150,
      render: text => text || '-'
    },
    {
      title: '字段类型',
      dataIndex: 'field_type',
      key: 'field_type',
      width: 100,
      render: text => <Tag color="blue">{text}</Tag>
    },
    {
      title: '属性',
      key: 'properties',
      width: 200,
      render: (_, record) => (
        <Space wrap>
          {record.is_visible && <Tag color="green">可见</Tag>}
          {record.is_searchable && <Tag color="blue">可搜索</Tag>}
          {record.is_sortable && <Tag color="purple">可排序</Tag>}
          {record.is_filterable && <Tag color="orange">可筛选</Tag>}
          {record.enable_aggregation && <Tag color="red">聚合</Tag>}
        </Space>
      )
    },
    {
      title: '分组',
      dataIndex: 'field_group',
      key: 'field_group',
      width: 100,
      render: text => text || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditField(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此字段？"
            onConfirm={() => handleDeleteField(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 检测到的字段表格列
  const detectedFieldsColumns: ColumnsType<DetectedField> = [
    {
      title: '字段名',
      dataIndex: 'field_name',
      key: 'field_name',
      render: (text, record) => (
        <Space>
          <DatabaseOutlined style={{ color: record.is_primary_key ? '#faad14' : '#1890ff' }} />
          <span style={{ fontWeight: record.is_primary_key ? 'bold' : 'normal' }}>{text}</span>
          {record.is_primary_key && <Tag color="gold">主键</Tag>}
          {record.is_foreign_key && <Tag color="cyan">外键</Tag>}
        </Space>
      )
    },
    {
      title: '数据类型',
      dataIndex: 'data_type',
      key: 'data_type',
      render: text => <Tag color="blue">{text}</Tag>
    },
    {
      title: '是否可空',
      dataIndex: 'is_nullable',
      key: 'is_nullable',
      render: value => value ? <Tag color="orange">可空</Tag> : <Tag color="green">非空</Tag>
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      render: text => text || '-'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditField(record)}
        >
          配置
        </Button>
      )
    }
  ];

  return (
    <Card
      title="字段列表"
      extra={
        <Space>
          {detectedFields.length > 0 && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleApplyDetectedFields}
            >
              应用检测到的字段 ({detectedFields.length})
            </Button>
          )}
          {isEdit && (
            <Button
              icon={<SyncOutlined />}
              onClick={handleSyncFields}
            >
              同步字段
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFieldModalVisible(true)}
          >
            添加字段
          </Button>
        </Space>
      }
    >
      {detectedFields.length > 0 && (
        <>
          <Alert
            type="info"
            message={`检测到 ${detectedFields.length} 个字段，您可以配置后添加到数据源中`}
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={detectedFieldsColumns}
            dataSource={detectedFields}
            rowKey="field_name"
            size="small"
            pagination={false}
            style={{ marginBottom: 24 }}
          />
          <Divider />
        </>
      )}

      <Table
        columns={fieldsColumns}
        dataSource={fields}
        rowKey="id"
        scroll={{ x: 800 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个字段`
        }}
      />

      {/* 字段编辑模态框 */}
      <FieldEditModal
        visible={fieldModalVisible}
        currentField={currentField}
        form={fieldForm}
        onSave={handleSaveField}
        onCancel={handleModalCancel}
      />
    </Card>
  );
};

export default FieldsManagement; 