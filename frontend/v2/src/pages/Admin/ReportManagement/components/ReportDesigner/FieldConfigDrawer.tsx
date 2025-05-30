import React, { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Switch, Select, Row, Col, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ReportField } from './types';

const { Option } = Select;

interface FieldConfigDrawerProps {
  visible: boolean;
  field: ReportField;
  onClose: () => void;
  onSave: (field: ReportField) => void;
}

const FieldConfigDrawer: React.FC<FieldConfigDrawerProps> = ({
  visible,
  field,
  onClose,
  onSave
}) => {
  const { t } = useTranslation('reportManagement');
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && field) {
      form.setFieldsValue({
        ...field,
        format_type: field.formatting_config?.format_type || 'text',
        decimal_places: field.formatting_config?.decimal_places || 0,
        prefix: field.formatting_config?.prefix || '',
        suffix: field.formatting_config?.suffix || '',
        thousand_separator: field.formatting_config?.thousand_separator || false,
        date_format: field.formatting_config?.date_format || 'YYYY-MM-DD',
      });
    }
  }, [visible, field, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const updatedField: ReportField = {
        ...field,
        field_alias: values.field_alias,
        width: values.width,
        is_visible: values.is_visible,
        is_sortable: values.is_sortable,
        is_filterable: values.is_filterable,
        aggregation: values.aggregation,
        formatting_config: {
          format_type: values.format_type,
          decimal_places: values.decimal_places,
          prefix: values.prefix,
          suffix: values.suffix,
          thousand_separator: values.thousand_separator,
          date_format: values.date_format,
        }
      };
      
      onSave(updatedField);
    });
  };

  return (
    <Drawer
      title={t('fieldConfig')}
      placement="right"
      width={480}
      open={visible}
      onClose={onClose}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <Button type="primary" onClick={handleSave}>
            {t('save')}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          label={t('fieldAlias')}
          name="field_alias"
          rules={[{ required: true, message: t('fieldAliasRequired') }]}
        >
          <Input placeholder={t('fieldAliasPlaceholder')} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('columnWidth')}
              name="width"
            >
              <InputNumber
                min={50}
                max={500}
                style={{ width: '100%' }}
                placeholder={t('widthPlaceholder')}
                addonAfter="px"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('aggregation')}
              name="aggregation"
            >
              <Select placeholder={t('selectAggregation')} allowClear>
                <Option value="sum">{t('sum')}</Option>
                <Option value="avg">{t('average')}</Option>
                <Option value="count">{t('count')}</Option>
                <Option value="min">{t('min')}</Option>
                <Option value="max">{t('max')}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('visible')}
              name="is_visible"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('sortable')}
              name="is_sortable"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('filterable')}
              name="is_filterable"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('formatType')}
          name="format_type"
        >
          <Select>
            <Option value="text">{t('text')}</Option>
            <Option value="number">{t('number')}</Option>
            <Option value="currency">{t('currency')}</Option>
            <Option value="percentage">{t('percentage')}</Option>
            <Option value="date">{t('date')}</Option>
          </Select>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.format_type !== currentValues.format_type}>
          {({ getFieldValue }) => {
            const formatType = getFieldValue('format_type');
            
            return (
              <>
                {(formatType === 'number' || formatType === 'currency' || formatType === 'percentage') && (
                  <>
                    <Form.Item
                      label={t('decimalPlaces')}
                      name="decimal_places"
                    >
                      <InputNumber min={0} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    {formatType !== 'percentage' && (
                      <Form.Item
                        label={t('thousandSeparator')}
                        name="thousand_separator"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    )}
                  </>
                )}

                {formatType === 'currency' && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={t('prefix')}
                        name="prefix"
                      >
                        <Input placeholder="¥" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('suffix')}
                        name="suffix"
                      >
                        <Input placeholder={t('suffixPlaceholder')} />
                      </Form.Item>
                    </Col>
                  </Row>
                )}

                {formatType === 'date' && (
                  <Form.Item
                    label={t('dateFormat')}
                    name="date_format"
                  >
                    <Select>
                      <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                      <Option value="YYYY/MM/DD">YYYY/MM/DD</Option>
                      <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                      <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                      <Option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</Option>
                    </Select>
                  </Form.Item>
                )}
              </>
            );
          }}
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default FieldConfigDrawer; 