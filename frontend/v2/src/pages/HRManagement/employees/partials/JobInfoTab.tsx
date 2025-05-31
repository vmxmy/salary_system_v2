import React from 'react';
import { Descriptions, Spin, Typography } from 'antd';
import type { Employee } from '../../types'; // Adjusted path
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { LookupMaps } from '../../../../hooks/useLookupMaps'; // + Import LookupMaps

const { Text } = Typography;

interface JobInfoTabProps {
  employee: Employee | null | undefined;
  loading?: boolean;
  lookupMaps: LookupMaps | null; // + Add lookupMaps
}

const JobInfoTab: React.FC<JobInfoTabProps> = ({ employee, loading, lookupMaps }) => { // + Add lookupMaps to destructuring
  const { t } = useTranslation(['employee', 'common']);

  if (loading) {
    return (
      <Spin>
        <div style={{ height: 200, padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('employee:detail_page.job_info_tab.loading', 'Loading job information...')}</div>
      </Spin>
    );
  }

  if (!employee) {
    return <p>{t('employee:detail_page.job_info_tab.no_data', 'No employee job data available.')}</p>;
  }

  const naText = '-';

  const calculateSeniority = (hire_date?: string | dayjs.Dayjs): string => { // Renamed hireDate to hire_date
    if (!hire_date) return naText;
    const start = dayjs(hire_date);
    const now = dayjs();
    const years = now.diff(start, 'year');
    const months = now.diff(start.add(years, 'year'), 'month'); // Corrected calculation for months
    
    if (years > 0) {
      return `${years}${t('employee:detail_page.job_info_tab.seniority_year', {t('hr:auto____20e5b9')})}${months}${t('employee:detail_page.job_info_tab.seniority_month', {t('hr:auto___20e4b8')})}`;
    } else {
      return `${months}${t('employee:detail_page.job_info_tab.seniority_month', {t('hr:auto___20e4b8')})}`;
    }
  };

  // 获取部门名称
  const departmentText = employee.department_id !== undefined && employee.department_id !== null
    ? lookupMaps?.departmentMap?.get(String(employee.department_id)) || employee.departmentName || String(employee.department_id)
    : naText;

  // 获取人员身份/类别名称
  const personnelCategoryText = employee.personnel_category_id !== undefined && employee.personnel_category_id !== null
    ? lookupMaps?.personnelCategoryMap?.get(String(employee.personnel_category_id)) || employee.personnelCategoryName || String(employee.personnel_category_id)
    : naText;

  // 获取实际职位
  const actualPositionText = employee.actual_position_id || naText;

  // 获取雇佣类型
  const employmentTypeText = employee.employment_type_lookup_value_id !== undefined && employee.employment_type_lookup_value_id !== null
    ? lookupMaps?.employmentTypeMap?.get(Number(employee.employment_type_lookup_value_id)) || String(employee.employment_type_lookup_value_id)
    : naText;
  
  // 获取直接上级信息
  const reportsToText = employee.reports_to_employee_id
    ? (
      <span>
        {employee.reports_to_employee_id}
        <Text type="secondary" style={{ marginLeft: 8 }}>
          {t('employee:detail_page.job_info_tab.reports_to_id_prefix', { id: employee.reports_to_employee_id })}
        </Text>
      </span>
    )
    : naText;

  return (
    <Descriptions 
      title={t('employee:detail_page.job_info_tab.title', {t('hr:auto_text_e8818c')})} 
      bordered 
      column={{ xs: 1, sm: 2 }} 
      layout="vertical"
      size="middle"
    >
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_department', {t('hr:auto_text_e983a8')})}
      >
        {departmentText}
      </Descriptions.Item>
      
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_personnel_category', {t('hr:auto_text_e4baba')})}
      >
        {personnelCategoryText}
      </Descriptions.Item>

      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_actual_position', {t('hr:auto_text_e5ae9e')})}
      >
        {actualPositionText}
      </Descriptions.Item>
      
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_work_location', {t('hr:auto_text_e5b7a5')})}
      >
        {employee.workLocation || naText}
      </Descriptions.Item>

      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_hire_date', {t('hr:auto_text_e585a5')})}
      >
        {employee.hire_date ? dayjs(employee.hire_date).format('YYYY-MM-DD') : naText}
      </Descriptions.Item>
      
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_employment_type', {t('hr:auto_text_e99b87')})}
      >
        {employmentTypeText}
      </Descriptions.Item>

      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_seniority', {t('hr:auto_text_e58fb8')})}
      >
        {calculateSeniority(employee.hire_date)}
      </Descriptions.Item>
      
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_probation_end_date', {t('hr:auto_text_e8af95')})}
      >
        {employee.probationEndDate ? dayjs(employee.probationEndDate).format('YYYY-MM-DD') : naText}
      </Descriptions.Item>

      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_reports_to', {t('hr:auto_text_e6b187')})}
        span={2}
      >
        {reportsToText}
      </Descriptions.Item>
    </Descriptions>
  );
};

export default JobInfoTab;