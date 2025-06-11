/**
 * 员工个人信息编辑页面
 */
import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Form, Button, Space, Steps, Card, Alert, Result } from 'antd';
import { 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined, 
  ArrowLeftOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useMyEmployeeInfo } from './hooks/useMyEmployeeInfo';
import { useEmployeeUpdate } from './hooks/useEmployeeUpdate';
import { useEmployeePermissions } from '../../../hooks/useEmployeePermissions';
import { FORM_STEPS, FORM_LAYOUT } from './constants/employeeConstants.tsx';
import type { EmployeeEditFormData, FormStep } from './types/employee';
import styles from './MyInfo.module.less';

const EditMyInfoPage: React.FC = () => {
  const { t } = useTranslation(['personal', 'common']);
  const navigate = useNavigate();
  const [form] = Form.useForm<EmployeeEditFormData>();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState(false);

  // 获取数据和权限
  const { employeeInfo, isLoading, hasEmployeeInfo } = useMyEmployeeInfo();
  const { canUpdate: canEdit } = useEmployeePermissions();
  const { 
    updateEmployeeInfo, 
    isPending: isUpdating, 
    isSuccess,
    validateFormData 
  } = useEmployeeUpdate();

  // 初始化表单数据
  useEffect(() => {
    if (employeeInfo) {
      const formData: EmployeeEditFormData = {
        first_name: employeeInfo.first_name || '',
        last_name: employeeInfo.last_name || '',
        date_of_birth: employeeInfo.date_of_birth ? dayjs(employeeInfo.date_of_birth) : undefined,
        gender_lookup_value_id: employeeInfo.gender_lookup_value_id,
        id_number: employeeInfo.id_number || '',
        nationality: employeeInfo.nationality || '',
        ethnicity: employeeInfo.ethnicity || '',
        email: employeeInfo.email || '',
        phone_number: employeeInfo.phone_number || '',
        home_address: employeeInfo.home_address || '',
        emergency_contact_name: employeeInfo.emergency_contact_name || '',
        emergency_contact_phone: employeeInfo.emergency_contact_phone || '',
        department_id: employeeInfo.department_id,
        personnel_category_id: employeeInfo.personnel_category_id,
        actual_position_id: employeeInfo.actual_position_id,
        employment_type_lookup_value_id: employeeInfo.employment_type_lookup_value_id,
        job_position_level_lookup_value_id: employeeInfo.job_position_level_lookup_value_id,
        hire_date: employeeInfo.hire_date ? dayjs(employeeInfo.hire_date) : undefined,
        first_work_date: employeeInfo.first_work_date ? dayjs(employeeInfo.first_work_date) : undefined,
        current_position_start_date: employeeInfo.current_position_start_date ? dayjs(employeeInfo.current_position_start_date) : undefined,
        career_position_level_date: employeeInfo.career_position_level_date ? dayjs(employeeInfo.career_position_level_date) : undefined,
        interrupted_service_years: employeeInfo.interrupted_service_years,
        education_level_lookup_value_id: employeeInfo.education_level_lookup_value_id,
        marital_status_lookup_value_id: employeeInfo.marital_status_lookup_value_id,
        political_status_lookup_value_id: employeeInfo.political_status_lookup_value_id,
        salary_level_lookup_value_id: employeeInfo.salary_level_lookup_value_id,
        salary_grade_lookup_value_id: employeeInfo.salary_grade_lookup_value_id,
        ref_salary_level_lookup_value_id: employeeInfo.ref_salary_level_lookup_value_id,
        social_security_client_number: employeeInfo.social_security_client_number || '',
      };
      
      form.setFieldsValue(formData);
    }
  }, [employeeInfo, form]);

  // 处理表单变化
  const handleValuesChange = () => {
    setHasChanges(true);
  };

  // 处理步骤切换
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  // 处理取消
  const handleCancel = () => {
    if (hasChanges) {
      // 可以添加确认对话框
      navigate('/employee-info/my-info');
    } else {
      navigate('/employee-info/my-info');
    }
  };

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证表单数据
      const { isValid, errors } = validateFormData(values);
      if (!isValid) {
        Alert.error({
          title: t('personal:editForm.validation.error'),
          content: errors.join('; '),
        });
        return;
      }

      await updateEmployeeInfo(values);
      
      // 成功后导航回主页
      setTimeout(() => {
        navigate('/employee-info/my-info');
      }, 1500);
      
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 权限检查
  if (!canEdit) {
    return (
      <PageContainer>
        <Result
          status="403"
          title={t('personal:editForm.error.noPermission')}
          subTitle={t('personal:editForm.error.noPermissionDesc')}
          extra={
            <Button type="primary" onClick={() => navigate('/employee-info/my-info')}>
              {t('common:button.back')}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // 成功状态
  if (isSuccess) {
    return (
      <PageContainer>
        <Result
          status="success"
          title={t('personal:editForm.success.title')}
          subTitle={t('personal:editForm.success.description')}
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          extra={[
            <Button type="primary" onClick={() => navigate('/employee-info/my-info')}>
              {t('personal:editForm.success.viewInfo')}
            </Button>
          ]}
        />
      </PageContainer>
    );
  }

  // 渲染表单内容
  const renderFormContent = () => {
    const currentStepConfig = FORM_STEPS[currentStep];
    
    return (
      <div className={styles.editFormContainer}>
        {/* 步骤指示器 */}
        <Steps
          current={currentStep}
          onChange={handleStepChange}
          className={styles.formSteps}
          items={FORM_STEPS.map(step => ({
            title: t(step.title),
            description: t(step.description),
            icon: step.icon,
          }))}
        />

        {/* 表单内容 */}
        <Card className={styles.formContent}>
          <Form
            form={form}
            {...FORM_LAYOUT}
            onValuesChange={handleValuesChange}
            disabled={isUpdating}
          >
            {/* 这里需要根据当前步骤渲染不同的表单组件 */}
            {/* 由于文件行数限制，这里先显示一个占位符 */}
            <div style={{ minHeight: 400, padding: 24, textAlign: 'center' }}>
              <h3>{t(currentStepConfig.title)}</h3>
              <p>{t(currentStepConfig.description)}</p>
              <p>表单组件将在后续步骤中实现</p>
            </div>
          </Form>
        </Card>

        {/* 操作按钮 */}
        <div className={styles.formActions}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleCancel}
              disabled={isUpdating}
            >
              {t('common:button.cancel')}
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              loading={isUpdating}
              onClick={handleSave}
            >
              {t('common:button.save')}
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  return (
    <PageContainer
      title={
        <Space>
          <EditOutlined />
          {t('personal:editForm.title')}
        </Space>
      }
      subTitle={t('personal:editForm.subtitle')}
      loading={isLoading}
      extra={[
        <Button 
          key="cancel"
          icon={<CloseOutlined />}
          onClick={handleCancel}
          disabled={isUpdating}
        >
          {t('common:button.cancel')}
        </Button>
      ]}
    >
      {!hasEmployeeInfo ? (
        <Result
          status="error"
          title={t('personal:editForm.error.noData')}
          extra={
            <Button type="primary" onClick={() => navigate('/employee-info/my-info')}>
              {t('common:button.back')}
            </Button>
          }
        />
      ) : (
        renderFormContent()
      )}
    </PageContainer>
  );
};

export default EditMyInfoPage; 