import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, TreeSelect } from 'antd';
import { useTranslation } from 'react-i18next';
import type { EmployeeQuery, Department, LookupItem, PersonnelCategory as PersonnelCategoryType, Position as PositionType } from '../types';

const { RangePicker } = DatePicker;

interface EmployeeFilterFormProps {
  onSearch: (filters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>) => void;
  loading: boolean;
  departmentOptions?: Department[];
  genderOptions?: LookupItem[];
  statusOptions?: LookupItem[];
  educationLevelOptions?: LookupItem[];
  employmentTypeOptions?: LookupItem[];
  personnelCategoryOptions?: PersonnelCategoryType[];
  positionOptions?: PositionType[];
  maritalStatusOptions?: LookupItem[];
  politicalStatusOptions?: LookupItem[];
  contractTypeOptions?: LookupItem[];
  jobPositionLevelOptions?: LookupItem[];
  payFrequencyOptions?: LookupItem[];
}

const EmployeeFilterForm: React.FC<EmployeeFilterFormProps> = ({ 
  onSearch, 
  loading, 
  departmentOptions = [],
  genderOptions = [],
  statusOptions = [],
  educationLevelOptions = [],
  employmentTypeOptions = [],
  personnelCategoryOptions = [],
  positionOptions = [],
  maritalStatusOptions = [],
  politicalStatusOptions = [],
  contractTypeOptions = [],
  jobPositionLevelOptions = [],
  payFrequencyOptions = []
}) => {
  const { t } = useTranslation('employee');
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    const filters: {
      name?: string;
      employee_code?: string;
      department_id?: string;
      status_lookup_value_id?: number;
      gender_lookup_value_id?: number;
      education_level_lookup_value_id?: number;
      employment_type_lookup_value_id?: number;
      personnel_category_id?: number;
      hireDateStart?: string;
      hireDateEnd?: string;
      actual_position_id?: number;
      marital_status_lookup_value_id?: number;
      political_status_lookup_value_id?: number;
      contract_type_lookup_value_id?: number;
      job_position_level_lookup_value_id?: number;
      firstWorkDateStart?: string;
      firstWorkDateEnd?: string;
      id_number?: string;
    } = {
      name: values.name,
      employee_code: values.employee_code,
      department_id: values.department_id,
      status_lookup_value_id: values.status_lookup_value_id,
      gender_lookup_value_id: values.gender_lookup_value_id,
      education_level_lookup_value_id: values.education_level_lookup_value_id,
      employment_type_lookup_value_id: values.employment_type_lookup_value_id,
      personnel_category_id: values.personnel_category_id,
      hireDateStart: values.hireDateRange?.[0]?.format('YYYY-MM-DD'),
      hireDateEnd: values.hireDateRange?.[1]?.format('YYYY-MM-DD'),
      actual_position_id: values.actual_position_id,
      marital_status_lookup_value_id: values.marital_status_lookup_value_id,
      political_status_lookup_value_id: values.political_status_lookup_value_id,
      contract_type_lookup_value_id: values.contract_type_lookup_value_id,
      job_position_level_lookup_value_id: values.job_position_level_lookup_value_id,
      id_number: values.id_number,
      firstWorkDateStart: values.firstWorkDateRange?.[0]?.format('YYYY-MM-DD'),
      firstWorkDateEnd: values.firstWorkDateRange?.[1]?.format('YYYY-MM-DD'),
    };
    Object.keys(filters).forEach(key => (filters as any)[key] === undefined && delete (filters as any)[key]);
    onSearch(filters as Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>);
  };

  const transformToTreeData = (departments: Department[]): any[] => {
    return departments.map(dept => ({
      title: dept.name,
      value: dept.id,
      key: dept.id,
      children: dept.children ? transformToTreeData(dept.children) : [],
    }));
  };

  return (
    <Form form={form} onFinish={handleFinish} layout="vertical">
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="name" label={t('list_page.filter_form.label.name')}>
            <Input placeholder={t('list_page.filter_form.placeholder.name')} size="small" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="employee_code" label={t('list_page.filter_form.label.employee_code')}>
            <Input placeholder={t('list_page.filter_form.placeholder.employee_code')} size="small" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="id_number" label={t('list_page.filter_form.label.id_number')}>
            <Input placeholder={t('list_page.filter_form.placeholder.id_number')} size="small" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="status_lookup_value_id" label={t('list_page.filter_form.label.status')}>
            <Select placeholder={t('list_page.filter_form.placeholder.status')} allowClear loading={loading} size="small">
              {statusOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Form.Item name="department_id" label={t('list_page.filter_form.label.department')}>
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              size="small"
              styles={{ popup: { root: { maxHeight: 300, overflow: 'auto' } } }}
              placeholder={t('list_page.filter_form.placeholder.department')}
              allowClear
              treeDefaultExpandAll
              treeData={transformToTreeData(departmentOptions)}
              loading={loading}
              filterTreeNode={(inputValue, treeNode: any) => 
                treeNode.title.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Form.Item name="personnel_category_id" label={t('list_page.filter_form.label.personnel_category')}>
            <Select placeholder={t('list_page.filter_form.placeholder.personnel_category')} allowClear loading={loading} size="small">
              {personnelCategoryOptions.map(option => (
                <Select.Option key={option.id as React.Key} value={option.id}>
                  {option.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Form.Item name="actual_position_id" label={t('list_page.filter_form.label.actual_position')}>
            <Select placeholder={t('list_page.filter_form.placeholder.actual_position')} allowClear loading={loading} size="small">
              {positionOptions.map(option => (
                <Select.Option key={option.id as React.Key} value={option.id}>
                  {option.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Form.Item name="employment_type_lookup_value_id" label={t('list_page.filter_form.label.employment_type')}>
            <Select placeholder={t('list_page.filter_form.placeholder.employment_type')} allowClear loading={loading} size="small">
              {employmentTypeOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Form.Item name="hireDateRange" label={t('list_page.filter_form.label.hire_date_range')}>
            <RangePicker style={{ width: '100%' }} size="small" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Form.Item name="firstWorkDateRange" label={t('list_page.filter_form.label.first_work_date_range')}>
            <RangePicker style={{ width: '100%' }} size="small" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Form.Item name="gender_lookup_value_id" label={t('list_page.filter_form.label.gender')}>
            <Select placeholder={t('list_page.filter_form.placeholder.gender')} allowClear loading={loading} size="small">
              {genderOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Form.Item name="marital_status_lookup_value_id" label={t('list_page.filter_form.label.marital_status')}>
            <Select placeholder={t('list_page.filter_form.placeholder.marital_status')} allowClear loading={loading} size="small">
              {maritalStatusOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Form.Item name="political_status_lookup_value_id" label={t('list_page.filter_form.label.political_status')}>
            <Select placeholder={t('list_page.filter_form.placeholder.political_status')} allowClear loading={loading} size="small">
              {politicalStatusOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Form.Item name="education_level_lookup_value_id" label={t('list_page.filter_form.label.education_level')}>
            <Select placeholder={t('list_page.filter_form.placeholder.education_level')} allowClear loading={loading} size="small">
              {educationLevelOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="contract_type_lookup_value_id" label={t('list_page.filter_form.label.contract_type')}>
            <Select placeholder={t('list_page.filter_form.placeholder.contract_type')} allowClear loading={loading} size="small">
              {contractTypeOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="job_position_level_lookup_value_id" label={t('list_page.filter_form.label.job_position_level')}>
            <Select placeholder={t('list_page.filter_form.placeholder.job_position_level')} allowClear loading={loading} size="small">
              {jobPositionLevelOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={16} lg={18} style={{ textAlign: 'right', alignSelf: 'flex-end', paddingBottom: '8px' }}>
          <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }} size="small">
            {t('list_page.filter_form.button.search')}
          </Button>
          <Button onClick={() => form.resetFields()} loading={loading} size="small">
            {t('list_page.filter_form.button.reset')}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default EmployeeFilterForm; 