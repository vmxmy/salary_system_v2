import React, { useState, useCallback, useMemo } from 'react';
import { Button, Space, Modal, Form, Input, Select, Switch, message, Card, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EnhancedProTable } from '../../../../components/common';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import type { ExportFormat } from '../../../../components/common/DataTable';
import ReportDataTable from './ReportDataTable';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 通用报表管理模板属性
export interface ReportManagementTemplateProps<T = any> {
  /** 页面标题 */
  title: string;
  /** 页面描述 */
  description?: string;
  /** 表格类型 */
  tableType: 'templates' | 'calculatedFields' | 'dataSources';
  /** 数据源 */
  dataSource: T[];
  /** 加载状态 */
  loading?: boolean;
  /** 权限配置 */
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canView: boolean;
    canExport: boolean;
    canShare?: boolean;
  };
  /** 操作回调 */
  onAdd?: () => void;
  onEdit?: (record: T) => void;
  onDelete?: (id: string | number) => Promise<void>;
  onView?: (record: T) => void;
  onCopy?: (record: T) => void;
  onShare?: (record: T) => void;
  onRefresh?: () => void;
  onExport?: (format: ExportFormat, data: T[]) => void;
  /** 表单配置 */
  formFields?: FormFieldConfig[];
  /** 自定义操作按钮 */
  extraActions?: React.ReactNode;
}

// 表单字段配置
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'switch' | 'date';
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
  rules?: any[];
}

const ReportManagementTemplate = <T extends Record<string, any>>({
  title,
  description,
  tableType,
  dataSource,
  loading = false,
  permissions,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onCopy,
  onShare,
  onRefresh,
  onExport,
  formFields = [],
  extraActions,
}: ReportManagementTemplateProps<T>) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  
  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  // 处理添加
  const handleAdd = useCallback(() => {
    setEditingRecord(null);
    setIsModalVisible(true);
    form.resetFields();
  }, [form]);

  // 处理编辑
  const handleEdit = useCallback((record: T) => {
    setEditingRecord(record);
    setIsModalVisible(true);
    form.setFieldsValue(record);
    onEdit?.(record);
  }, [form, onEdit]);

  // 处理删除
  const handleDelete = useCallback(async (record: T) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个项目吗？此操作不可撤销。',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await onDelete?.(record.id);
          message.success('删除成功');
          onRefresh?.();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  }, [onDelete, onRefresh]);

  // 处理复制
  const handleCopy = useCallback((record: T) => {
    const copiedRecord = { ...record };
    delete (copiedRecord as any).id;
    (copiedRecord as any).name = `${(record as any).name}_副本`;
    setEditingRecord(copiedRecord);
    setIsModalVisible(true);
    form.setFieldsValue(copiedRecord);
    onCopy?.(record);
  }, [form, onCopy]);

  // 处理分享
  const handleShare = useCallback((record: T) => {
    Modal.info({
      title: '分享设置',
      content: '分享功能开发中...',
      okText: '确定',
    });
    onShare?.(record);
  }, [onShare]);

  // 处理表单提交
  const handleFormSubmit = useCallback(async (values: any) => {
    try {
      // 这里应该调用相应的API
      console.log('Form values:', values);
      message.success(editingRecord ? '更新成功' : '创建成功');
      setIsModalVisible(false);
      onRefresh?.();
    } catch (error) {
      message.error('操作失败');
    }
  }, [editingRecord, onRefresh]);

  // 渲染表单字段
  const renderFormField = (field: FormFieldConfig) => {
    const commonProps = {
      placeholder: field.placeholder || `请输入${field.label}`,
    };

    switch (field.type) {
      case 'textarea':
        return <TextArea rows={4} {...commonProps} />;
      case 'select':
        return (
          <Select {...commonProps}>
            {field.options?.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      case 'switch':
        return <Switch />;
      default:
        return <Input {...commonProps} />;
    }
  };

  // 工具栏按钮
  const toolbarButtons = useMemo(() => {
    const buttons = [];
    
    if (permissions.canCreate && onAdd) {
      buttons.push(
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          {t('button.add')}
        </Button>
      );
    }

    if (extraActions) {
      buttons.push(extraActions);
    }

    return buttons;
  }, [permissions.canCreate, onAdd, handleAdd, extraActions, t]);

  return (
    <Card>
      {/* 页面头部 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
        {description && (
          <Typography.Text type="secondary">
            {description}
          </Typography.Text>
        )}
      </div>

      {/* 工具栏 */}
      {toolbarButtons.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space>{toolbarButtons}</Space>
        </div>
      )}

      {/* 数据表格 */}
      <ReportDataTable
        type={tableType}
        dataSource={dataSource}
        loading={loading}
        onEdit={permissions.canEdit ? handleEdit : undefined}
        onDelete={permissions.canDelete ? handleDelete : undefined}
        onView={permissions.canView ? onView : undefined}
        onCopy={permissions.canCreate ? handleCopy : undefined}
        onShare={permissions.canShare ? handleShare : undefined}
        onRefresh={onRefresh}
        onExport={permissions.canExport ? onExport : undefined}
      />

      {/* 表单弹窗 */}
      <Modal
        title={editingRecord ? `编辑${title}` : `新增${title}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          {formFields.map(field => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={field.rules || (field.required ? [{ required: true, message: `请输入${field.label}` }] : [])}
            >
              {renderFormField(field)}
            </Form.Item>
          ))}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ReportManagementTemplate; 