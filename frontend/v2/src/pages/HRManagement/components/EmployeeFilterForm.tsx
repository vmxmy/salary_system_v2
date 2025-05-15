import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, TreeSelect } from 'antd';
import type { EmployeeQuery, Department, LookupItem } from '../types';

const { RangePicker } = DatePicker;

interface EmployeeFilterFormProps {
  onSearch: (filters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>) => void;
  loading: boolean;
  departmentOptions?: Department[];
  genderOptions?: LookupItem[];
  statusOptions?: LookupItem[];
  educationLevelOptions?: LookupItem[];
  employmentTypeOptions?: LookupItem[];
}

const EmployeeFilterForm: React.FC<EmployeeFilterFormProps> = ({ 
  onSearch, 
  loading, 
  departmentOptions = [],
  genderOptions = [],
  statusOptions = [],
  educationLevelOptions = [],
  employmentTypeOptions = [] 
}) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    const filters: Omit<EmployeeQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'> & { hireDateStart?: string; hireDateEnd?: string; gender_lookup_value_id?: number; education_level_lookup_value_id?: number; employment_type_lookup_value_id?: number; } = {
      name: values.name,
      employee_code: values.employee_code,
      department_id: values.department_id,
      status_lookup_value_id: values.status_lookup_value_id,
      gender_lookup_value_id: values.gender_lookup_value_id,
      education_level_lookup_value_id: values.education_level_lookup_value_id,
      employment_type_lookup_value_id: values.employment_type_lookup_value_id,
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
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入员工姓名" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="employee_code" label="工号">
            <Input placeholder="请输入员工工号" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="department_id" label="部门">
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder="请选择部门"
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
          <Form.Item name="status_lookup_value_id" label="状态">
            <Select placeholder="请选择状态" allowClear loading={loading}>
              {statusOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="hireDateRange" label="入职日期范围">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="gender_lookup_value_id" label="性别">
            <Select placeholder="请选择性别" allowClear loading={loading}>
              {genderOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="education_level_lookup_value_id" label="学历">
            <Select placeholder="请选择学历" allowClear loading={loading}>
              {educationLevelOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="employment_type_lookup_value_id" label="雇佣类型">
            <Select placeholder="请选择雇佣类型" allowClear loading={loading}>
              {employmentTypeOptions.map(option => (
                <Select.Option key={option.value as React.Key} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
            查询
          </Button>
          <Button onClick={() => form.resetFields()} loading={loading}>
            重置
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default EmployeeFilterForm; 