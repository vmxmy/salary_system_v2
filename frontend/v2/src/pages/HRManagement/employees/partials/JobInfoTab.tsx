import React from 'react';
import { Descriptions, Spin } from 'antd';
import type { Employee } from '../../types'; // Adjusted path
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { LookupMaps } from '../../../../hooks/useLookupMaps'; // + Import LookupMaps

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

  const naText = '';

  const calculateSeniority = (hire_date?: string | dayjs.Dayjs): string => { // Renamed hireDate to hire_date
    if (!hire_date) return naText;
    const start = dayjs(hire_date);
    const now = dayjs();
    const years = now.diff(start, 'year');
    const months = now.diff(start.add(years, 'year'), 'month'); // Corrected calculation for months
    return `${years}${t('employee:detail_page.job_info_tab.seniority_year', ' 年 ')}${months}${t('employee:detail_page.job_info_tab.seniority_month', ' 个月')}`;
  };

  const jobTitleText = employee.personnel_category_id !== undefined && employee.personnel_category_id !== null
    ? lookupMaps?.personnelCategoryMap?.get(String(employee.personnel_category_id)) || employee.personnel_category_name || String(employee.personnel_category_id)
    : naText;

  const departmentText = employee.department_id !== undefined && employee.department_id !== null
    ? lookupMaps?.departmentMap?.get(String(employee.department_id)) || employee.departmentName || String(employee.department_id)
    : naText;

  const employmentTypeText = employee.employment_type_lookup_value_id !== undefined && employee.employment_type_lookup_value_id !== null
    ? lookupMaps?.employmentTypeMap?.get(Number(employee.employment_type_lookup_value_id)) || String(employee.employment_type_lookup_value_id)
    : naText;
  
  const reportsToText = employee.reports_to_employee_id
    ? t('employee:detail_page.job_info_tab.reports_to_id_prefix', { id: employee.reports_to_employee_id })
    : naText;

  // Removed getEmploymentTypeText as we are using lookupMaps

  return (
    <Descriptions title={t('employee:detail_page.tabs.job_info')} bordered column={2} layout="vertical">
      <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_department')}>{departmentText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_current_job_title')}>{jobTitleText}</Descriptions.Item>

      <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_direct_manager')}>{reportsToText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_work_location')}>{employee.workLocation || naText}</Descriptions.Item>
      
      {/* Removed officialWorkStartDate and personnelIdentity as they don't exist in Employee type or are not shown in EmployeeDetailPage's placeholder */}
      {/* Also removed hire_date and status as they are typically in BasicInfoTab */}

      <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_employment_type')}>{employmentTypeText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_seniority')}>{calculateSeniority(employee.hire_date)}</Descriptions.Item>
    </Descriptions>
  );
};

export default JobInfoTab;