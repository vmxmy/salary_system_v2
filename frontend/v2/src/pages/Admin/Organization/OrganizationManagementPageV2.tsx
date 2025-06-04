import React, { useState } from 'react';
import { Card, Tabs, Typography, Space } from 'antd';
import {
  TeamOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  SettingOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer, ProCard } from '@ant-design/pro-components';

import DepartmentManagementPageV2 from './DepartmentManagementPageV2';
import PersonnelCategoriesPageV2 from './PersonnelCategoriesPageV2';
import JobPositionLevelPageV2 from './JobPositionLevelPageV2';
import ActualPositionPageV2 from './ActualPositionPageV2';

const { Title, Text } = Typography;

const OrganizationManagementPageV2: React.FC = () => {
  const { t } = useTranslation(['organization', 'common']);
  const [activeTab, setActiveTab] = useState('departments');

  const tabItems = [
    {
      key: 'departments',
      label: (
        <Space>
          <BankOutlined />
          部门管理
        </Space>
      ),
      children: <DepartmentManagementPageV2 />,
    },
    {
      key: 'personnel-categories',
      label: (
        <Space>
          <TeamOutlined />
          人员身份管理
        </Space>
      ),
      children: <PersonnelCategoriesPageV2 />,
    },
    {
      key: 'job-position-levels',
      label: (
        <Space>
          <BranchesOutlined />
          职务级别管理
        </Space>
      ),
      children: <JobPositionLevelPageV2 />,
    },
    {
      key: 'actual-positions',
      label: (
        <Space>
          <ApartmentOutlined />
          实际任职管理
        </Space>
      ),
      children: <ActualPositionPageV2 />,
    },
  ];

  return (
    <PageContainer
      title="组织架构管理"
      subTitle="统一管理人员身份、职务级别和实际任职信息"
      extra={[
        <Space key="extra">
          <Text type="secondary">
            <SettingOutlined /> 现代化管理界面
          </Text>
        </Space>
      ]}
    >
      <ProCard>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          tabBarStyle={{
            marginBottom: 24,
            borderBottom: '1px solid #f0f0f0'
          }}
        />
      </ProCard>
    </PageContainer>
  );
};

export default OrganizationManagementPageV2; 