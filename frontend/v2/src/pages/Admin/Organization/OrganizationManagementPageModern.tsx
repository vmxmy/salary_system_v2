import React, { useState } from 'react';
import { Space } from 'antd';
import {
  TeamOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  SettingOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// 现代化组件
import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';

// 子页面组件
import DepartmentManagementPageV2 from './DepartmentManagementPageV2';
import PersonnelCategoriesPageV2 from './PersonnelCategoriesPageV2';
import JobPositionLevelPageV2 from './JobPositionLevelPageV2';
import ActualPositionPageV2 from './ActualPositionPageV2';

/**
 * 现代化组织架构管理页面
 * 使用统一的现代化设计系统
 */
const OrganizationManagementPageModern: React.FC = () => {
  const { t } = useTranslation(['organization', 'common', 'admin']);
  const [activeTab, setActiveTab] = useState('departments');

  // Tab 配置
  const tabItems = [
    {
      key: 'departments',
      label: (
        <Space>
          <BankOutlined />
          {t('organization:departmentManagement', '部门管理')}
        </Space>
      ),
      children: <DepartmentManagementPageV2 />,
    },
    {
      key: 'personnel-categories',
      label: (
        <Space>
          <TeamOutlined />
          {t('organization:personnelCategories', '人员身份管理')}
        </Space>
      ),
      children: <PersonnelCategoriesPageV2 />,
    },
    {
      key: 'job-levels',
      label: (
        <Space>
          <BranchesOutlined />
          {t('organization:jobLevels', '职务级别管理')}
        </Space>
      ),
      children: <JobPositionLevelPageV2 />,
    },
    {
      key: 'actual-positions',
      label: (
        <Space>
          <ApartmentOutlined />
          {t('organization:actualPositions', '实际任职管理')}
        </Space>
      ),
      children: <ActualPositionPageV2 />,
    },
  ];

  // 页面头部额外内容
  const headerExtra = (
    <Space>
      <span className="typography-caption text-tertiary d-flex items-center gap-2">
        <SettingOutlined />
        {t('admin:modernInterface', '现代化管理界面')}
      </span>
    </Space>
  );

  // 面包屑导航
  const breadcrumbItems = [
    { title: t('common:home'), href: '/' },
    { title: t('admin:adminManagement', '系统管理'), href: '/admin' },
    { title: t('organization:organizationManagement', '组织架构管理') },
  ];

  return (
    <ModernPageTemplate
      title={t('organization:organizationManagement', '组织架构管理')}
      subtitle={t('organization:organizationManagementDescription', '统一管理人员身份、职务级别和实际任职信息')}
      headerExtra={headerExtra}
      showBreadcrumb
      breadcrumbItems={breadcrumbItems}
    >
      {/* 管理选项卡 */}
      <ModernCard>
        <div className="modern-tabs-container">
          {/* Tab 导航 */}
          <div className="modern-tab-nav mb-6">
            <div className="d-flex gap-2 flex-wrap">
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    modern-tab-button px-4 py-3 rounded-lg border transition-all duration-200
                    ${activeTab === tab.key 
                      ? 'bg-primary-50 border-primary-500 text-primary-600 font-medium' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary-300'
                    }
                  `}
                  style={{
                    borderColor: activeTab === tab.key ? '#3b82f6' : '#e5e7eb',
                    backgroundColor: activeTab === tab.key ? '#eff6ff' : '#ffffff',
                    color: activeTab === tab.key ? '#2563eb' : '#6b7280',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab 内容 */}
          <div className="modern-tab-content">
            {tabItems.find(tab => tab.key === activeTab)?.children}
          </div>
        </div>
      </ModernCard>

      {/* 添加自定义样式 */}
      <style>{`
        .modern-tab-button {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          font-family: 'Noto Serif SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.0, 0.0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .modern-tab-button:hover {
          background: #f9fafb;
          border-color: #93c5fd;
          color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        
        .modern-tab-content {
          min-height: 400px;
        }
        
        @media (max-width: 768px) {
          .modern-tab-nav {
            margin-bottom: 16px;
          }
          
          .modern-tab-button {
            padding: 12px 16px;
            font-size: 13px;
          }
        }
      `}</style>
    </ModernPageTemplate>
  );
};

export default OrganizationManagementPageModern;