import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, TreeSelect } from 'antd';
import { useTranslation } from 'react-i18next';
import type { EmployeeQuery, Department, LookupItem, JobTitle as JobTitleType } from '../types';

const { RangePicker } = DatePicker;

interface EmployeeFilterFormProps {
  onSearch: (filters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>) => void;
  loading: boolean;
  departmentOptions?: Department[];
  genderOptions?: LookupItem[];
  statusOptions?: LookupItem[];
  educationLevelOptions?: LookupItem[];
  employmentTypeOptions?: LookupItem[];
  jobTitleOptions?: JobTitleType[];
}

const EmployeeFilterForm: React.FC<EmployeeFilterFormProps> = ({ 
  onSearch, 
  loading, 
  departmentOptions = [],
  genderOptions = [],
  statusOptions = [],
  educationLevelOptions = [],
  employmentTypeOptions = [],
  jobTitleOptions = []
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    const filters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'> & { 
      hireDateStart?: string; 
      hireDateEnd?: string; 
      gender_lookup_value_id?: number; 
      education_level_lookup_value_id?: number; 
      employment_type_lookup_value_id?: number; 
      job_title_id?: number;
    } = {
      name: values.name,
      employee_code: values.employee_code,
      department_id: values.department_id,
      status_lookup_value_id: values.status_lookup_value_id,
      gender_lookup_value_id: values.gender_lookup_value_id,
      education_level_lookup_value_id: values.education_level_lookup_value_id,
      employment_type_lookup_value_id: values.employment_type_lookup_value_id,
      job_title_id: values.job_title_id,
      hireDateStart: values.hireDateRange?.[0]?.format('YYYY-MM-DD'),
      hireDateEnd: values.hireDateRange?.[1]?.format('YYYY-MM-DD'),
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
    <Form form={form} onFinish={handleFinish} layout="vertical" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="name" label={t('employee_filter_form.label_name')}>
            <Input placeholder={t('employee_filter_form.placeholder_name')} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="employee_code" label={t('employee_filter_form.label_employee_code')}>
            <Input placeholder={t('employee_filter_form.placeholder_employee_code')} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="department_id" label={t('employee_filter_form.label_department')}>
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder={t('employee_filter_form.placeholder_department')}
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
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="status_lookup_value_id" label={t('employee_filter_form.label_status')}>
            <Select placeholder={t('employee_filter_form.placeholder_status')} allowClear loading={loading}>
              {statusOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="hireDateRange" label={t('employee_filter_form.label_hire_date_range')}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="gender_lookup_value_id" label={t('employee_filter_form.label_gender')}>
            <Select placeholder={t('employee_filter_form.placeholder_gender')} allowClear loading={loading}>
              {genderOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="education_level_lookup_value_id" label={t('employee_filter_form.label_education_level')}>
            <Select placeholder={t('employee_filter_form.placeholder_education_level')} allowClear loading={loading}>
              {educationLevelOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="employment_type_lookup_value_id" label={t('employee_filter_form.label_employment_type')}>
            <Select placeholder={t('employee_filter_form.placeholder_employment_type')} allowClear loading={loading}>
              {employmentTypeOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="job_title_id" label={t('employee_filter_form.label_job_title')}>
            <Select placeholder={t('employee_filter_form.placeholder_job_title')} allowClear loading={loading}>
              {jobTitleOptions.map(option => (
                <Select.Option key={option.id as React.Key} value={option.id}>
                  {option.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
            {t('employee_filter_form.button_search')}
          </Button>
          <Button onClick={() => form.resetFields()} loading={loading}>
            {t('employee_filter_form.button_reset')}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default EmployeeFilterForm; 