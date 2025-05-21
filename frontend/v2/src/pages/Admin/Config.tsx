import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Typography } from 'antd';
import UnifiedTabs from '../../components/common/UnifiedTabs';
import ChatbotSettingsTab from './Configuration/ChatbotSettingsTab'; // 确保路径正确

const { Title } = Typography;

const ConfigPage: React.FC = () => {
  const { t } = useTranslation('admin'); // 假设翻译文件是 admin.json 或类似

  // 定义 Tabs 的 items 属性
  const tabItems = [
    {
      key: 'chatbot',
      label: t('configpage.tabs.chatbot', 'AI 聊天机器人'),
      children: <ChatbotSettingsTab />
    },
    /*
    {
      key: 'general',
      label: t('configpage.tabs.general', '通用设置'),
      children: <div>这里是通用设置的内容...</div>
    },
    {
      key: 'notifications',
      label: t('configpage.tabs.notifications', '通知设置'),
      children: <div>这里是通知设置的内容...</div>
    }
    */
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        {t('configpage.title', '系统配置')}
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