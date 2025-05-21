import React from 'react';
import { Descriptions, Tag, Spin } from 'antd';
import type { Employee } from '../../types';
import { Gender, EmploymentStatus } from '../../types';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import EmployeeName from '../../../../components/common/EmployeeName';

interface BasicInfoTabProps {
  employee: Employee | null;
  loading: boolean;
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

  const getGenderText = (genderId?: number) => {
    if (genderId === undefined || genderId === null) return t('employee:detail_page.common_value.na', 'N/A');
    const genderKey = Object.keys(Gender).find(key => Gender[key as keyof typeof Gender] === String(genderId));
    return genderKey ? t(`employee:gender.${genderKey.toLowerCase()}`, genderKey) : String(genderId);
  };

  const getStatusText = (statusId?: number) => {
    if (statusId === undefined || statusId === null) return t('employee:detail_page.common_value.na', 'N/A');
    const statusKey = Object.keys(EmploymentStatus).find(key => EmploymentStatus[key as keyof typeof EmploymentStatus] === String(statusId));
    return statusKey ? t(`employee:list_page.table.status_text.${statusKey.toLowerCase()}`, statusKey) : String(statusId);
  };

  const naText = t('employee:detail_page.common_value.na', 'N/A');

  return (
    <Descriptions title={t('employee:detail_page.tabs.basic_info')} bordered column={2} layout="vertical">
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_full_name')}>
        <EmployeeName 
          employeeId={employee.id} 
          employeeName={`${employee.last_name || ''}${employee.first_name || ''}`}
          showId={false} 
          className="employee-detail-name"
        />
      </Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_id')}>{employee.employee_code || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:form_label.id_number')}>{employee.id_number || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_dob')}>{employee.date_of_birth ? (dayjs(employee.date_of_birth).isValid() ? dayjs(employee.date_of_birth).format('YYYY-MM-DD') : String(employee.date_of_birth)) : naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_gender')}>{getGenderText(employee.gender_lookup_value_id)}</Descriptions.Item>
      <Descriptions.Item label={t('employee:form_label.nationality')}>{employee.nationality || naText}</Descriptions.Item> 

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_education_level')}>{employee.education_level_lookup_value_id ? t(`employee:education_level.${String(employee.education_level_lookup_value_id).toLowerCase()}`, String(employee.education_level_lookup_value_id)) : naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_mobile_phone')}>{employee.phone_number || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_email')} span={1}>{employee.email || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_residential_address', '居住地址')} span={1}>{employee.home_address || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:form_label.bank_name')}>{employee.bank_name || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:form_label.bank_account_number')}>{employee.bank_account_number || naText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_status')}>
        {employee.status_lookup_value_id !== undefined ? <Tag color={employee.status_lookup_value_id === 1 ? 'green' : 'volcano'}>{getStatusText(employee.status_lookup_value_id)}</Tag> : naText}
      </Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_notes', '备注')} span={1}>{employee.notes || naText}</Descriptions.Item>
    </Descriptions>
  );
};

export default BasicInfoTab;