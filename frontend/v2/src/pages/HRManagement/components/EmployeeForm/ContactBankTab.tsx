import React from 'react';
import { Form, Input, Card, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';

interface ContactBankTabProps {
  getRequiredMessage: (fieldNameKey: string) => string;
}

const ContactBankTab: React.FC<ContactBankTabProps> = ({
  getRequiredMessage,
}) => {
  const { t } = useTranslation(['employee', 'common']);
  
  return (
    <Card title={null} style={{ marginBottom: 24, border: 'none' }}>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="phone_number" 
            label={t('employee:detail_page.basic_info_tab.label_mobile_phone')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_mobile_phone') }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="email" 
            label={t('employee:detail_page.basic_info_tab.label_email')} 
            rules={[{ type: 'email', message: t('common:form.validation.email_invalid') }]}
          >
            <Input type="email" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item 
        name="home_address" 
        label={t('employee:form_label.home_address')}
      >
        <Input.TextArea rows={2} />
      </Form.Item>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="bank_name" 
            label={t('employee:form_label.bank_name')} 
            rules={[{ required: true, message: getRequiredMessage('employee:form_label.bank_name') }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="bank_account_number" 
            label={t('employee:form_label.bank_account_number')} 
            rules={[{ required: true, message: getRequiredMessage('employee:form_label.bank_account_number') }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="emergency_contact_name" 
            label={t('employee:form_label.emergency_contact_name')}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="emergency_contact_phone" 
            label={t('employee:form_label.emergency_contact_phone')}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default ContactBankTab; 