import React from 'react';
import { Descriptions, Tag, Spin } from 'antd';
import type { Employee } from '../../types';
import { Gender, EmploymentStatus } from '../../types';
import { useTranslation } from 'react-i18next';

interface BasicInfoTabProps {
  // Temporarily adding resolved fields. These should ideally be populated by the parent or through a selector.
  employee: (Employee & { gender_resolved?: Gender; status_resolved?: EmploymentStatus }) | null | undefined;
  loading?: boolean;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ employee, loading }) => {
  const { t } = useTranslation(['employee', 'common']);

  if (loading) {
    return (
      <Spin tip={t('employee:detail_page.common_value.loading_basic_info', '加载基本信息中...')}>
        <div style={{ height: 200, padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }} />
      </Spin>
    );
  }

  if (!employee) {
    return <p>{t('employee:detail_page.alert.description_employee_not_selected_or_found', 'No employee data available.')}</p>;
  }

  const getGenderText = (gender?: Gender) => {
    if (gender === undefined || gender === null) return t('employee:detail_page.common_value.na', 'N/A');
    switch (gender) {
      case Gender.MALE: return t('employee:gender.male', '男');
      case Gender.FEMALE: return t('employee:gender.female', '女');
      case Gender.OTHER: return t('employee:gender.other', '其他');
      default: return t('employee:detail_page.common_value.na', 'N/A');
    }
  };

  const getStatusText = (status?: EmploymentStatus) => {
    if (!status) return t('employee:detail_page.common_value.na', 'N/A');
    const statusKey = String(status).toLowerCase(); 
    return t(`employee:list_page.table.status_text.${statusKey}`, status.toString()); // Default to status string if key not found
  };

  const naText = t('employee:detail_page.common_value.na', 'N/A');
  const fullName = employee.first_name && employee.last_name ? `${employee.first_name} ${employee.last_name}` : (employee.first_name || employee.last_name || naText);

  return (
    <Descriptions title={t('employee:detail_page.tabs.basic_info')} bordered column={2} layout="vertical">
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_full_name')}>{fullName}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_id')}>{employee.employee_code || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:form_label.id_number')}>{employee.id_number || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_dob')}>{employee.dob?.toString() || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_gender')}>{getGenderText(employee.gender_resolved)}</Descriptions.Item>
      <Descriptions.Item label={t('employee:form_label.nationality')}>{employee.nationality || naText}</Descriptions.Item> 

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_education_level')}>{employee.education_level_lookup_value_id ? t(`employee:education_level.${String(employee.education_level_lookup_value_id).toLowerCase()}`, String(employee.education_level_lookup_value_id)) : naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_mobile_phone')}>{employee.mobilePhone || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_email')} span={2}>{employee.workEmail || employee.personalEmail || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_residential_address', '居住地址')} span={2}>{employee.addressDetail || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:form_label.bank_name')}>{employee.bankName || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:form_label.bank_account_number')}>{employee.bankAccountNumber || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_status')}>
        {employee.status_resolved ? <Tag color={employee.status_resolved === EmploymentStatus.ACTIVE ? 'green' : 'volcano'}>{getStatusText(employee.status_resolved)}</Tag> : naText}
      </Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_notes', '备注')} span={2}>{employee.notes || naText}</Descriptions.Item>
    </Descriptions>
  );
};

export default BasicInfoTab;