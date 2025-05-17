import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, message, Typography, Breadcrumb, Spin, Alert } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EmployeeForm from '../components/EmployeeForm';
import { employeeService } from '../../../services/employeeService';
import type { Employee, UpdateEmployeePayload, CreateEmployeePayload } from '../types'; // Import CreateEmployeePayload for casting
import { PageContainer } from '@ant-design/pro-components';

const { Title } = Typography;

const EditEmployeePage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();

  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      setLoadingData(true);
      setError(null);
      employeeService.getEmployeeById(employeeId)
        .then(data => {
          if (data) {
            setEmployeeData(data);
          } else {
            setError(t('edit_employee_page.error_employee_not_found_edit'));
            message.error(t('edit_employee_page.error_employee_not_found'));
          }
        })
        .catch(err => {
          console.error('Failed to load employee data:', err);
          setError(t('edit_employee_page.error_load_employee_failed_retry'));
          message.error(t('edit_employee_page.error_load_employee_failed'));
        })
        .finally(() => {
          setLoadingData(false);
        });
    } else {
      setError(t('edit_employee_page.error_invalid_employee_id'));
      setLoadingData(false);
    }
  }, [employeeId, t]);

  const handleUpdateEmployee = async (values: UpdateEmployeePayload) => {
    if (!employeeId) return;
    setSubmitting(true);
    try {
      await employeeService.updateEmployee(employeeId, values);
      message.success(t('edit_employee_page.message_update_success'));
      navigate(`/hr/employees/${employeeId}`);
    } catch (err: any) {
      console.error('Failed to update employee data:', err);
      message.error(err.response?.data?.message || t('edit_employee_page.message_update_fail_default'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip={t('edit_employee_page.spin_tip_loading_data')} /></div>;
  }

  if (error) {
    return <Alert message={t('edit_employee_page.alert_message_error')} description={error} type="error" showIcon style={{ margin: '24px' }} />;
  }

  if (!employeeData) {
    return <Alert message={t('edit_employee_page.alert_message_info')} description={t('edit_employee_page.alert_description_no_data_to_edit')} type="info" showIcon style={{ margin: '24px' }} />;
  }

  const employeeDisplayName = (employeeData.first_name || employeeData.last_name) ?
    [`${employeeData.first_name || ''}`, `${employeeData.last_name || ''}`].filter(Boolean).join(' ')
    : null; // Use null if no name parts found

  const breadcrumbItems = [
    { onClick: () => navigate('/'), title: <HomeOutlined /> },
    { onClick: () => navigate('/hr/employees'), title: t('page_title.hr_management') },
    { onClick: () => navigate('/hr/employees'), title: t('page_title.employee_list') },
    { title: employeeDisplayName ? t('edit_employee_page.breadcrumb_title_edit_employee_name', { name: employeeDisplayName }) : t('edit_employee_page.breadcrumb_title_edit_employee') }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }} items={breadcrumbItems} />
      <Title level={3} style={{ marginBottom: '24px' }}>
        {employeeDisplayName ? t('edit_employee_page.page_title_edit_employee_name', { name: employeeDisplayName }) : t('edit_employee_page.page_title_edit_employee')}
      </Title>
      <Card>
        <EmployeeForm
          form={form}
          isEditMode={true}
          initialValues={employeeData}
          onSubmit={handleUpdateEmployee as (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>}
          onCancel={() => navigate(employeeId ? `/hr/employees/${employeeId}` : '/hr/employees')}
          loadingSubmit={submitting}
        />
      </Card>
    </div>
  );
};

export default EditEmployeePage; 