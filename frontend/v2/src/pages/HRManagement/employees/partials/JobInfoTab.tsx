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

const JobInfoTab: React.FC<JobInfoTabProps> = ({ employee, loading, lookupMaps }) => {
  // + Add lookupMaps to destructuring
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
      return `${years}${t('employee:detail_page.job_info_tab.seniority_year')}${months}${t('employee:detail_page.job_info_tab.seniority_month')}`;
    } else {
      return `${months}${t('employee:detail_page.job_info_tab.seniority_month')}`;
    }
  };

  // 获取部门名称
  const departmentText = employee.department_id !== undefined && employee.department_id !== null
    ? (lookupMaps?.departmentMap?.get(String(employee.department_id)) || employee.departmentName || String(employee.department_id))
    : naText;

  // 获取人员身份/类别名称
  const personnelCategoryText = employee.personnel_category_id !== undefined && employee.personnel_category_id !== null
    ? (lookupMaps?.personnelCategoryMap?.get(String(employee.personnel_category_id)) || employee.personnelCategoryName || String(employee.personnel_category_id))
    : naText;

  // 获取实际职位
  const actualPositionText = employee.actual_position_id || naText;

  // 获取雇佣类型
  const employmentTypeText = employee.employment_type_lookup_value_id !== undefined && employee.employment_type_lookup_value_id !== null
    ? (lookupMaps?.employmentTypeMap?.get(Number(employee.employment_type_lookup_value_id)) || String(employee.employment_type_lookup_value_id))
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
      title={t('employee:detail_page.job_info_tab.title')} 
      bordered 
      column={{ xs: 1, sm: 2 }} 
      layout="vertical"
      size="middle"
    >
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_department')}
      >
        {departmentText}
      </Descriptions.Item>
      
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_personnel_category')}
      >
        {personnelCategoryText}
      </Descriptions.Item>

      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_actual_position')}
      >
        {actualPositionText}
      </Descriptions.Item>
      
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_work_location')}
      >
        {employee.workLocation || naText}
      </Descriptions.Item>

      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_hire_date')}
      >
        {employee.hire_date ? dayjs(employee.hire_date).format('YYYY-MM-DD'): naText}
      </Descriptions.Item>
      
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_employment_type')}
      >
        {employmentTypeText}
      </Descriptions.Item>

      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_seniority')}
      >
        {calculateSeniority(employee.hire_date)}
      </Descriptions.Item>
      
      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_probation_end_date')}
      >
        {employee.probationEndDate ? dayjs(employee.probationEndDate).format('YYYY-MM-DD'): naText}
      </Descriptions.Item>

      <Descriptions.Item 
        label={t('employee:detail_page.job_info_tab.label_reports_to')}
        span={2}
      >
        {reportsToText}
      </Descriptions.Item>
    </Descriptions>
  );
};

export default JobInfoTab;