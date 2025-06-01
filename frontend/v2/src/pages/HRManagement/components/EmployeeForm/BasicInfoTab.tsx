import React from 'react';
import { Form, Input, Select, DatePicker, Card, Row, Col, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { UploadChangeParam } from 'antd/es/upload';
import { useTranslation } from 'react-i18next';
import type { LookupItem } from '../../types';

const { Option } = Select;

interface BasicInfoTabProps {
  genderOptions: LookupItem[];
  maritalStatusOptions: LookupItem[];
  educationLevelOptions: LookupItem[];
  politicalStatusOptions: LookupItem[];
  avatarFileList: UploadFile[];
  handleAvatarChange: (info: UploadChangeParam<UploadFile>) => void;
  getRequiredMessage: (fieldNameKey: string) => string;
  loadingLookups: boolean;
  isEditMode: boolean;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  genderOptions,
  maritalStatusOptions,
  educationLevelOptions,
  politicalStatusOptions,
  avatarFileList,
  handleAvatarChange,
  getRequiredMessage,
  loadingLookups,
  isEditMode,
}) => {
  const { t } = useTranslation(['employee', 'common']);
  
  return (
    <Card title={null} style={{ marginBottom: 24, border: 'none' }}>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="last_name" 
            label={t('employee:detail_page.basic_info_tab.label_last_name')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_last_name') }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="first_name" 
            label={t('employee:detail_page.basic_info_tab.label_first_name')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_first_name') }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="employee_code" 
            label={t('employee:detail_page.basic_info_tab.label_employee_id')} 
            rules={[{ required: false, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_id') }]}
          >
            <Input disabled={isEditMode} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="gender_lookup_value_id" 
            label={t('employee:detail_page.basic_info_tab.label_gender')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_gender') }]}
          >
            <Select placeholder={t('employee:list_page.filter_form.placeholder.gender')} loading={loadingLookups} allowClear>
              {genderOptions.map(g => <Option key={g.value as React.Key} value={Number(g.value)}>{g.label}</Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="date_of_birth" 
            label={t('employee:detail_page.basic_info_tab.label_dob')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_dob') }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="id_number" 
            label={t('employee:form_label.id_number')} 
            rules={[{ required: true, message: getRequiredMessage('employee:form_label.id_number') }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="marital_status_lookup_value_id" 
            label={t('employee:detail_page.basic_info_tab.label_marital_status')}
          >
            <Select placeholder={t('employee:form_placeholder.marital_status')} loading={loadingLookups} allowClear>
              {maritalStatusOptions.map(ms => <Option key={ms.value as React.Key} value={Number(ms.value)}>{ms.label}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="education_level_lookup_value_id" 
            label={t('employee:detail_page.basic_info_tab.label_education_level')}
          >
            <Select placeholder={t('employee:list_page.filter_form.placeholder.education_level')} loading={loadingLookups} allowClear>
              {educationLevelOptions.map(el => <Option key={el.value as React.Key} value={Number(el.value)}>{el.label}</Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="political_status_lookup_value_id" 
            label={t('employee:detail_page.basic_info_tab.label_political_status')}
          >
            <Select placeholder={t('employee:form_placeholder.political_status')} loading={loadingLookups} allowClear>
              {politicalStatusOptions.map(ps => <Option key={ps.value as React.Key} value={Number(ps.value)}>{ps.label}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="ethnicity" 
            label={t('employee:form_label.ethnicity')}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item 
        name="nationality" 
        label={t('employee:form_label.nationality')}
      >
        <Input />
      </Form.Item>

      <Form.Item 
        name="avatar" 
        label={t('employee:form_label.avatar')}
      >
        <Upload 
          action="/api/v2/files/upload" 
          listType="picture-card"
          fileList={avatarFileList}
          onChange={handleAvatarChange}
          name="file" 
          maxCount={1}
        >
          {avatarFileList.length < 1 && (
            <div>
              <UploadOutlined />
              <div style={{marginTop: 8}}>t('employee:form_upload.avatar_text')</div>
            </div>
          )}
        </Upload>
      </Form.Item>
    </Card>
  );
};

export default BasicInfoTab; 