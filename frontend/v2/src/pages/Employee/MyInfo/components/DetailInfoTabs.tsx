/**
 * 员工详细信息标签页组件
 */
import React from 'react';
import { Tabs, Space, Descriptions, Card, Tag } from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  ContactsOutlined, 
  BookOutlined,
  DollarOutlined 
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDate, formatEmployeeName, maskSensitiveData, formatPhoneNumber } from '../utils/formatters';
import type { MyEmployeeInfo } from '../types/employee';
import styles from '../MyInfo.module.less';

interface DetailInfoTabsProps {
  /** 员工信息 */
  employeeInfo: MyEmployeeInfo;
  /** 是否加载中 */
  loading?: boolean;
}

const DetailInfoTabs: React.FC<DetailInfoTabsProps> = ({
  employeeInfo,
  loading = false,
}) => {
  const { t } = useTranslation(['myInfo', 'common']);

  // 基本信息标签页
  const BasicInfoTab: React.FC = () => (
    <div className={styles.infoDisplayGrid}>
      <div className={styles.infoGroup}>
        <div className={styles.groupTitle}>
          {t('tabs.basic.personalInfo')}
        </div>
        <div className={styles.groupContent}>
          <Descriptions column={1} size="middle" colon={false}>
            <Descriptions.Item label={t('fields.name')}>
              {formatEmployeeName(employeeInfo.first_name, employeeInfo.last_name)}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.employeeCode')}>
              {employeeInfo.employee_code || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.idNumber')}>
              {maskSensitiveData(employeeInfo.id_number, 'id_number')}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.gender')}>
              {employeeInfo.genderName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.dateOfBirth')}>
              {formatDate(employeeInfo.date_of_birth)}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.nationality')}>
              {employeeInfo.nationality || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.ethnicity')}>
              {employeeInfo.ethnicity || '--'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </div>
  );

  // 联系信息标签页
  const ContactInfoTab: React.FC = () => (
    <div className={styles.infoDisplayGrid}>
      <div className={styles.infoGroup}>
        <div className={styles.groupTitle}>
          {t('tabs.contact.contactInfo')}
        </div>
        <div className={styles.groupContent}>
          <Descriptions column={1} size="middle" colon={false}>
            <Descriptions.Item label={t('fields.email')}>
              {employeeInfo.email || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.phoneNumber')}>
              {formatPhoneNumber(employeeInfo.phone_number)}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.homeAddress')}>
              {employeeInfo.home_address || '--'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div className={styles.infoGroup}>
        <div className={styles.groupTitle}>
          {t('tabs.contact.emergencyContact')}
        </div>
        <div className={styles.groupContent}>
          <Descriptions column={1} size="middle" colon={false}>
            <Descriptions.Item label={t('fields.emergencyContactName')}>
              {employeeInfo.emergency_contact_name || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.emergencyContactPhone')}>
              {formatPhoneNumber(employeeInfo.emergency_contact_phone)}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </div>
  );

  // 工作信息标签页
  const WorkInfoTab: React.FC = () => (
    <div className={styles.infoDisplayGrid}>
      <div className={styles.infoGroup}>
        <div className={styles.groupTitle}>
          {t('tabs.work.currentPosition')}
        </div>
        <div className={styles.groupContent}>
          <Descriptions column={1} size="middle" colon={false}>
            <Descriptions.Item label={t('fields.department')}>
              {employeeInfo.departmentName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.position')}>
              {employeeInfo.actual_position_name || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.personnelCategory')}>
              {employeeInfo.personnelCategoryName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.employmentType')}>
              {employeeInfo.employmentTypeName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.jobPositionLevel')}>
              {employeeInfo.jobPositionLevelName || '--'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div className={styles.infoGroup}>
        <div className={styles.groupTitle}>
          {t('tabs.work.workHistory')}
        </div>
        <div className={styles.groupContent}>
          <Descriptions column={1} size="middle" colon={false}>
            <Descriptions.Item label={t('fields.hireDate')}>
              {formatDate(employeeInfo.hire_date)}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.firstWorkDate')}>
              {formatDate(employeeInfo.first_work_date)}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.currentPositionStartDate')}>
              {formatDate(employeeInfo.current_position_start_date)}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.careerPositionLevelDate')}>
              {formatDate(employeeInfo.career_position_level_date)}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.interruptedServiceYears')}>
              {employeeInfo.interrupted_service_years ? `${employeeInfo.interrupted_service_years}年` : '--'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </div>
  );

  // 教育背景标签页
  const EducationInfoTab: React.FC = () => (
    <div className={styles.infoDisplayGrid}>
      <div className={styles.infoGroup}>
        <div className={styles.groupTitle}>
          {t('tabs.education.background')}
        </div>
        <div className={styles.groupContent}>
          <Descriptions column={1} size="middle" colon={false}>
            <Descriptions.Item label={t('fields.educationLevel')}>
              {employeeInfo.educationLevelName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.maritalStatus')}>
              {employeeInfo.maritalStatusName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.politicalStatus')}>
              {employeeInfo.politicalStatusName || '--'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div className={styles.infoGroup}>
        <div className={styles.groupTitle}>
          {t('tabs.education.salaryInfo')}
        </div>
        <div className={styles.groupContent}>
          <Descriptions column={1} size="middle" colon={false}>
            <Descriptions.Item label={t('fields.salaryLevel')}>
              {employeeInfo.salaryLevelName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.salaryGrade')}>
              {employeeInfo.salaryGradeName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.refSalaryLevel')}>
              {employeeInfo.refSalaryLevelName || '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('fields.socialSecurityClientNumber')}>
              {maskSensitiveData(employeeInfo.social_security_client_number, 'social_security_client_number')}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </div>
  );

  // 标签页项目
  const tabItems = [
    {
      key: 'basic',
      label: (
        <Space>
          <UserOutlined />
          {t('tabs.basic.title')}
        </Space>
      ),
      children: <BasicInfoTab />,
    },
    {
      key: 'contact',
      label: (
        <Space>
          <PhoneOutlined />
          {t('tabs.contact.title')}
        </Space>
      ),
      children: <ContactInfoTab />,
    },
    {
      key: 'work',
      label: (
        <Space>
          <ContactsOutlined />
          {t('tabs.work.title')}
        </Space>
      ),
      children: <WorkInfoTab />,
    },
    {
      key: 'education',
      label: (
        <Space>
          <BookOutlined />
          {t('tabs.education.title')}
        </Space>
      ),
      children: <EducationInfoTab />,
    },
  ];

  return (
    <Tabs
      className={styles.detailTabs}
      items={tabItems}
      size="large"
      destroyInactiveTabPane={false}
    />
  );
};

export default DetailInfoTabs; 