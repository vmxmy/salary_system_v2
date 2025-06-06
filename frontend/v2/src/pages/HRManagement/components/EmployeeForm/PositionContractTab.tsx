import React from 'react';
import { Form, Select, DatePicker, Card, Row, Col, TreeSelect, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import type { LookupItem } from '../../types';

const { Option } = Select;

interface PositionContractTabProps {
  departmentOptions: any[];
  personnelCategoryOptions: any[];
  positionOptions: any[];
  employmentTypeOptions: LookupItem[];
  statusOptions: LookupItem[];
  contractTypeOptions: LookupItem[];
  jobPositionLevelOptions?: LookupItem[];
  getRequiredMessage: (fieldNameKey: string) => string;
  loadingLookups: boolean;
}

const PositionContractTab: React.FC<PositionContractTabProps> = ({
  departmentOptions,
  personnelCategoryOptions,
  positionOptions,
  employmentTypeOptions,
  statusOptions,
  contractTypeOptions,
  jobPositionLevelOptions = [],
  getRequiredMessage,
  loadingLookups,
}) => {
  const { t } = useTranslation(['employee', 'common']);
  
  return (
    <Card title={null} style={{ marginBottom: 24, border: 'none' }}>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="department_id" 
            label={t('employee:detail_page.basic_info_tab.label_department')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_department') }]}
          >
            <TreeSelect
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder={t('employee:list_page.filter_form.placeholder.department')}
              allowClear
              treeDefaultExpandAll
              treeData={departmentOptions}
              loading={loadingLookups}
              treeNodeFilterProp="title"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="personnel_category_id" 
            label={t('employee:detail_page.basic_info_tab.label_job_title')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_job_title') }]}
          >
            <TreeSelect 
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder={t('employee:list_page.filter_form.placeholder.job_title')} 
              treeData={personnelCategoryOptions}
              loading={loadingLookups} 
              allowClear 
              showSearch
              treeDefaultExpandAll
              treeNodeFilterProp="title"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="actual_position_id" 
            label={t('employee:detail_page.basic_info_tab.label_actual_position')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_actual_position') }]}
          >
            <Select 
              placeholder={t('employee:list_page.filter_form.placeholder.actual_position')} 
              options={positionOptions}
              loading={loadingLookups} 
              allowClear 
              showSearch 
              filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="job_position_level_lookup_value_id" 
            label="职务级别"
          >
            <Select placeholder="请选择职务级别" loading={loadingLookups} allowClear>
              {jobPositionLevelOptions.map(level => <Option key={level.value as React.Key} value={Number(level.value)}>{level.label}</Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="hire_date" 
            label={t('employee:detail_page.basic_info_tab.label_hire_date')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_hire_date') }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="first_work_date" 
            label="首次参加工作时间"
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="current_position_start_date" 
            label="现职务开始时间"
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="career_position_level_date" 
            label="职级确定时间"
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="interrupted_service_years" 
            label="工作间断年限"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              max={50} 
              step={0.1}
              precision={1}
              addonAfter="年"
              placeholder="请输入工作间断年限"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* 预留位置 */}
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item 
            name="status_lookup_value_id" 
            label={t('employee:detail_page.basic_info_tab.label_employee_status')} 
            rules={[{ required: true, message: getRequiredMessage('employee:detail_page.basic_info_tab.label_employee_status') }]}
          >
            <Select placeholder={t('employee:list_page.filter_form.placeholder.status')} loading={loadingLookups} allowClear>
              {statusOptions.map(stat => <Option key={stat.value as React.Key} value={Number(stat.value)}>{stat.label}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="employment_type_lookup_value_id" 
            label={t('employee:detail_page.basic_info_tab.label_employment_type')}
          >
            <Select placeholder={t('employee:list_page.filter_form.placeholder.employment_type')} loading={loadingLookups} allowClear>
              {employmentTypeOptions.map(empType => <Option key={empType.value as React.Key} value={Number(empType.value)}>{empType.label}</Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item 
        name="contract_type_lookup_value_id" 
        label={t('employee:form_label.contract_type')}
      >
        <Select placeholder={t('employee:form_placeholder.contract_type')} loading={loadingLookups} allowClear>
          {contractTypeOptions.map(ct => <Option key={ct.value as React.Key} value={Number(ct.value)}>{ct.label}</Option>)}
        </Select>
      </Form.Item>
    </Card>
  );
};

export default PositionContractTab; 