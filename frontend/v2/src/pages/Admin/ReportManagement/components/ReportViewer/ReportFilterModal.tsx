import React from 'react';
import { Modal, Row, Col, Form } from 'antd';
import {
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormDateRangePicker
} from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { ReportFilterModalProps } from './types';

const ReportFilterModal: React.FC<ReportFilterModalProps> = ({
  visible,
  filters,
  onCancel,
  onConfirm,
  isMobile = false
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then(values => {
      onConfirm(values);
    });
  };

  return (
    <Modal
      title={t('setFilterConditions', '设置筛选条件')}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={isMobile ? '90%' : 600}
    >
      <ProForm
        form={form}
        layout="vertical"
        initialValues={filters}
        submitter={false}
      >
        <ProFormDateRangePicker
          name="dateRange"
          label={t('dateRange', '日期范围')}
          width="xl"
        />
        
        <Row gutter={16}>
          <Col span={isMobile ? 24 : 12}>
            <ProFormSelect
              name="department"
              label={t('department', '部门')}
              placeholder={t('selectDepartment', '选择部门')}
              allowClear
              options={[
                { label: t('techDept', '技术部'), value: 'tech' },
                { label: t('marketDept', '市场部'), value: 'market' },
                { label: t('financeDept', '财务部'), value: 'finance' },
                { label: t('hrDept', '人事部'), value: 'hr' },
              ]}
            />
          </Col>
          <Col span={isMobile ? 24 : 12}>
            <ProFormText
              name="employee"
              label={t('employee', '员工')}
              placeholder={t('enterEmployeeNameOrCode', '输入员工姓名或编号')}
            />
          </Col>
        </Row>
      </ProForm>
    </Modal>
  );
};

export default ReportFilterModal; 