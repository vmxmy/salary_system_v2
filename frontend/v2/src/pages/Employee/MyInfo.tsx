import React, { useEffect, useState } from 'react';
import { Descriptions, Spin, Alert, Typography, Card, Avatar, Empty } from 'antd';
import { UserOutlined, HomeOutlined, ProfileOutlined, SolutionOutlined, WalletOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { employeeService } from '../../services/employeeService';
import type { Employee, LookupValue, Department, PersonnelCategory, Position } from '../HRManagement/types';
import useHrLookupStore from '../../store/hrLookupStore';
import EmployeeName from '../../components/common/EmployeeName';
import UnifiedTabs from '../../components/common/UnifiedTabs';
import StandardDetailPageTemplate from '../../components/common/StandardDetailPageTemplate';
import styles from './MyInfo.module.less';

const { Title, Text } = Typography;

// Updated to use a generic type for lookupArray to handle Department and JobTitle as well
const getLookupDisplayName = <T extends { id: number; name?: string; label?: string }>(
  valueId?: number | null, 
  lookupArray?: T[], 
  fallback?: string
) => {
  if (valueId === undefined || valueId === null) return fallback || '';
  const found = lookupArray?.find(item => item.id === valueId);
  return found?.name || found?.label || fallback || String(valueId); // Prefer name, then label
};

const MyInfoPage: React.FC = () => {
  const { t } = useTranslation(['common', 'employee', 'myInfo', 'pageTitle']);
  const employeeId = useAuthStore(state => state.currentUser?.employee_id);
  const currentUserForDisplay = useAuthStore(state => state.currentUser);

  // Individual selectors for hrLookupStore to ensure stability for useSyncExternalStore
  const genders = useHrLookupStore(state => state.genders);
  const maritalStatuses = useHrLookupStore(state => state.maritalStatuses);
  const educationLevels = useHrLookupStore(state => state.educationLevels);
  const employmentTypes = useHrLookupStore(state => state.employmentTypes);
  const employeeStatuses = useHrLookupStore(state => state.employeeStatuses);
  const departments = useHrLookupStore(state => state.departments);
  const personnelCategories = useHrLookupStore(state => state.personnelCategories);
  const actualPositions = useHrLookupStore(state => state.actualPositions);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);

  useEffect(() => {
    // Fetch all lookups when the component mounts if not already loading/loaded
    const { 
      loading: lookupLoadingState, 
      fetchLookup, 
      errors: lookupErrors, 
      genders: sg, 
      maritalStatuses: sms, 
      educationLevels: sel, 
      departments: sd, 
      personnelCategories: spc,
      actualPositions: sap,
      employmentTypes: sety, 
      employeeStatuses: ses 
    } = useHrLookupStore.getState();
    
    const shouldFetchLookups = 
      (!sg || sg.length === 0) && !lookupErrors.has('genders') && !lookupLoadingState.has('genders') ||
      (!sms || sms.length === 0) && !lookupErrors.has('maritalStatuses') && !lookupLoadingState.has('maritalStatuses') ||
      (!sel || sel.length === 0) && !lookupErrors.has('educationLevels') && !lookupLoadingState.has('educationLevels') ||
      (!sd || sd.length === 0) && !lookupErrors.has('departments') && !lookupLoadingState.has('departments') ||
      (!spc || spc.length === 0) && !lookupErrors.has('personnelCategories') && !lookupLoadingState.has('personnelCategories') ||
      (!sap || sap.length === 0) && !lookupErrors.has('actualPositions') && !lookupLoadingState.has('actualPositions') ||
      (!sety || sety.length === 0) && !lookupErrors.has('employmentTypes') && !lookupLoadingState.has('employmentTypes') ||
      (!ses || ses.length === 0) && !lookupErrors.has('employeeStatuses') && !lookupLoadingState.has('employeeStatuses');

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
          console.log('MyInfo - Employee data received:', data);
          console.log('MyInfo - first_name:', data?.first_name);
          console.log('MyInfo - last_name:', data?.last_name);
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
    }

    fetchEmployeeData();
  }, [employeeId]);

  if (loading && !employee) {
    return <Spin tip={t('common:loading.generic_loading_text')} className={styles.loadingSpin}><div className={styles.loadingSpinContent} /></Spin>;
  }

  if (error) {
    return <Alert message={t('error.genericTitle')} description={error} type="error" showIcon className={styles.errorAlert} />;
  }

  if (!employee) {
    return <Empty description={t('myInfo.noData')} className={styles.emptyState} />;
  }

  const tabItems = [
    {
      key: 'personalContact',
      label: (
        <span>
          <ProfileOutlined />
          {t('myInfo:tabTitles.personalContact', 'Personal & Contact')}
        </span>
      ),
      children: (
        <>
          {/* Card 2: Personal Information */}
          <Card title={t('myInfo:sectionTitles.personal')} className={styles.infoCard}>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label={t('employee:firstName')}>{employee.first_name}</Descriptions.Item>
              <Descriptions.Item label={t('employee:lastName')}>{employee.last_name}</Descriptions.Item>
              <Descriptions.Item label={t('employee:dob')}>{employee.date_of_birth ? String(employee.date_of_birth) : ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:detail_page.basic_info_tab.label_gender')}>{getLookupDisplayName(employee.gender_lookup_value_id, genders)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:idNumber')}>{employee.id_number || ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:nationality')}>{employee.nationality || ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:maritalStatus')}>{getLookupDisplayName(employee.marital_status_lookup_value_id, maritalStatuses)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:ethnicity')}>{employee.ethnicity || ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:politicalStatus')}>{getLookupDisplayName(employee.political_status_lookup_value_id /*, politicalStatuses - if fetched */)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:educationLevel')}>{getLookupDisplayName(employee.education_level_lookup_value_id, educationLevels)}</Descriptions.Item>
            </Descriptions>
          </Card>
          
          {/* Card 3: Contact Information */}
          <Card title={t('myInfo:sectionTitles.contact')} className={styles.infoCard}>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label={t('employee:personalEmail')}>{employee.email || ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:mobilePhone')}>{employee.phone_number || ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:address')} span={1}>{employee.home_address || ''}</Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )
    },
    {
      key: 'employment',
      label: (
        <span>
          <SolutionOutlined />
          {t('myInfo:tabTitles.employment', 'Employment')}
        </span>
      ),
      children: (
        <>
          {/* Card 4: Employment Information */}
          <Card title={t('myInfo:sectionTitles.employment')} className={styles.infoCard}>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label={t('employee:department')}>{employee.departmentName || getLookupDisplayName(employee.department_id, departments)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:personnelCategory')}>{employee.personnelCategoryName || getLookupDisplayName(employee.personnel_category_id, personnelCategories)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:actualPosition')}>{employee.actual_position_name || getLookupDisplayName(employee.actual_position_id, actualPositions)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:hireDate')}>{employee.hire_date ? String(employee.hire_date) : ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:probationEndDate')}>{employee.probationEndDate ? String(employee.probationEndDate) : ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:employmentType')}>{getLookupDisplayName(employee.employment_type_lookup_value_id, employmentTypes)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:status')}>{getLookupDisplayName(employee.status_lookup_value_id, employeeStatuses)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:reportsTo')}>{getLookupDisplayName(employee.reports_to_employee_id /*, employees - if fetched for manager name lookup */)}</Descriptions.Item>
              <Descriptions.Item label={t('employee:workLocation')} span={1}>{employee.workLocation || ''}</Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )
    },
    {
      key: 'financialOther',
      label: (
        <span>
          <WalletOutlined />
          {t('myInfo:tabTitles.financialOther', 'Financial & Other')}
        </span>
      ),
      children: (
        <>
          {/* Card 5: Bank Information */}
          <Card title={t('myInfo:sectionTitles.bank')} className={styles.infoCard}>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label={t('employee:bankName')} span={1}>{employee.bank_name || ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:bankAccountNumber')} span={1}>{employee.bank_account_number || ''}</Descriptions.Item>
            </Descriptions>
          </Card>
          
          {/* Card 6: Emergency Contact */}
          <Card title={t('myInfo:sectionTitles.emergency')} className={styles.infoCard}>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label={t('employee:emergencyContactName')}>{employee.emergency_contact_name || ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:emergencyContactPhone')}>{employee.emergency_contact_phone || ''}</Descriptions.Item>
              <Descriptions.Item label={t('employee:emergencyContactRelation')} span={1}>{employee.emergencyContactRelation || ''}</Descriptions.Item>
            </Descriptions>
          </Card>
          
          {employee.notes && (
            <Card title={t('employee.notes')} className={styles.infoCard}>
              <Text>{employee.notes}</Text>
            </Card>
          )}
        </>
      )
    }
  ];

  const renderEmployeeDetails = () => {
    if (!employee) return null;

    return (
      <>
        {/* Card 1: Employee Overview - Stays above Tabs */}
        <Card className={styles.overviewCard}>
          <div className={styles.overviewHeader}>
            <Avatar size={64} src={employee.avatar} icon={<UserOutlined />} className={styles.overviewAvatar} />
            <div className={styles.overviewInfo}>
              <Title level={4} className={styles.overviewName}>
                <EmployeeName employeeId={employee.id} showId={false} />
              </Title>
              <Text type="secondary" className={styles.overviewId}>
                {t('myInfo:employeeIdLabel', 'Employee ID')}: {employee.employee_code || employee.id}
              </Text>
              {currentUserForDisplay?.username && (
                 <Text type="secondary" className={styles.overviewUsername}>
                   {t('myInfo:usernameLabel', 'Username')}: {currentUserForDisplay.username}
                 </Text>
              )}
            </div>
          </div>
        </Card>
        <UnifiedTabs items={tabItems} type="card" className={styles.detailsTabs} />
      </>
    );
  };

  return (
    <StandardDetailPageTemplate
      pageTitleKey="pageTitle:my_info"
      isLoading={loading}
      error={error}
      data={employee}
      breadcrumbs={[
        { key: 'home', title: <HomeOutlined />, path: '/' },
        { key: 'my-info', title: t('pageTitle:my_info') },
      ]}
    >
      {renderEmployeeDetails()}
    </StandardDetailPageTemplate>
  );
};

export default MyInfoPage;