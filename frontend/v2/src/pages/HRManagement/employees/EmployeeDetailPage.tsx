import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { Descriptions, Tabs, Spin, Button, message, Alert, Breadcrumb, Typography, Tag } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import TableActionButton from '../../../components/common/TableActionButton';
import { employeeService } from "../../../services/employeeService";
import type { Employee, JobHistoryItem, ContractItem, CompensationItem, LeaveBalanceItem, LookupItem } from "../types";
import { useLookupMaps, type LookupMaps, type RawLookups } from '../../../hooks/useLookupMaps';
import EmployeeName from '../../../components/common/EmployeeName';
import UnifiedTabs from '../../../components/common/UnifiedTabs';
// import { usePermissions } from '../../../../hooks/usePermissions'; // TODO: Integrate permissions

// Updated BasicInfoTabPlaceholder
const BasicInfoTabPlaceholder: React.FC<{ employee: Employee | null; lookupMaps: LookupMaps | null; rawLookups?: RawLookups | null }> = ({ employee, lookupMaps, rawLookups }) => {
  const { t } = useTranslation(['employee', 'common']);
  
  if (!employee) {
    return <p>{t('employee:detail_page.common_value.na')}</p>;
  }

  const naText = t('employee:detail_page.common_value.na');
  const namePartsList = [];
  if (employee.last_name) namePartsList.push(employee.last_name);
  if (employee.first_name) namePartsList.push(employee.first_name);
  const fullName = namePartsList.length > 0 ? namePartsList.join(' ') : naText;
  
  const genderText = employee.gender_lookup_value_id !== undefined
    ? lookupMaps?.genderMap.get(employee.gender_lookup_value_id) || String(employee.gender_lookup_value_id)
    : naText;
  
  const educationLevelText = employee.education_level_lookup_value_id !== undefined
    ? lookupMaps?.educationLevelMap.get(employee.education_level_lookup_value_id) || String(employee.education_level_lookup_value_id)
    : naText;
  
  const statusText = employee.status_lookup_value_id !== undefined
    ? lookupMaps?.statusMap.get(employee.status_lookup_value_id) || String(employee.status_lookup_value_id)
    : naText;

  return (
    <>
      {/* 第一部分：基本个人信息 */}
      <Descriptions title={t('employee:detail_page.basic_info_tab.title')} bordered column={2} layout="vertical" style={{ marginBottom: 20 }}>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_full_name')} span={1}>{fullName}</Descriptions.Item>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_id')} span={1}>{employee.employee_code || naText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:form_label.id_number')} span={1}>{employee.id_number || naText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_gender')} span={1}>{genderText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_dob')} span={1}>{employee.date_of_birth ? String(employee.date_of_birth) : naText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_education_level')} span={1}>{educationLevelText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:form_label.nationality')} span={1}>{employee.nationality || naText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_employee_status')} span={1}>
          {statusText !== naText && employee.status_lookup_value_id !== undefined && 
            rawLookups?.statusOptions?.find((opt: LookupItem) => opt.value === employee.status_lookup_value_id)?.code === 'active' 
            ? <Tag color='green'>{statusText}</Tag> 
            : (statusText !== naText ? <Tag color='volcano'>{statusText}</Tag> : naText)}
        </Descriptions.Item>
      </Descriptions>

      {/* 第二部分：联系方式 */}
      <Descriptions title={t('employee:detail_page.contact_info')} bordered column={2} layout="vertical" style={{ marginBottom: 20 }}>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_email')} span={1}>{employee.email || naText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_mobile_phone')} span={1}>{employee.phone_number || naText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_residential_address')} span={1}>{employee.home_address || naText}</Descriptions.Item>
      </Descriptions>

      {/* 第三部分：银行信息 */}
      <Descriptions title={t('employee:detail_page.bank_info')} bordered column={2} layout="vertical" style={{ marginBottom: 20 }}>
        <Descriptions.Item label={t('employee:form_label.bank_name')} span={1}>{employee.bank_name || naText}</Descriptions.Item>
        <Descriptions.Item label={t('employee:form_label.bank_account_number')} span={1}>{employee.bank_account_number || naText}</Descriptions.Item>
      </Descriptions>

      {/* 第四部分：备注 */}
      <Descriptions title={t('employee:detail_page.additional_info')} bordered column={1} layout="vertical">
        <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_notes')}>{employee.notes || naText}</Descriptions.Item>
      </Descriptions>
    </>
  );
};

const JobInfoTabPlaceholder: React.FC<{ employee?: Employee, lookupMaps: LookupMaps | null }> = ({ employee, lookupMaps }) => {
    const { t } = useTranslation(['employee', 'common']);
    
    if (!employee) {
        return <p>{t('employee:detail_page.common_value.na')}</p>;
    }
    
    const naText = t('employee:detail_page.common_value.na');
    
    const calculateSeniority = (hireDateStr?: string): string => {
        if (!hireDateStr) return naText;
        
        try {
            const hireDate = new Date(hireDateStr);
            const today = new Date();
            
            let years = today.getFullYear() - hireDate.getFullYear();
            let months = today.getMonth() - hireDate.getMonth();
            
            // 调整月份
            if (months < 0) {
                years--;
                months += 12;
            }
            
            // 检查日期
            if (today.getDate() < hireDate.getDate()) {
                months--;
                if (months < 0) {
                    years--;
                    months += 12;
                }
            }
            
            return years > 0 
                ? t('employee:detail_page.job_info_tab.seniority_years_months', { years, months })
                : t('employee:detail_page.job_info_tab.seniority_months', { months });
        } catch (error) {
            console.error("计算司龄时出错:", error);
            return naText;
        }
    };
    
    return (
        <>
            {/* 部门和职位信息 */}
            <Descriptions title={t('employee:detail_page.job_info_tab.department_position')} bordered column={2} layout="vertical" style={{ marginBottom: 20 }}>
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_department')}>
                    {lookupMaps?.departmentMap.get(String(employee.department_id)) || 
                     employee.departmentName || 
                     String(employee.department_id ?? naText)}
                </Descriptions.Item>
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_personnel_category')}>
                    {lookupMaps?.personnelCategoryMap.get(String(employee.personnel_category_id)) || 
                     employee.personnel_category_name || 
                     String(employee.personnel_category_id ?? naText)}
                </Descriptions.Item>
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_actual_position')}>
                    {lookupMaps?.positionMap.get(String(employee.actual_position_id)) || 
                     employee.actual_position_name || 
                     String(employee.actual_position_id ?? naText)}
                </Descriptions.Item>
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_work_location')}>
                    {employee.workLocation || naText}
                </Descriptions.Item>
            </Descriptions>
            
            {/* 雇佣相关信息 */}
            <Descriptions title={t('employee:detail_page.job_info_tab.employment_info')} bordered column={2} layout="vertical" style={{ marginBottom: 20 }}>
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_hire_date')}>
                    {employee.hire_date ? String(employee.hire_date) : naText}
                </Descriptions.Item>
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_employment_type')}>
                    {lookupMaps?.employmentTypeMap.get(Number(employee.employment_type_lookup_value_id)) || 
                     String(employee.employment_type_lookup_value_id ?? naText)}
                </Descriptions.Item>
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_seniority')}>
                    {calculateSeniority(typeof employee.hire_date === 'string' ? employee.hire_date : undefined)}
                </Descriptions.Item>
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_probation_end_date')}>
                    {employee.probationEndDate ? String(employee.probationEndDate) : naText}
                </Descriptions.Item>
            </Descriptions>
            
            {/* 汇报关系 */}
            <Descriptions title={t('employee:detail_page.job_info_tab.reporting_info')} bordered column={1} layout="vertical">
                <Descriptions.Item label={t('employee:detail_page.job_info_tab.label_reports_to')}>
                    {employee.reports_to_employee_id 
                     ? t('employee:detail_page.job_info_tab.reports_to_id_prefix', {id: employee.reports_to_employee_id}) 
                     : naText}
                </Descriptions.Item>
            </Descriptions>
        </>
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
          {t('employee:detail_page.job_history_tab.personnel_category_prefix')} {lookupMaps?.personnelCategoryMap.get(String(item.personnel_category_id)) || item.personnel_category_name || String(item.personnel_category_id ?? t('employee:detail_page.common_value.na'))}, 
          {t('employee:detail_page.job_history_tab.actual_position_prefix')} {lookupMaps?.positionMap.get(String(item.position_id)) || item.position_name || String(item.position_id ?? t('employee:detail_page.common_value.na'))} {t('employee:detail_page.job_history_tab.at_conjunction')} 
          {lookupMaps?.departmentMap.get(String(item.department_id)) || item.departmentName || String(item.department_id ?? t('employee:detail_page.common_value.na'))}
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

    console.log('[EmployeeDetailPage] useEffect: employeeId is:', employeeId);

    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[EmployeeDetailPage] fetchEmployee: Fetching data for employeeId:', employeeId);
        const data = await employeeService.getEmployeeById(employeeId);
        console.log('[EmployeeDetailPage] fetchEmployee: Data received from API:', data);
        if (data) {
          setEmployee(data);
          console.log('[EmployeeDetailPage] fetchEmployee: Employee state updated.');
        } else {
          setError(t('employee:detail_page.error.employee_info_not_found'));
          message.error(t('employee:detail_page.error.employee_info_not_found'));
          console.warn('[EmployeeDetailPage] fetchEmployee: No data received for employeeId:', employeeId);
        }
      } catch (err) {
        console.error('[EmployeeDetailPage] fetchEmployee: 获取员工详情失败:', err);
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
    <TableActionButton
      key="edit"
      actionType="edit"
      onClick={handleEdit}
      tooltipTitle={t('employee:detail_page.tooltip_edit_employee_info')}
    />
  );

  const pageTitleText = employee 
    ? t('employee:detail_page.title_with_name_id', { 
        name: <EmployeeName 
                employeeId={employee.id} 
                employeeName={`${employee.last_name || ''}${employee.first_name || ''}`}
                showId={false}
                className="employee-header-name"
              />, 
        employeeCode: employee.employee_code || t('employee:detail_page.common_value.na')
      }) 
    : t('employee:detail_page.title_default');

  const breadcrumbItems = [
    { onClick: () => navigate('/'), title: <HomeOutlined /> },
    { onClick: () => navigate('/hr/employees'), title: t('pageTitle:hr_management') },
    { onClick: () => navigate('/hr/employees'), title: t('pageTitle:employee_list') },
    { title: employee ? 
        <EmployeeName 
          employeeId={employee.id} 
          employeeName={`${employee.last_name || ''}${employee.first_name || ''}`}
          showId={false}
          className="employee-breadcrumb-name"
        /> 
        : t('employee:detail_page.breadcrumb_loading') 
    }
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
      <UnifiedTabs 
        defaultActiveKey="basic" 
        items={tabItems} 
        onChange={setActiveTab} 
        size="large"
        type="line"
      />
    );
  };

  console.log('[EmployeeDetailPage] Rendering: employee state:', employee);
  console.log('[EmployeeDetailPage] Rendering: pageTitleText calculated as:', pageTitleText);

  if (loading || loadingLookups) {
    return (
      <PageContainer
        title={t('employee:detail_page.page_container.title_loading')}
        breadcrumbRender={false}
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
        breadcrumbRender={false}
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
        breadcrumbRender={false}
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
      breadcrumbRender={false}
      extra={pageHeaderExtra}
    >
      {renderContent()}
    </PageContainer>
  );
};

export default EmployeeDetailPage; 