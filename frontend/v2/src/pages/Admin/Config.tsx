import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Typography } from 'antd';
import UnifiedTabs from '../../components/common/UnifiedTabs';
import ChatbotSettingsTab from './Configuration/ChatbotSettingsTab'; // 确保路径正确
import styles from './Config.module.less'; // 导入样式

const { Title } = Typography;

const ConfigPage: React.FC = () => {
  const { t } = useTranslation('admin'); // 假设翻译文件是 admin.json 或类似

  // 定义 Tabs 的 items 属性
  const tabItems = [
    {
      key: 'chatbot',
      label: t('configpage.tabs.chatbot', {t('admin:auto_ai__414920')}),
      children: <ChatbotSettingsTab />
    },
    /*
    {
      key: 'general',
      label: t('configpage.tabs.general', {t('admin:auto_text_e9809a')}),
      children: <div>这里是通用设置的内容...</div>
    },
    {
      key: 'notifications',
      label: t('configpage.tabs.notifications', {t('admin:auto_text_e9809a')}),
      children: <div>这里是通知设置的内容...</div>
    }
    */
  ];

  return (
    <div className={styles.configPageContainer}> {/* 应用样式 */}
      <Title level={2} className={styles.configPageTitle}> {/* 应用样式 */}
        {t('configpage.title', {t('admin:auto_text_e7b3bb')})}
      </Title>
      <Card>
        <UnifiedTabs 
          type="line" 
          size="large"
          items={tabItems}
          defaultActiveKey="chatbot"
        />
      </Card>
    </div>
  );
};

export default ConfigPage;