import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { Descriptions, Tabs, Spin, Button, message, Alert, Breadcrumb, Typography, Tag } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ActionButton from '../../../components/common/ActionButton';
import { employeeService } from "../../../services/employeeService";
import type { Employee, JobHistoryItem, ContractItem, CompensationItem, LeaveBalanceItem, LookupItem } from "../types";
import { useLookupMaps, type LookupMaps, type RawLookups } from '../../../hooks/useLookupMaps';
// import { usePermissions } from '../../../../hooks/usePermissions'; // TODO: Integrate permissions

// Updated BasicInfoTabPlaceholder
const BasicInfoTabPlaceholder: React.FC<{ employee: Employee | null; lookupMaps: LookupMaps | null; rawLookups?: RawLookups | null }> = ({ employee, lookupMaps, rawLookups }) => {
  const { t } = useTranslation(['employee', 'common']);
  const naText = t('employee:detail_page.common_value.na', 'N/A');

  if (!employee) { // Simplified loading/empty state, main component handles overall loading
    return <Descriptions title={t('employee:detail_page.tabs.basic_info')} bordered column={2}><Descriptions.Item label={t('employee:detail_page.basic_info_tab.status_loading')}>{naText}</Descriptions.Item></Descriptions>;
  }
  
  const fullName = employee.first_name && employee.last_name ? `${employee.first_name} ${employee.last_name}` : (employee.first_name || employee.last_name || naText);
  
  const genderText = employee.gender_lookup_value_id !== undefined && employee.gender_lookup_value_id !== null 
    ? lookupMaps?.genderMap?.get(Number(employee.gender_lookup_value_id)) || String(employee.gender_lookup_value_id)
    : naText;

  const statusText = employee.status_lookup_value_id !== undefined && employee.status_lookup_value_id !== null
    ? lookupMaps?.statusMap?.get(Number(employee.status_lookup_value_id)) || String(employee.status_lookup_value_id)
    : naText;
  
  const educationLevelText = employee.education_level_lookup_value_id !== undefined && employee.education_level_lookup_value_id !== null
    ? lookupMaps?.educationLevelMap?.get(Number(employee.education_level_lookup_value_id)) || String(employee.education_level_lookup_value_id)
    : naText;

  return (
    <Descriptions title={t('employee:detail_page.tabs.basic_info')} bordered column={2} layout="vertical">
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_full_name')}>{fullName}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_id')}>{employee.employee_code || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:form_label.id_number')}>{employee.id_number || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_dob')}>{employee.date_of_birth ? String(employee.date_of_birth) : naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_gender')}>{genderText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:form_label.nationality')}>{employee.nationality || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_education_level')}>{educationLevelText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_mobile_phone')}>{employee.phone_number || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_email')} span={2}>{employee.email || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_residential_address')}>{employee.home_address || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:form_label.bank_name')}>{employee.bank_name || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:form_label.bank_account_number')}>{employee.bank_account_number || naText}</Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_status')}>
        {statusText !== naText && employee.status_lookup_value_id !== undefined && 
          rawLookups?.statusOptions?.find((opt: LookupItem) => opt.value === employee.status_lookup_value_id)?.code === 'active' 
          ? <Tag color='green'>{statusText}</Tag> 
          : (statusText !== naText ? <Tag color='volcano'>{statusText}</Tag> : naText)}
      </Descriptions.Item>
      <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_notes')}>{employee.notes || naText}</Descriptions.Item>
    </Descriptions>
  );
};

const JobInfoTabPlaceholder: React.FC<{ employee?: Employee, lookupMaps: LookupMaps | null }> = ({ employee, lookupMaps }) => {
    const { t } = useTranslation(['employee', 'common']);
    if (!employee) return <Descriptions title={t('employee:detail_page.job_info_tab.title')} bordered column={2}><Descriptions.Item>{t('employee:detail_page.job_info_tab.loading')}</Descriptions.Item></Descriptions>; 
    return (
        <Descriptions title={t('employee:detail_page.job_info_tab.title')} bordered column={2}>
            <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_department')}>{lookupMaps?.departmentMap.get(Number(employee.department_id)) || employee.departmentName || String(employee.department_id ?? t('employee:detail_page.common_value.dash'))}</Descriptions.Item>
            <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_personnel_category')}>{lookupMaps?.personnelCategoryMap.get(Number(employee.personnel_category_id)) || employee.personnel_category_name || String(employee.personnel_category_id ?? t('employee:detail_page.common_value.dash'))}</Descriptions.Item>
            <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_actual_position')}>{lookupMaps?.positionMap.get(Number(employee.actual_position_id)) || employee.actual_position_name || String(employee.actual_position_id ?? t('employee:detail_page.common_value.dash'))}</Descriptions.Item>
            <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_reports_to')}>{employee.reports_to_employee_id ? t('employee:detail_page.job_info_tab.reports_to_id_prefix', {id: employee.reports_to_employee_id}) : t('employee:detail_page.common_value.dash')} </Descriptions.Item>
            <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_work_location')}>{employee.workLocation || t('employee:detail_page.common_value.dash')}</Descriptions.Item>
        </Descriptions>
    );
};

const JobHistoryTabPlaceholder: React.FC<{ data: JobHistoryItem[] | undefined; lookupMaps: LookupMaps | null }> = ({ data, lookupMaps }) => {
  const { t } = useTranslation(['employee', 'common']);
  if (!data) return <p>{t('employee:detail_page.job_history_tab.loading_or_no_data')}</p>;
  if (data.length === 0) return <p>{t('employee:detail_page.job_history_tab.no_records')}</p>;
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {item.effectiveDate ? String(item.effectiveDate) : t('employee:detail_page.common_value.na')}: 
          {t('employee:detail_page.job_history_tab.personnel_category_prefix')} {lookupMaps?.personnelCategoryMap.get(Number(item.personnel_category_id)) || item.personnel_category_name || String(item.personnel_category_id ?? t('employee:detail_page.common_value.na'))}, 
          {t('employee:detail_page.job_history_tab.actual_position_prefix')} {lookupMaps?.positionMap.get(Number(item.position_id)) || item.position_name || String(item.position_id ?? t('employee:detail_page.common_value.na'))} {t('employee:detail_page.job_history_tab.at_conjunction')} 
          {lookupMaps?.departmentMap.get(Number(item.department_id)) || item.departmentName || String(item.department_id ?? t('employee:detail_page.common_value.na'))}
          {item.employment_type_lookup_value_id ? ` (${lookupMaps?.employmentTypeMap.get(Number(item.employment_type_lookup_value_id)) || String(item.employment_type_lookup_value_id)})` : ''}
        </li>
      ))}
    </ul>
  );
};

const ContractsTabPlaceholder: React.FC<{ data: ContractItem[] | undefined; lookupMaps: LookupMaps | null }> = ({ data, lookupMaps }) => {
  const { t } = useTranslation(['employee', 'common']);
  if (!data) return <p>{t('employee:detail_page.contracts_tab.loading_or_no_data')}</p>;
  if (data.length === 0) return <p>{t('employee:detail_page.contracts_tab.no_records')}</p>;
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {item.contract_number} ({lookupMaps?.contractTypeMap.get(Number(item.contract_type_lookup_value_id)) || String(item.contract_type_lookup_value_id ?? t('employee:detail_page.common_value.na'))}) - 
          {item.start_date ? String(item.start_date) : t('employee:detail_page.common_value.na')} {t('employee:detail_page.contracts_tab.to_conjunction')} {item.end_date ? String(item.end_date) : t('employee:detail_page.common_value.na')}
        </li>
      ))}
    </ul>
  );
};

const CompensationTabPlaceholder: React.FC<{ data: CompensationItem[] | undefined; lookupMaps: LookupMaps | null }> = ({ data, lookupMaps }) => {
  const { t } = useTranslation(['employee', 'common']);
  if (!data) return <p>{t('employee:detail_page.compensation_tab.loading_or_no_data')}</p>;
  if (data.length === 0) return <p>{t('employee:detail_page.compensation_tab.no_records')}</p>;
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {item.effective_date ? String(item.effective_date) : t('employee:detail_page.common_value.na')}: {t('employee:detail_page.compensation_tab.basic_prefix')} {item.basic_salary}, {t('employee:detail_page.compensation_tab.total_prefix')} {item.total_salary || t('employee:detail_page.common_value.na')}
          {item.pay_frequency_lookup_value_id ? ` (${t('employee:detail_page.compensation_tab.freq_prefix')} ${lookupMaps?.payFrequencyMap?.get(Number(item.pay_frequency_lookup_value_id)) || String(item.pay_frequency_lookup_value_id)})` : ''}
        </li>
      ))}
    </ul>
  );
};

const LeaveBalancesTabPlaceholder: React.FC<{ data: LeaveBalanceItem[] | undefined; lookupMaps: LookupMaps | null }> = ({ data, lookupMaps }) => {
  const { t } = useTranslation(['employee', 'common']);
  if (!data) return <p>{t('employee:detail_page.leave_balances_tab.loading_or_no_data')}</p>;
  if (data.length === 0) return <p>{t('employee:detail_page.leave_balances_tab.no_records')}</p>;
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {lookupMaps?.leaveTypeMap.get(Number(item.leave_type_id)) || item.leave_type_name || t('employee:detail_page.leave_balances_tab.type_id_prefix', {id: item.leave_type_id})}: 
          {item.balance} {item.unit} ({t('employee:detail_page.leave_balances_tab.entitlement_prefix')} {item.total_entitlement}, {t('employee:detail_page.leave_balances_tab.taken_prefix')} {item.taken})
        </li>
      ))}
    </ul>
  );
};

const EmployeeDetailPage: React.FC = () => {
  const { t } = useTranslation(['employee', 'common', 'pageTitle']);
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { lookupMaps, rawLookups, loadingLookups, errorLookups } = useLookupMaps();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basicInfo');

  useEffect(() => {
    if (errorLookups) {
      message.error(t('employee:detail_page.message.load_lookups_failed'));
      console.error('Error from useLookupMaps:', errorLookups);
    }
  }, [errorLookups, t]);

  useEffect(() => {
    if (!employeeId) {
      message.error(t('employee:detail_page.message.employee_id_not_found'));
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
          setError(t('employee:detail_page.error.employee_info_not_found'));
          message.error(t('employee:detail_page.error.employee_info_not_found'));
        }
      } catch (err) {
        console.error('获取员工详情失败:', err);
        setError(t('employee:detail_page.message.error_get_employee_detail_failed_retry'));
        message.error(t('employee:detail_page.message.error_get_employee_detail_failed'));
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
      tooltipTitle={t('employee:detail_page.tooltip_edit_employee_info')}
    />
  );

  const employeeDisplayName = employee ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() : '';
  const pageTitleText = employee 
    ? t('employee:detail_page.title_with_name_id', { name: employeeDisplayName, employeeCode: employee.employee_code || t('employee:detail_page.common_value.na')}) 
    : t('employee:detail_page.title_default');

  const breadcrumbItems = [
    { onClick: () => navigate('/'), title: <HomeOutlined /> },
    { onClick: () => navigate('/hr/employees'), title: t('pageTitle:hr_management.title') },
    { onClick: () => navigate('/hr/employees'), title: t('pageTitle:employee.list_page_title') },
    { title: employee ? employeeDisplayName : t('employee:detail_page.breadcrumb_loading') }
  ];

  const renderContent = () => {
    if (!employee) return <Alert message={t('employee:detail_page.alert.message_info')} description={t('employee:detail_page.alert.description_employee_not_selected_or_found')} type="info" showIcon />;

    const tabItems = [
      {
        key: 'basic',
        label: t('employee:detail_page.tabs.basic_info'),
        children: <BasicInfoTabPlaceholder employee={employee} lookupMaps={lookupMaps} rawLookups={rawLookups} />,
      },
      {
        key: 'jobInfo',
        label: t('employee:detail_page.tabs.job_info'),
        children: <JobInfoTabPlaceholder employee={employee} lookupMaps={lookupMaps} />
      },
      {
        key: 'jobHistory',
        label: t('employee:detail_page.tabs.job_history'),
        children: <JobHistoryTabPlaceholder data={employee.job_history_records} lookupMaps={lookupMaps} />,
      },
      {
        key: 'contracts',
        label: t('employee:detail_page.tabs.contracts'),
        children: <ContractsTabPlaceholder data={employee.contracts} lookupMaps={lookupMaps} />,
      },
      {
        key: 'compensation',
        label: t('employee:detail_page.tabs.compensation'),
        children: <CompensationTabPlaceholder data={employee.compensation_records} lookupMaps={lookupMaps} />,
      },
      {
        key: 'leaveBalance',
        label: t('employee:detail_page.tabs.leave_balances'),
        children: <LeaveBalancesTabPlaceholder data={employee.leave_balances} lookupMaps={lookupMaps} />,
      },
    ];

    return (
      <Tabs defaultActiveKey="basic" items={tabItems} onChange={setActiveTab} />
    );
  };

  if (loading || loadingLookups) {
    return (
      <PageContainer 
        title={t('employee:detail_page.page_container.title_loading')} 
        breadcrumb={{ 
          items: breadcrumbItems, 
          itemRender: (route, _params, routes, _paths) => { 
            const last = routes.indexOf(route) === routes.length - 1; 
            return last ? (<span>{route.title}</span>) : (<Link to={''} onClick={route.onClick}>{route.title}</Link>);
          }
        }} 
        extra={pageHeaderExtra}
      >
        <Spin size="large" style={{ display: 'block', marginTop: '50px' }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer 
        title={t('employee:detail_page.page_container.title_error')} 
        breadcrumb={{
          items: breadcrumbItems, 
          itemRender: (route, _params, routes, _paths) => { 
            const last = routes.indexOf(route) === routes.length - 1; 
            return last ? (<span>{route.title}</span>) : (<Link to={''} onClick={route.onClick}>{route.title}</Link>);
          }
        }} 
        extra={pageHeaderExtra}
      >
        <Alert message={t('employee:detail_page.alert.message_error')} description={error} type="error" showIcon /> 
        <Button onClick={() => navigate('/hr/employees')} style={{ marginTop: 16 }}>
          {t('employee:detail_page.button_back_to_list')}
        </Button>
      </PageContainer>
    );
  }

  if (!employee) {
     return (
      <PageContainer 
        title={t('employee:detail_page.page_container.title_employee_not_found')} 
        breadcrumb={{
          items: breadcrumbItems, 
          itemRender: (route, _params, routes, _paths) => { 
            const last = routes.indexOf(route) === routes.length - 1; 
            return last ? (<span>{route.title}</span>) : (<Link to={''} onClick={route.onClick}>{route.title}</Link>);
          }
        }} 
        extra={pageHeaderExtra}
      >
        <Alert message={t('employee:detail_page.alert.message_info')} description={t('employee:detail_page.page_container.alert_description_cannot_load_data')} type="info" showIcon />
        <Button onClick={() => navigate('/hr/employees')} style={{ marginTop: 16 }}>
          {t('employee:detail_page.button_back_to_list')}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={pageTitleText} 
      breadcrumb={{
        items: breadcrumbItems, 
        itemRender: (route, _params, routes, _paths) => { 
          const last = routes.indexOf(route) === routes.length - 1; 
          return last ? (<span>{route.title}</span>) : (<Link to={''} onClick={route.onClick}>{route.title}</Link>);
        }
      }} 
      extra={pageHeaderExtra}
    >
      {renderContent()}
    </PageContainer>
  );
};

export default EmployeeDetailPage; 