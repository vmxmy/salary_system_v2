import React, { useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, DatePicker, InputNumber, Row, Col, Card, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { TaxConfig, TaxBracket, CreateTaxConfigRequest, UpdateTaxConfigRequest } from '../types/calculationConfig';

interface TaxConfigManagerProps {
  configs: TaxConfig[];
  onCreateConfig: (data: CreateTaxConfigRequest) => Promise<void>;
  onUpdateConfig: (id: number, data: UpdateTaxConfigRequest) => Promise<void>;
}

const TaxConfigManager: React.FC<TaxConfigManagerProps> = ({
  configs,
  onCreateConfig,
  onUpdateConfig
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TaxConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);

  // 表格列定义
  const columns: ColumnsType<TaxConfig> = [
    {
      title: t('payroll:calculation_config.config_name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: t('payroll:calculation_config.tax_year'),
      dataIndex: 'tax_year',
      key: 'tax_year',
      width: 100,
    },
    {
      title: t('payroll:calculation_config.effective_date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('payroll:calculation_config.standard_deduction'),
      dataIndex: 'standard_deduction',
      key: 'standard_deduction',
      width: 120,
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: t('payroll:calculation_config.tax_brackets_count'),
      key: 'tax_brackets_count',
      width: 100,
      render: (_, record) => record.tax_brackets?.length || 0,
    },
    {
      title: t('common:status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('common:active') : t('common:inactive')}
        </Tag>
      ),
    },
    {
      title: t('common:action.title'),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          {t('common:edit')}
        </Button>
      ),
    },
  ];

  // 税率档次表格列定义
  const bracketColumns: ColumnsType<TaxBracket> = [
    {
      title: t('payroll:calculation_config.min_amount'),
      dataIndex: 'min_amount',
      key: 'min_amount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: t('payroll:calculation_config.max_amount'),
      dataIndex: 'max_amount',
      key: 'max_amount',
      render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : t('payroll:calculation_config.unlimited'),
    },
    {
      title: t('payroll:calculation_config.tax_rate'),
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
    },
    {
      title: t('payroll:calculation_config.quick_deduction'),
      dataIndex: 'quick_deduction',
      key: 'quick_deduction',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: t('common:action.title'),
      key: 'actions',
      render: (_, record, index) => (
        <Button
          type="link"
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveBracket(index)}
        >
          {t('common:delete')}
        </Button>
      ),
    },
  ];

  // 处理创建
  const handleCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    setTaxBrackets([]);
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (config: TaxConfig) => {
    setEditingConfig(config);
    setTaxBrackets(config.tax_brackets || []);
    form.setFieldsValue({
      name: config.name,
      tax_year: config.tax_year,
      effective_date: dayjs(config.effective_date),
      expiry_date: config.expiry_date ? dayjs(config.expiry_date) : null,
      standard_deduction: config.standard_deduction,
      additional_deduction_child: config.additional_deduction_child,
      additional_deduction_elderly: config.additional_deduction_elderly,
      additional_deduction_education: config.additional_deduction_education,
      additional_deduction_housing: config.additional_deduction_housing,
      additional_deduction_medical: config.additional_deduction_medical,
    });
    setModalVisible(true);
  };

  // 添加税率档次
  const handleAddBracket = () => {
    const values = form.getFieldsValue(['bracket_min_amount', 'bracket_max_amount', 'bracket_tax_rate', 'bracket_quick_deduction']);
    
    if (!values.bracket_min_amount || !values.bracket_tax_rate) {
      return;
    }

    const newBracket: TaxBracket = {
      min_amount: values.bracket_min_amount,
      max_amount: values.bracket_max_amount || undefined,
      tax_rate: values.bracket_tax_rate / 100,
      quick_deduction: values.bracket_quick_deduction || 0,
    };

    setTaxBrackets([...taxBrackets, newBracket]);
    
    // 清空税率档次表单字段
    form.setFieldsValue({
      bracket_min_amount: undefined,
      bracket_max_amount: undefined,
      bracket_tax_rate: undefined,
      bracket_quick_deduction: undefined,
    });
  };

  // 删除税率档次
  const handleRemoveBracket = (index: number) => {
    const newBrackets = taxBrackets.filter((_, i) => i !== index);
    setTaxBrackets(newBrackets);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (taxBrackets.length === 0) {
        throw new Error(t('payroll:calculation_config.tax_brackets_required'));
      }

      const data = {
        name: values.name,
        tax_year: values.tax_year,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : undefined,
        tax_brackets: taxBrackets,
        standard_deduction: values.standard_deduction,
        additional_deduction_child: values.additional_deduction_child || 0,
        additional_deduction_elderly: values.additional_deduction_elderly || 0,
        additional_deduction_education: values.additional_deduction_education || 0,
        additional_deduction_housing: values.additional_deduction_housing || 0,
        additional_deduction_medical: values.additional_deduction_medical || 0,
      };

      if (editingConfig) {
        await onUpdateConfig(editingConfig.id, data);
      } else {
        await onCreateConfig(data);
      }

      setModalVisible(false);
      form.resetFields();
      setTaxBrackets([]);
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
    setEditingConfig(null);
    setTaxBrackets([]);
  };

  return (
    <div className="tax-config-manager">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          {t('payroll:calculation_config.create_tax_config')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={configs}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('common:pagination.total', { total }),
        }}
      />

      <Modal
        title={editingConfig ? t('payroll:calculation_config.edit_tax_config') : t('payroll:calculation_config.create_tax_config')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            effective_date: dayjs(),
            tax_year: new Date().getFullYear(),
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('payroll:calculation_config.config_name')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tax_year"
                label={t('payroll:calculation_config.tax_year')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={2000}
                  max={2100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="effective_date"
                label={t('payroll:calculation_config.effective_date')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiry_date"
                label={t('payroll:calculation_config.expiry_date')}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="standard_deduction"
            label={t('payroll:calculation_config.standard_deduction')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              addonBefore="¥"
            />
          </Form.Item>

          {/* 专项附加扣除 */}
          <Divider>{t('payroll:calculation_config.additional_deductions')}</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="additional_deduction_child"
                label={t('payroll:calculation_config.child_deduction')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="additional_deduction_elderly"
                label={t('payroll:calculation_config.elderly_deduction')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 税率档次配置 */}
          <Divider>{t('payroll:calculation_config.tax_brackets')}</Divider>
          
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={8}>
              <Col span={6}>
                <Form.Item
                  name="bracket_min_amount"
                  label={t('payroll:calculation_config.min_amount')}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    addonBefore="¥"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="bracket_max_amount"
                  label={t('payroll:calculation_config.max_amount')}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    addonBefore="¥"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="bracket_tax_rate"
                  label={t('payroll:calculation_config.tax_rate')}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    style={{ width: '100%' }}
                    addonAfter="%"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="bracket_quick_deduction"
                  label={t('payroll:calculation_config.quick_deduction')}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    addonBefore="¥"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Button type="dashed" onClick={handleAddBracket} style={{ width: '100%' }}>
              <PlusOutlined /> {t('payroll:calculation_config.add_tax_bracket')}
            </Button>
          </Card>

          <Table
            columns={bracketColumns}
            dataSource={taxBrackets}
            rowKey={(record, index) => index?.toString() || '0'}
            pagination={false}
            size="small"
          />
        </Form>
      </Modal>
    </div>
  );
};

export default TaxConfigManager; 