import React, { useState } from 'react';
import { Card, Tabs, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import AttendancePeriodManager from '../components/AttendancePeriodManager';
import AttendanceRecordManager from '../components/AttendanceRecordManager';
import DailyAttendanceManager from '../components/DailyAttendanceManager';
import AttendanceRuleManager from '../components/AttendanceRuleManager';

const { Title } = Typography;
const { TabPane } = Tabs;

const AttendanceManagementPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [activeTab, setActiveTab] = useState('periods');

  const tabItems = [
    {
      key: 'periods',
      label: (
        <span>
          <CalendarOutlined />
          {t('payroll:attendance_periods')}
        </span>
      ),
      children: <AttendancePeriodManager />,
    },
    {
      key: 'records',
      label: (
        <span>
          <UserOutlined />
          {t('payroll:attendance_records')}
        </span>
      ),
      children: <AttendanceRecordManager />,
    },
    {
      key: 'daily',
      label: (
        <span>
          <ClockCircleOutlined />
          {t('payroll:daily_attendance')}
        </span>
      ),
      children: <DailyAttendanceManager />,
    },
    {
      key: 'rules',
      label: (
        <span>
          <SettingOutlined />
          {t('payroll:attendance_rules')}
        </span>
      ),
      children: <AttendanceRuleManager />,
    },
  ];

  return (
    <div className="attendance-management-page">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            {t('payroll:attendance_management')}
          </Title>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default AttendanceManagementPage; 