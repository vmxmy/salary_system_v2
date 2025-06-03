import React, { useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, DatePicker, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { CalculationRuleSet, CreateCalculationRuleSetRequest, UpdateCalculationRuleSetRequest } from '../types/calculationConfig';

interface CalculationRuleSetManagerProps {
  ruleSets: CalculationRuleSet[];
  onCreateRuleSet: (data: CreateCalculationRuleSetRequest) => Promise<void>;
  onUpdateRuleSet: (id: number, data: UpdateCalculationRuleSetRequest) => Promise<void>;
  onActivateRuleSet: (id: number) => Promise<void>;
  onDeactivateRuleSet: (id: number) => Promise<void>;
}

const CalculationRuleSetManager: React.FC<CalculationRuleSetManagerProps> = ({
  ruleSets,
  onCreateRuleSet,
  onUpdateRuleSet,
  onActivateRuleSet,
  onDeactivateRuleSet
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRuleSet, setEditingRuleSet] = useState<CalculationRuleSet | null>(null);
  const [loading, setLoading] = useState(false);

  // 表格列定义
  const columns: ColumnsType<CalculationRuleSet> = [
    {
      title: t('payroll:calculation_config.rule_set_name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('payroll:calculation_config.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('payroll:calculation_config.effective_date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('payroll:calculation_config.expiry_date'),
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: t('common:status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('common:active') : t('common:inactive')}
        </Tag>
      ),
    },
    {
      title: String(t('payroll:calculation_config.rules_count')),
      key: 'rules_count',
      width: 100,
      render: (_, record) => record.rules?.length || 0,
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('common:edit')}
          </Button>
          {record.is_active ? (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleDeactivate(record.id)}
            >
              {t('common:deactivate')}
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleActivate(record.id)}
            >
              {t('common:activate')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 处理创建
  const handleCreate = () => {
    setEditingRuleSet(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (ruleSet: CalculationRuleSet) => {
    setEditingRuleSet(ruleSet);
    form.setFieldsValue({
      name: ruleSet.name,
      description: ruleSet.description,
      effective_date: dayjs(ruleSet.effective_date),
      expiry_date: ruleSet.expiry_date ? dayjs(ruleSet.expiry_date) : null,
    });
    setModalVisible(true);
  };

  // 处理激活
  const handleActivate = async (id: number) => {
    try {
      await onActivateRuleSet(id);
    } catch (error) {
      message.error(t('common:error.operation_failed'));
    }
  };

  // 处理停用
  const handleDeactivate = async (id: number) => {
    try {
      await onDeactivateRuleSet(id);
    } catch (error) {
      message.error(t('common:error.operation_failed'));
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const data = {
        name: values.name,
        description: values.description,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : undefined,
      };

      if (editingRuleSet) {
        await onUpdateRuleSet(editingRuleSet.id, data);
      } else {
        await onCreateRuleSet(data);
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      // 表单验证失败或API调用失败
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingRuleSet(null);
  };

  return (
    <div className="calculation-rule-set-manager">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          {t('payroll:calculation_config.create_rule_set')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={ruleSets}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('common:pagination.total', { total }),
        }}
      />

      <Modal
        title={editingRuleSet ? t('payroll:calculation_config.edit_rule_set') : t('payroll:calculation_config.create_rule_set')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            effective_date: dayjs(),
          }}
        >
          <Form.Item
            name="name"
            label={t('payroll:calculation_config.rule_set_name')}
            rules={[
              { required: true, message: t('common:validation.required') },
              { max: 100, message: t('common:validation.max_length', { max: 100 }) },
            ]}
          >
            <Input placeholder={t('payroll:calculation_config.rule_set_name_placeholder')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('payroll:calculation_config.description')}
            rules={[
              { max: 500, message: t('common:validation.max_length', { max: 500 }) },
            ]}
          >
            <Input.TextArea 
              rows={3}
              placeholder={t('payroll:calculation_config.description_placeholder')} 
            />
          </Form.Item>

          <Form.Item
            name="effective_date"
            label={t('payroll:calculation_config.effective_date')}
            rules={[
              { required: true, message: t('common:validation.required') },
            ]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="expiry_date"
            label={t('payroll:calculation_config.expiry_date')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CalculationRuleSetManager; 