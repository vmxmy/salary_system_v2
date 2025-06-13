import React, { useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, DatePicker, InputNumber, Select, Row, Col, Divider, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { SocialInsuranceConfig, CreateSocialInsuranceConfigRequest, UpdateSocialInsuranceConfigRequest } from '../types/calculationConfig';
import { usePersonnelCategories } from '../hooks/usePersonnelCategories';

interface SocialInsuranceConfigManagerProps {
  configs: SocialInsuranceConfig[];
  onCreateConfig: (data: CreateSocialInsuranceConfigRequest) => Promise<void>;
  onUpdateConfig: (id: number, data: UpdateSocialInsuranceConfigRequest) => Promise<void>;
}

const SocialInsuranceConfigManager: React.FC<SocialInsuranceConfigManagerProps> = ({
  configs,
  onCreateConfig,
  onUpdateConfig
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SocialInsuranceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 🎯 添加人员类别钩子
  const { getPersonnelCategoryNamesString } = usePersonnelCategories();

  // 表格列定义
  const columns: ColumnsType<SocialInsuranceConfig> = [
    {
      title: t('payroll:calculation_config.config_name'),
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: t('payroll:calculation_config.region'),
      dataIndex: 'region',
      key: 'region',
      width: 80,
    },
    {
      title: '适用人员身份',
      dataIndex: 'applicable_personnel_categories',
      key: 'applicable_personnel_categories',
      width: 200,
      render: (categories: number[]) => {
        if (!categories || categories.length === 0) {
          return <Tag color="default">全部人员</Tag>;
        }
        const categoryNames = getPersonnelCategoryNamesString(categories);
        const shortNames = categoryNames.length > 30 ? `${categoryNames.substring(0, 30)}...` : categoryNames;
        return (
          <Tooltip title={categoryNames} placement="topLeft">
            <Tag color="blue" icon={<InfoCircleOutlined />}>
              {shortNames}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: t('payroll:calculation_config.effective_date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 100,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('payroll:calculation_config.pension_rate'),
      key: 'pension_rate',
      width: 110,
      render: (_, record) => `${(record.pension_employee_rate * 100).toFixed(1)}% / ${(record.pension_employer_rate * 100).toFixed(1)}%`,
    },
    {
      title: t('payroll:calculation_config.unemployment_rate'),
      key: 'unemployment_rate',
      width: 110,
      render: (_, record) => `${(record.unemployment_employee_rate * 100).toFixed(1)}% / ${(record.unemployment_employer_rate * 100).toFixed(1)}%`,
    },
    {
      title: t('payroll:calculation_config.injury_rate'),
      key: 'injury_rate',
      width: 90,
      render: (_, record) => `${(record.injury_employer_rate * 100).toFixed(1)}%`,
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
      title: t('common:actions'),
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

  // 处理创建
  const handleCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    // 设置默认费率值
    form.setFieldsValue({
      effective_date: dayjs(),
      base_calculation_method: 'GROSS_SALARY',
      pension_employee_rate: 8,
      pension_employer_rate: 16,
      occupational_pension_employee_rate: 4,
      occupational_pension_employer_rate: 8,
      unemployment_employee_rate: 0.4,
      unemployment_employer_rate: 0.6,
      injury_employer_rate: 0.2,
      medical_employee_rate: 2,
      medical_employer_rate: 8,
      serious_illness_employee_rate: 0,
      serious_illness_employer_rate: 0.75,
      maternity_employer_rate: 0.8,
      housing_fund_employee_rate: 12,
      housing_fund_employer_rate: 12,
    });
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (config: SocialInsuranceConfig) => {
    setEditingConfig(config);
    form.setFieldsValue({
      name: config.name,
      region: config.region,
      effective_date: dayjs(config.effective_date),
      expiry_date: config.expiry_date ? dayjs(config.expiry_date) : null,
      pension_employee_rate: config.pension_employee_rate * 100,
      pension_employer_rate: config.pension_employer_rate * 100,
      occupational_pension_employee_rate: (config.occupational_pension_employee_rate || 0) * 100,
      occupational_pension_employer_rate: (config.occupational_pension_employer_rate || 0) * 100,
      medical_employee_rate: config.medical_employee_rate * 100,
      medical_employer_rate: config.medical_employer_rate * 100,
      serious_illness_employee_rate: (config.serious_illness_employee_rate || 0) * 100,
      serious_illness_employer_rate: (config.serious_illness_employer_rate || 0) * 100,
      unemployment_employee_rate: config.unemployment_employee_rate * 100,
      unemployment_employer_rate: config.unemployment_employer_rate * 100,
      injury_employer_rate: config.injury_employer_rate * 100,
      maternity_employer_rate: config.maternity_employer_rate * 100,
      housing_fund_employee_rate: config.housing_fund_employee_rate * 100,
      housing_fund_employer_rate: config.housing_fund_employer_rate * 100,
      pension_base_min: config.pension_base_min,
      pension_base_max: config.pension_base_max,
      medical_base_min: config.medical_base_min,
      medical_base_max: config.medical_base_max,
      unemployment_base_min: config.unemployment_base_min,
      unemployment_base_max: config.unemployment_base_max,
      housing_fund_base_min: config.housing_fund_base_min,
      housing_fund_base_max: config.housing_fund_base_max,
      base_calculation_method: config.base_calculation_method,
    });
    setModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const data = {
        name: values.name,
        region: values.region,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : undefined,
        pension_employee_rate: values.pension_employee_rate / 100,
        pension_employer_rate: values.pension_employer_rate / 100,
        occupational_pension_employee_rate: (values.occupational_pension_employee_rate || 0) / 100,
        occupational_pension_employer_rate: (values.occupational_pension_employer_rate || 0) / 100,
        medical_employee_rate: values.medical_employee_rate / 100,
        medical_employer_rate: values.medical_employer_rate / 100,
        serious_illness_employee_rate: (values.serious_illness_employee_rate || 0) / 100,
        serious_illness_employer_rate: (values.serious_illness_employer_rate || 0) / 100,
        unemployment_employee_rate: values.unemployment_employee_rate / 100,
        unemployment_employer_rate: values.unemployment_employer_rate / 100,
        injury_employer_rate: values.injury_employer_rate / 100,
        maternity_employer_rate: values.maternity_employer_rate / 100,
        housing_fund_employee_rate: values.housing_fund_employee_rate / 100,
        housing_fund_employer_rate: values.housing_fund_employer_rate / 100,
        pension_base_min: values.pension_base_min,
        pension_base_max: values.pension_base_max,
        medical_base_min: values.medical_base_min,
        medical_base_max: values.medical_base_max,
        unemployment_base_min: values.unemployment_base_min,
        unemployment_base_max: values.unemployment_base_max,
        housing_fund_base_min: values.housing_fund_base_min,
        housing_fund_base_max: values.housing_fund_base_max,
        base_calculation_method: values.base_calculation_method,
      };

      if (editingConfig) {
        await onUpdateConfig(editingConfig.id, data);
      } else {
        await onCreateConfig(data);
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
    setEditingConfig(null);
  };

  return (
    <div className="social-insurance-config-manager">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          {t('payroll:calculation_config.create_social_insurance_config')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={configs}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('common:pagination.total', { total }),
        }}
      />

      <Modal
        title={editingConfig ? t('payroll:calculation_config.edit_social_insurance_config') : t('payroll:calculation_config.create_social_insurance_config')}
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
            base_calculation_method: 'GROSS_SALARY',
          }}
        >
          {/* 基本信息 */}
          <Divider orientation="left">{t('payroll:calculation_config.basic_info')}</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('payroll:calculation_config.config_name')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <Input placeholder="请输入配置名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="region"
                label={t('payroll:calculation_config.region')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <Input placeholder="请输入适用地区" />
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
            name="base_calculation_method"
            label={t('payroll:calculation_config.base_calculation_method')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <Select>
              <Select.Option value="BASIC_SALARY">{t('payroll:calculation_config.basic_salary')}</Select.Option>
              <Select.Option value="GROSS_SALARY">{t('payroll:calculation_config.gross_salary')}</Select.Option>
              <Select.Option value="TOTAL_SALARY">{t('payroll:calculation_config.total_salary')}</Select.Option>
              <Select.Option value="CUSTOM">{t('payroll:calculation_config.custom')}</Select.Option>
            </Select>
          </Form.Item>

          {/* 费率配置 */}
          <Divider orientation="left">{t('payroll:calculation_config.insurance_rates')}</Divider>
          
          {/* 养老保险 */}
          <h4 style={{ color: '#1890ff', marginBottom: 16 }}>{t('payroll:calculation_config.pension_insurance')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pension_employee_rate"
                label={t('payroll:calculation_config.pension_employee_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="8.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pension_employer_rate"
                label={t('payroll:calculation_config.pension_employer_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="16.00"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 职业年金 */}
          <h5 style={{ color: '#722ed1', marginBottom: 16, marginLeft: 16 }}>{t('payroll:calculation_config.occupational_pension')}</h5>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="occupational_pension_employee_rate"
                label={t('payroll:calculation_config.occupational_pension_employee_rate')}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="4.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="occupational_pension_employer_rate"
                label={t('payroll:calculation_config.occupational_pension_employer_rate')}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="8.00"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 失业保险 */}
          <h4 style={{ color: '#1890ff', marginBottom: 16 }}>{t('payroll:calculation_config.unemployment_insurance')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unemployment_employee_rate"
                label={t('payroll:calculation_config.unemployment_employee_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="0.40"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unemployment_employer_rate"
                label={t('payroll:calculation_config.unemployment_employer_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="0.60"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 工伤保险 */}
          <h4 style={{ color: '#1890ff', marginBottom: 16 }}>{t('payroll:calculation_config.injury_insurance')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="injury_employer_rate"
                label={t('payroll:calculation_config.injury_employer_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="0.20"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                {t('payroll:calculation_config.injury_insurance_note')}
              </div>
            </Col>
          </Row>

          {/* 医疗保险 */}
          <h4 style={{ color: '#1890ff', marginBottom: 16 }}>{t('payroll:calculation_config.medical_insurance')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="medical_employee_rate"
                label={t('payroll:calculation_config.medical_employee_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="2.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="medical_employer_rate"
                label={t('payroll:calculation_config.medical_employer_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="8.00"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 大病医疗保险 */}
          <h5 style={{ color: '#722ed1', marginBottom: 16, marginLeft: 16 }}>{t('payroll:calculation_config.serious_illness_insurance')}</h5>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serious_illness_employee_rate"
                label={t('payroll:calculation_config.serious_illness_employee_rate')}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="serious_illness_employer_rate"
                label={t('payroll:calculation_config.serious_illness_employer_rate')}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="0.75"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 生育保险 */}
          <h4 style={{ color: '#1890ff', marginBottom: 16 }}>{t('payroll:calculation_config.maternity_insurance')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maternity_employer_rate"
                label={t('payroll:calculation_config.maternity_employer_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="0.80"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                {t('payroll:calculation_config.maternity_insurance_note')}
              </div>
            </Col>
          </Row>

          {/* 住房公积金 */}
          <h4 style={{ color: '#1890ff', marginBottom: 16 }}>{t('payroll:calculation_config.housing_fund')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="housing_fund_employee_rate"
                label={t('payroll:calculation_config.housing_fund_employee_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="12.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="housing_fund_employer_rate"
                label={t('payroll:calculation_config.housing_fund_employer_rate')}
                rules={[{ required: true, message: t('common:validation.required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  placeholder="12.00"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 基数配置 */}
          <Divider orientation="left">{t('payroll:calculation_config.insurance_base_limits')}</Divider>
          
          {/* 养老保险基数 */}
          <h4 style={{ color: '#52c41a', marginBottom: 16 }}>{t('payroll:calculation_config.pension_base_limits')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pension_base_min"
                label={t('payroll:calculation_config.pension_base_min')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="最低缴费基数"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pension_base_max"
                label={t('payroll:calculation_config.pension_base_max')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="最高缴费基数"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 失业保险基数 */}
          <h4 style={{ color: '#52c41a', marginBottom: 16 }}>{t('payroll:calculation_config.unemployment_base_limits')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unemployment_base_min"
                label={t('payroll:calculation_config.unemployment_base_min')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="最低缴费基数"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unemployment_base_max"
                label={t('payroll:calculation_config.unemployment_base_max')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="最高缴费基数"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 医疗保险基数 */}
          <h4 style={{ color: '#52c41a', marginBottom: 16 }}>{t('payroll:calculation_config.medical_base_limits')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="medical_base_min"
                label={t('payroll:calculation_config.medical_base_min')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="最低缴费基数"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="medical_base_max"
                label={t('payroll:calculation_config.medical_base_max')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="最高缴费基数"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 住房公积金基数 */}
          <h4 style={{ color: '#52c41a', marginBottom: 16 }}>{t('payroll:calculation_config.housing_fund_base_limits')}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="housing_fund_base_min"
                label={t('payroll:calculation_config.housing_fund_base_min')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="最低缴费基数"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="housing_fund_base_max"
                label={t('payroll:calculation_config.housing_fund_base_max')}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="最高缴费基数"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SocialInsuranceConfigManager; 