import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { Descriptions, Tabs, Spin, Button, message, Alert, Breadcrumb, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ActionButton from '../../../components/common/ActionButton';
import { employeeService } from "../../../services/employeeService";
import type { Employee, JobHistoryItem, ContractItem, CompensationItem, LeaveBalanceItem, LookupItem } from "../types";
import { useLookupMaps, type LookupMaps, type RawLookups } from '../../../hooks/useLookupMaps';
// import { usePermissions } from '../../../../hooks/usePermissions'; // TODO: Integrate permissions

// Updated BasicInfoTabPlaceholder
const BasicInfoTabPlaceholder: React.FC<{ employee: Employee | null; lookupMaps: LookupMaps | null }> = ({ employee, lookupMaps }) => {
  const { t } = useTranslation();
  if (!employee) return <Descriptions title={t('employee_detail_page.basic_info_tab.title')} bordered column={2}><Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_status')}>{t('employee_detail_page.basic_info_tab.status_loading')}</Descriptions.Item></Descriptions>;

  return (
    <Descriptions title={t('employee_detail_page.basic_info_tab.title')} bordered column={2}>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_full_name')}>{`${employee.first_name || ''} ${employee.last_name || ''}`.trim()}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_employee_id')}>{employee.employee_code}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_gender')}>{lookupMaps?.genderMap.get(Number(employee.gender_lookup_value_id)) || String(employee.gender_lookup_value_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_dob')}>{employee.dob ? String(employee.dob) : t('employee_detail_page.common_value_dash')}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_department')}>{lookupMaps?.departmentMap.get(Number(employee.department_id)) || employee.departmentName || String(employee.department_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_job_title')}>{lookupMaps?.jobTitleMap.get(Number(employee.job_title_id)) || employee.job_title_name || String(employee.job_title_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_employment_type')}>{lookupMaps?.employmentTypeMap.get(Number(employee.employment_type_lookup_value_id)) || String(employee.employment_type_lookup_value_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_employee_status')}>{lookupMaps?.statusMap.get(Number(employee.status_lookup_value_id)) || String(employee.status_lookup_value_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_hire_date')}>{employee.hire_date ? String(employee.hire_date) : t('employee_detail_page.common_value_dash')}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_email')}>{employee.workEmail || employee.personalEmail || t('employee_detail_page.common_value_dash')}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_mobile_phone')}>{employee.mobilePhone || t('employee_detail_page.common_value_dash')}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_education_level')}>{lookupMaps?.educationLevelMap.get(Number(employee.education_level_lookup_value_id)) || String(employee.education_level_lookup_value_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_marital_status')}>{lookupMaps?.maritalStatusMap.get(Number(employee.marital_status_lookup_value_id)) || String(employee.marital_status_lookup_value_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
      <Descriptions.Item label={t('employee_detail_page.basic_info_tab.label_political_status')}>{lookupMaps?.politicalStatusMap.get(Number(employee.political_status_lookup_value_id)) || String(employee.political_status_lookup_value_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
      {/* Add more fields as needed */}
    </Descriptions>
  );
};

const JobInfoTabPlaceholder: React.FC<{ employee?: Employee, lookupMaps: LookupMaps | null }> = ({ employee, lookupMaps }) => {
    const { t } = useTranslation();
    if (!employee) return <Descriptions title={t('employee_detail_page.job_info_tab.title')} bordered column={2}><Descriptions.Item>{t('employee_detail_page.job_info_tab.loading')}</Descriptions.Item></Descriptions>; 
    return (
        <Descriptions title={t('employee_detail_page.job_info_tab.title')} bordered column={2}>
            <Descriptions.Item label={t('employee_detail_page.job_info_tab.label_current_job_title')}>{lookupMaps?.jobTitleMap.get(Number(employee.job_title_id)) || employee.job_title_name || String(employee.job_title_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
            <Descriptions.Item label={t('employee_detail_page.job_info_tab.label_department')}>{lookupMaps?.departmentMap.get(Number(employee.department_id)) || employee.departmentName || String(employee.department_id ?? t('employee_detail_page.common_value_dash'))}</Descriptions.Item>
            <Descriptions.Item label={t('employee_detail_page.job_info_tab.label_reports_to')}>{employee.reports_to_employee_id ? t('employee_detail_page.job_info_tab.reports_to_id_prefix', {id: employee.reports_to_employee_id}) : t('employee_detail_page.common_value_dash')} </Descriptions.Item>
            <Descriptions.Item label={t('employee_detail_page.job_info_tab.label_work_location')}>{employee.workLocation || t('employee_detail_page.common_value_dash')}</Descriptions.Item>
        </Descriptions>
    );
};

const JobHistoryTabPlaceholder: React.FC<{ data: JobHistoryItem[] | undefined; lookupMaps: LookupMaps | null }> = ({ data, lookupMaps }) => {
  const { t } = useTranslation();
  if (!data) return <p>{t('employee_detail_page.job_history_tab.loading_or_no_data')}</p>;
  if (data.length === 0) return <p>{t('employee_detail_page.job_history_tab.no_records')}</p>;
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {item.effectiveDate ? String(item.effectiveDate) : t('employee_detail_page.common_value_na')}: 
          {lookupMaps?.jobTitleMap.get(Number(item.job_title_id)) || item.job_title_name || String(item.job_title_id ?? t('employee_detail_page.common_value_na'))} {t('employee_detail_page.job_history_tab.at_conjunction')} 
          {lookupMaps?.departmentMap.get(Number(item.department_id)) || item.departmentName || String(item.department_id ?? t('employee_detail_page.common_value_na'))}
          {item.employment_type_lookup_value_id ? ` (${lookupMaps?.employmentTypeMap.get(Number(item.employment_type_lookup_value_id)) || String(item.employment_type_lookup_value_id)})` : ''}
        </li>
      ))}
    </ul>
  );
};

const ContractsTabPlaceholder: React.FC<{ data: ContractItem[] | undefined; lookupMaps: LookupMaps | null }> = ({ data, lookupMaps }) => {
  const { t } = useTranslation();
  if (!data) return <p>{t('employee_detail_page.contracts_tab.loading_or_no_data')}</p>;
  if (data.length === 0) return <p>{t('employee_detail_page.contracts_tab.no_records')}</p>;
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {item.contract_number} ({lookupMaps?.contractTypeMap.get(Number(item.contract_type_lookup_value_id)) || String(item.contract_type_lookup_value_id ?? t('employee_detail_page.common_value_na'))}) - 
          {item.start_date ? String(item.start_date) : t('employee_detail_page.common_value_na')} {t('employee_detail_page.contracts_tab.to_conjunction')} {item.end_date ? String(item.end_date) : t('employee_detail_page.common_value_na')}
        </li>
      ))}
    </ul>
  );
};

const CompensationTabPlaceholder: React.FC<{ data: CompensationItem[] | undefined; lookupMaps: LookupMaps | null }> = ({ data, lookupMaps }) => {
  const { t } = useTranslation();
  if (!data) return <p>{t('employee_detail_page.compensation_tab.loading_or_no_data')}</p>;
  if (data.length === 0) return <p>{t('employee_detail_page.compensation_tab.no_records')}</p>;
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {item.effective_date ? String(item.effective_date) : t('employee_detail_page.common_value_na')}: {t('employee_detail_page.compensation_tab.basic_prefix')} {item.basic_salary}, {t('employee_detail_page.compensation_tab.total_prefix')} {item.total_salary || t('employee_detail_page.common_value_na')}
          {item.pay_frequency_lookup_value_id ? ` (${t('employee_detail_page.compensation_tab.freq_prefix')} ${item.pay_frequency_lookup_value_id})` : ''} {/* Assuming lookup for freq ID will be handled if it becomes available */}
        </li>
      ))}
    </ul>
  );
};

const LeaveBalancesTabPlaceholder: React.FC<{ data: LeaveBalanceItem[] | undefined; lookupMaps: LookupMaps | null }> = ({ data, lookupMaps }) => {
  const { t } = useTranslation();
  if (!data) return <p>{t('employee_detail_page.leave_balances_tab.loading_or_no_data')}</p>;
  if (data.length === 0) return <p>{t('employee_detail_page.leave_balances_tab.no_records')}</p>;
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {lookupMaps?.leaveTypeMap.get(Number(item.leave_type_id)) || item.leave_type_name || t('employee_detail_page.leave_balances_tab.type_id_prefix', {id: item.leave_type_id})}: 
          {item.balance} {item.unit} ({t('employee_detail_page.leave_balances_tab.entitlement_prefix')} {item.total_entitlement}, {t('employee_detail_page.leave_balances_tab.taken_prefix')} {item.taken})
        </li>
      ))}
    </ul>
  );
};

const EmployeeDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { lookupMaps, rawLookups, loadingLookups, errorLookups } = useLookupMaps();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basicInfo');

  useEffect(() => {
    if (errorLookups) {
      message.error(t('employee_detail_page.message_load_lookups_failed'));
      console.error('Error from useLookupMaps:', errorLookups);
    }
  }, [errorLookups, t]);

  useEffect(() => {
    if (!employeeId) {
      message.error(t('employee_detail_page.message_employee_id_not_found'));
      navigate('/hr/employees');
      return;
    }

    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await employeeService.getEmployeeById(employeeId);
        if (data) {
          setEmployee(data);
        } else {
          setError(t('employee_detail_page.error_employee_info_not_found'));
          message.error(t('employee_detail_page.error_employee_info_not_found'));
        }
      } catch (err) {
        console.error('获取员工详情失败:', err);
        setError(t('employee_detail_page.error_get_employee_detail_failed_retry'));
        message.error(t('employee_detail_page.error_get_employee_detail_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, navigate, t]);

  const handleEdit = () => {
    if (employeeId) {
      navigate(`/hr/employees/${employeeId}/edit`);
    }
  };
  
  const pageHeaderExtra = (
    <ActionButton
      key="edit"
      actionType="edit"
      onClick={handleEdit}
      tooltipTitle={t('employee_detail_page.tooltip_edit_employee_info')}
    />
  );

  const employeeDisplayName = employee ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() : '';
  const pageTitle = employee 
    ? t('employee_detail_page.page_title_with_name_id', { name: employeeDisplayName, employeeCode: employee.employee_code || t('employee_detail_page.common_value_na')}) 
    : t('employee_detail_page.page_title_default');

  const breadcrumbItems = [
    { onClick: () => navigate('/'), title: <HomeOutlined /> },
    { onClick: () => navigate('/hr/employees'), title: t('page_title.hr_management') },
    { onClick: () => navigate('/hr/employees'), title: t('page_title.employee_list') },
    { title: employee ? employeeDisplayName : t('employee_detail_page.breadcrumb_loading') }
  ];

  const renderContent = () => {
    if (!employee) return <Alert message={t('employee_detail_page.alert_message_info')} description={t('employee_detail_page.alert_description_employee_not_selected_or_found')} type="info" showIcon />;

    const tabItems = [
      {
        key: 'basic',
        label: t('employee_detail_page.tab_label_basic_info'),
        children: <BasicInfoTabPlaceholder employee={employee} lookupMaps={lookupMaps} />,
      },
      {
        key: 'jobInfo',
        label: t('employee_detail_page.tab_label_job_info'),
        children: <JobInfoTabPlaceholder employee={employee} lookupMaps={lookupMaps} />
      },
      {
        key: 'jobHistory',
        label: t('employee_detail_page.tab_label_job_history'),
        children: <JobHistoryTabPlaceholder data={employee.job_history_records} lookupMaps={lookupMaps} />,
      },
      {
        key: 'contracts',
        label: t('employee_detail_page.tab_label_contracts'),
        children: <ContractsTabPlaceholder data={employee.contracts} lookupMaps={lookupMaps} />,
      },
      {
        key: 'compensation',
        label: t('employee_detail_page.tab_label_compensation'),
        children: <CompensationTabPlaceholder data={employee.compensation_records} lookupMaps={lookupMaps} />,
      },
      {
        key: 'leaveBalance',
        label: t('employee_detail_page.tab_label_leave_balances'),
        children: <LeaveBalancesTabPlaceholder data={employee.leave_balances} lookupMaps={lookupMaps} />,
      },
    ];

    return (
      <Tabs defaultActiveKey="basic" items={tabItems} />
    );
  };

  if (loading || loadingLookups) {
    return (
      <PageContainer title={t('employee_detail_page.page_container_title_loading')}>
        <Spin size="large" style={{ display: 'block', marginTop: '50px' }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title={t('employee_detail_page.page_container_title_error')}>
        <Alert message={t('edit_employee_page.alert_message_error')} description={error} type="error" showIcon /> 
        <Button onClick={() => navigate('/hr/employees')} style={{ marginTop: 16 }}>
          {t('employee_detail_page.button_back_to_list')}
        </Button>
      </PageContainer>
    );
  }

  if (!employee) {
     return (
      <PageContainer title={t('employee_detail_page.page_container_title_employee_not_found')}>
        <Alert message={t('employee_detail_page.alert_message_info')} description={t('employee_detail_page.alert_description_cannot_load_data')} type="info" showIcon />
        <Button onClick={() => navigate('/hr/employees')} style={{ marginTop: 16 }}>
          {t('employee_detail_page.button_back_to_list')}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={pageTitle}
      extra={pageHeaderExtra}
      breadcrumb={{ items: breadcrumbItems }}
    >
      {renderContent()}
    </PageContainer>
  );
};

export default EmployeeDetailPage; 