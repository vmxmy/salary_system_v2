import React, { useEffect, useState } from 'react';
import { Descriptions, Spin, Alert, Typography, Card, Avatar, Empty, Breadcrumb } from 'antd';
import { UserOutlined, HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { employeeService } from '../../services/employeeService';
import type { Employee, LookupValue, Department, JobTitle } from '../HRManagement/types';
import useHrLookupStore from '../../store/hrLookupStore';

const { Title, Text } = Typography;

// Updated to use a generic type for lookupArray to handle Department and JobTitle as well
const getLookupDisplayName = <T extends { id: number; name?: string; label?: string }>(
  valueId?: number | null, 
  lookupArray?: T[], 
  fallback?: string
) => {
  if (valueId === undefined || valueId === null) return fallback || 'N/A';
  const found = lookupArray?.find(item => item.id === valueId);
  return found?.name || found?.label || fallback || String(valueId); // Prefer name, then label
};

const MyInfoPage: React.FC = () => {
  const { t } = useTranslation();
  const employeeId = useAuthStore(state => state.currentUser?.employee_id);
  const currentUserForDisplay = useAuthStore(state => state.currentUser);

  // Individual selectors for hrLookupStore to ensure stability for useSyncExternalStore
  const genders = useHrLookupStore(state => state.genders);
  const maritalStatuses = useHrLookupStore(state => state.maritalStatuses);
  const educationLevels = useHrLookupStore(state => state.educationLevels);
  const employmentTypes = useHrLookupStore(state => state.employmentTypes);
  const employeeStatuses = useHrLookupStore(state => state.employeeStatuses);
  const departments = useHrLookupStore(state => state.departments);
  const jobTitles = useHrLookupStore(state => state.jobTitles);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);

  useEffect(() => {
    // Fetch all lookups when the component mounts if not already loading/loaded
    const { loading: lookupLoadingState, fetchLookup, errors: lookupErrors, genders: sg, maritalStatuses: sms, educationLevels: sel, departments: sd, jobTitles: sjt, employmentTypes: sety, employeeStatuses: ses } = useHrLookupStore.getState();
    
    const shouldFetchLookups = 
      sg.length === 0 && !lookupErrors.has('genders') && !lookupLoadingState.has('genders') ||
      sms.length === 0 && !lookupErrors.has('maritalStatuses') && !lookupLoadingState.has('maritalStatuses') ||
      sel.length === 0 && !lookupErrors.has('educationLevels') && !lookupLoadingState.has('educationLevels') ||
      sd.length === 0 && !lookupErrors.has('departments') && !lookupLoadingState.has('departments') ||
      sjt.length === 0 && !lookupErrors.has('jobTitles') && !lookupLoadingState.has('jobTitles') ||
      sety.length === 0 && !lookupErrors.has('employmentTypes') && !lookupLoadingState.has('employmentTypes') ||
      ses.length === 0 && !lookupErrors.has('employeeStatuses') && !lookupLoadingState.has('employeeStatuses');

    if (shouldFetchLookups) {
      fetchLookup('all');
    }
  }, []); // Run once on mount, empty dependency array is correct here for this purpose

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (employeeId && !error) {
        setLoading(true);
        setFetchAttempted(true);
        try {
          setError(null);
          const data = await employeeService.getEmployeeById(String(employeeId));
          setEmployee(data);
        } catch (err: any) {
          console.error('Error fetching employee details for MyInfo:', err);
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            setError(t('myInfo.fetchErrorUnauthorized', 'Failed to load your information due to an authorization issue. Please try logging in again.'));
          } else {
            setError(t('myInfo.fetchError', 'Failed to load your information.'));
          }
          setEmployee(null);
        } finally {
          setLoading(false);
        }
      } else if (!employeeId && !fetchAttempted) {
        setLoading(false);
        setEmployee(null);
      } else if (employeeId === null && fetchAttempted) {
        setError(t('myInfo.noEmployeeIdError', 'Employee ID became unavailable. Cannot display information.'));
        setEmployee(null);
        setLoading(false);
      }
    };

    if (employeeId) {
      setError(null);
      setFetchAttempted(false);
    }

    fetchEmployeeData();
  }, [employeeId, t]);

  const breadcrumbItems = [
    { key: 'home', href: '/', title: <HomeOutlined /> },
    { key: 'my-info', title: t('myInfo.title') },
  ];

  if (loading && !employee) {
    return <Spin tip={t('loading')} style={{ display: 'block', marginTop: '50px' }} />;
  }

  if (error) {
    return <Alert message={t('error.genericTitle')} description={error} type="error" showIcon style={{ margin: '20px' }} />;
  }

  if (!employee) {
    return <Empty description={t('myInfo.noData')} style={{ marginTop: '50px' }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '24px' }}>
        {breadcrumbItems.map(item => (
          <Breadcrumb.Item key={item.key}>
            {item.href ? <Link to={item.href}>{item.title}</Link> : item.title}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <Avatar size={64} src={employee.avatar} icon={<UserOutlined />} style={{ marginRight: '20px' }} />
          <div>
            <Title level={3} style={{ marginBottom: 0 }}>{`${employee.first_name} ${employee.last_name}`}</Title>
            <Text type="secondary">{t('myInfo.employeeCode')}: {employee.employee_code}</Text>
          </div>
        </div>

        <Descriptions title={t('myInfo.sectionTitles.personal')} bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} style={{ marginBottom: 24}}>
          <Descriptions.Item label={t('employee.firstName')}>{employee.first_name}</Descriptions.Item>
          <Descriptions.Item label={t('employee.lastName')}>{employee.last_name}</Descriptions.Item>
          <Descriptions.Item label={t('employee.dob')}>{employee.dob ? String(employee.dob) : 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.gender')}>{getLookupDisplayName(employee.gender_lookup_value_id, genders)}</Descriptions.Item>
          <Descriptions.Item label={t('employee.idNumber')}>{employee.id_number || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.nationality')}>{employee.nationality || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.maritalStatus')}>{getLookupDisplayName(employee.marital_status_lookup_value_id, maritalStatuses)}</Descriptions.Item>
          <Descriptions.Item label={t('employee.ethnicity')}>{employee.ethnicity || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.politicalStatus')}>{getLookupDisplayName(employee.political_status_lookup_value_id /*, politicalStatuses - if fetched */)}</Descriptions.Item>
          <Descriptions.Item label={t('employee.educationLevel')}>{getLookupDisplayName(employee.education_level_lookup_value_id, educationLevels)}</Descriptions.Item>
        </Descriptions>

        <Descriptions title={t('myInfo.sectionTitles.contact')} bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} style={{ marginBottom: 24}}>
          <Descriptions.Item label={t('employee.personalEmail')}>{employee.personalEmail || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.workEmail')}>{employee.workEmail || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.mobilePhone')}>{employee.mobilePhone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.workPhone')}>{employee.workPhone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.address')} span={2}>{employee.addressDetail || 'N/A'}</Descriptions.Item>
        </Descriptions>
        
        <Descriptions title={t('myInfo.sectionTitles.employment')} bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} style={{ marginBottom: 24}}>
          <Descriptions.Item label={t('employee.department')}>{employee.departmentName || getLookupDisplayName(employee.department_id, departments)}</Descriptions.Item>
          <Descriptions.Item label={t('employee.jobTitle')}>{employee.job_title_name || getLookupDisplayName(employee.job_title_id, jobTitles)}</Descriptions.Item>
          <Descriptions.Item label={t('employee.hireDate')}>{employee.hire_date ? String(employee.hire_date) : 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.probationEndDate')}>{employee.probationEndDate ? String(employee.probationEndDate) : 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.employmentType')}>{getLookupDisplayName(employee.employment_type_lookup_value_id, employmentTypes)}</Descriptions.Item>
          <Descriptions.Item label={t('employee.status')}>{getLookupDisplayName(employee.status_lookup_value_id, employeeStatuses)}</Descriptions.Item>
          <Descriptions.Item label={t('employee.reportsTo')}>{getLookupDisplayName(employee.reports_to_employee_id /*, employees - if fetched for manager name lookup */)}</Descriptions.Item>
          <Descriptions.Item label={t('employee.workLocation')}>{employee.workLocation || 'N/A'}</Descriptions.Item>
        </Descriptions>

        <Descriptions title={t('myInfo.sectionTitles.bank')} bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} style={{ marginBottom: 24}}>
          <Descriptions.Item label={t('employee.bankName')}>{employee.bankName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.bankAccountName')}>{employee.bankAccountName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.bankAccountNumber')} span={2}>{employee.bankAccountNumber || 'N/A'}</Descriptions.Item>
        </Descriptions>

        <Descriptions title={t('myInfo.sectionTitles.emergency')} bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
          <Descriptions.Item label={t('employee.emergencyContactName')}>{employee.emergencyContactName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.emergencyContactPhone')}>{employee.emergencyContactPhone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label={t('employee.emergencyContactRelation')}>{employee.emergencyContactRelation || 'N/A'}</Descriptions.Item>
        </Descriptions>

        {employee.notes && (
          <Card title={t('employee.notes')} style={{ marginTop: 24 }}>
            <Text>{employee.notes}</Text>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default MyInfoPage;