import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, Form, message, Typography, Breadcrumb, Spin, Alert } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EmployeeForm from '../components/EmployeeForm';
import { employeeService } from '../../../services/employeeService';
import type { Employee, UpdateEmployeePayload, CreateEmployeePayload } from '../types'; // Import CreateEmployeePayload for casting
import { PageContainer } from '@ant-design/pro-components';
import { Link } from 'react-router-dom';

const { Title } = Typography;

const EditEmployeePage: React.FC = () => {
  const { t } = useTranslation(['employee', 'common', 'pageTitle']);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { employeeId: idFromUrl } = useParams<{ employeeId: string }>();
  const location = useLocation();
  const employeeFromState = location.state?.employeeData as Employee | undefined;

  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingData(true);
    setError(null);
    console.log('[EditEmployeePage] useEffect triggered. idFromUrl:', idFromUrl, 'employeeFromState:', employeeFromState ? `Employee ID ${employeeFromState.id}`: 'null');

    if (employeeFromState && String(employeeFromState.id) === idFromUrl) {
      console.log('[EditEmployeePage] Using employee data from route state:', employeeFromState);
      setEmployeeData(employeeFromState);
      console.log('[EditEmployeePage] employeeData from route state, to be passed as initialValues:', JSON.parse(JSON.stringify(employeeFromState)));
      setLoadingData(false);
    } else if (idFromUrl) {
      console.log(`[EditEmployeePage] Fetching employee data from API for ID: '${idFromUrl}' (Type: ${typeof idFromUrl})`);
      employeeService.getEmployeeById(idFromUrl)
        .then(data => {
          if (data) {
            setEmployeeData(data);
            console.log('[EditEmployeePage] employeeData from API, to be passed as initialValues:', JSON.parse(JSON.stringify(data)));
          } else {
            setError(t('employee:edit_page.error.employee_not_found_edit'));
            message.error(t('employee:edit_page.error.employee_not_found'));
          }
        })
        .catch(err => {
          console.error('Failed to load employee data:', err);
          console.error(`Error details for ID '${idFromUrl}':`, err.message, err.response?.data);
          setError(t('employee:edit_page.error.load_employee_failed_retry'));
          message.error(t('employee:edit_page.error.load_employee_failed'));
        })
        .finally(() => {
          setLoadingData(false);
        });
    } else {
      console.warn('[EditEmployeePage] No idFromUrl and no suitable employeeFromState. Invalid state.');
      setError(t('employee:edit_page.error.invalid_employee_id'));
      setLoadingData(false);
    }
  }, [idFromUrl, employeeFromState, t]);

  const handleUpdateEmployee = async (values: UpdateEmployeePayload) => {
    if (!idFromUrl) return;
    setSubmitting(true);
    try {
      await employeeService.updateEmployee(idFromUrl, values);
      message.success(t('employee:edit_page.message.update_success'));
      navigate(`/hr/employees/${idFromUrl}`);
    } catch (err: any) {
      console.error('Failed to update employee data:', err);
      message.error(err.response?.data?.message || t('employee:edit_page.message.update_fail_default'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip={t('employee:edit_page.spin_tip_loading_data')}><div style={{ padding: 50 }} /></Spin></div>;
  }

  if (error) {
    return <Alert message={t('employee:edit_page.alert.message_error')} description={error} type="error" showIcon style={{ margin: '24px' }} />;
  }

  if (!employeeData) {
    return <Alert message={t('employee:edit_page.alert.message_info')} description={t('employee:edit_page.alert.description_no_data_to_edit')} type="info" showIcon style={{ margin: '24px' }} />;
  }

  // Log employeeData before constructing employeeDisplayName
  console.log('[EditEmployeePage] employeeData received for display name construction:', JSON.parse(JSON.stringify(employeeData)));
  console.log('[EditEmployeePage] employeeData.first_name:', employeeData.first_name);
  console.log('[EditEmployeePage] employeeData.last_name:', employeeData.last_name);

  const lastName = employeeData.last_name || '';
  const firstName = employeeData.first_name || '';
  const fullNameParts = [lastName, firstName].filter(Boolean);
  const employeeDisplayName = fullNameParts.length > 0 ? fullNameParts.join('') : t('employee:edit_page.default_employee_name', '员工');

  const breadcrumbItems = [
    { onClick: () => navigate('/'), title: <HomeOutlined /> },
    { onClick: () => navigate('/hr/employees'), title: t('pageTitle:hr_management') },
    { onClick: () => navigate('/hr/employees'), title: t('pageTitle:employee_list') },
    { title: employeeDisplayName && employeeDisplayName !== t('employee:edit_page.default_employee_name', '员工') 
        ? t('employee:edit_page.breadcrumb_title_with_name', { employeeName: employeeDisplayName })
        : t('employee:edit_page.breadcrumb_title')
    }
  ];

  return (
    <PageContainer
      title={employeeDisplayName
        ? t('employee:edit_page.title_with_name', { employeeName: employeeDisplayName })
        : t('employee:edit_page.title')
      }
      breadcrumbRender={false}
    >
      <Card>
        <EmployeeForm
          form={form}
          isEditMode={true}
          initialValues={employeeData}
          onSubmit={handleUpdateEmployee as (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>}
          onCancel={() => navigate(idFromUrl ? `/hr/employees/${idFromUrl}` : '/hr/employees')}
          loadingSubmit={submitting}
        />
      </Card>
    </PageContainer>
  );
};

export default EditEmployeePage; 