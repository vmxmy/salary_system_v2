import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, App, Switch, Card, Typography, Space, Row, Col } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectChatbotFullConfig,
  selectChatbotIsEnabled,
  updateChatbotConfig,
  setChatbotEnabled,
  initialChatbotConfig,
} from '../../../store/chatbotConfigSlice';
import type { ChatbotConfig } from '../../../store/chatbotConfigSlice';
import type { RootState, AppDispatch } from '../../../store';
import styles from './ChatbotSettingsTab.module.less'; // 导入样式

const { Title, Text } = Typography;
const { TextArea } = Input;

const ChatbotSettingsTab: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch: AppDispatch = useDispatch();
  const { t } = useTranslation(['admin', 'common']); // Ensure 'common' namespace is included if translations are there

  // const chatbotConfig = useSelector((state: RootState) => selectChatbotFullConfig(state) || initialChatbotConfig);
  // const chatbotIsEnabled = useSelector((state: RootState) => selectChatbotIsEnabled(state) as boolean);
  const chatbotConfig = initialChatbotConfig; // 临时使用默认配置
  const chatbotIsEnabled = false; // 临时禁用chatbot

  useEffect(() => {
    // Set form fields only if chatbotConfig is available
    if (chatbotConfig) {
      form.setFieldsValue({
        token: chatbotConfig.token,
        baseUrl: chatbotConfig.baseUrl,
        customCss: chatbotConfig.customCss,
        customJs: chatbotConfig.customJs,
        systemVariables: JSON.stringify(chatbotConfig.systemVariables || [], null, 2),
      });
    }
  }, [chatbotConfig, form]);

  const { message } = App.useApp(); // 使用 App.useApp() 获取 message 实例

  const handleSave = async (values: any) => {
    try {
      let systemVariablesArray = [];
      if (values.systemVariables) {
        try {
          systemVariablesArray = JSON.parse(values.systemVariables);
          if (!Array.isArray(systemVariablesArray)) {
            throw new Error(t('admin:auto_system_variables__json___537973'));
          }
        } catch (e: any) {
          message.error(t('admin:auto_system_variables__e_message__537973', { message: e.message })); // Pass message to translation
          return;
        }
      }

      const configToSave: Partial<ChatbotConfig> = {
        token: values.token,
        baseUrl: values.baseUrl,
        customCss: values.customCss,
        customJs: values.customJs,
        systemVariables: systemVariablesArray,
      };

      dispatch(updateChatbotConfig(configToSave));
      message.success(t('admin:auto_ai___414920')); // "AI 机器人配置已保存"
    } catch (error) {
      message.error(t('admin:auto___e4bf9d')); // "保存失败"
    }
  };

  const handleIsEnabledChange = (checked: boolean) => {
    dispatch(setChatbotEnabled(checked));
    message.info(
      t(checked ? 'admin:ai_enabled_message' : 'admin:ai_disabled_message', {
        defaultValue: `AI 机器人已 ${checked ? '启用' : '禁用'}`, // Fallback text for translation
      })
    );
  };

  // Initial form values are now directly taken from chatbotConfig with a fallback
  // This removes the need for a separate initialFormValues constant.

  return (
    <Card variant="borderless">
      <Title level={4} className={styles.tabTitle}>{t('admin:chatbot_settings_title', 'AI 聊天机器人设置')}</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          token: chatbotConfig.token,
          baseUrl: chatbotConfig.baseUrl,
          customCss: chatbotConfig.customCss,
          customJs: chatbotConfig.customJs,
          systemVariables: JSON.stringify(chatbotConfig.systemVariables || [], null, 2),
        }}
        colon={false}
      >
        <Form.Item>
          <Row align="middle" gutter={16}>
            <Col>
              <Text className={styles.inlineMiddle}>{t('admin:enable_ai_chatbot', '启用 AI 机器人')}</Text>
            </Col>
            <Col>
              <Switch checked={!!chatbotIsEnabled} onChange={handleIsEnabledChange} className={styles.inlineMiddle} />
            </Col>
          </Row>
        </Form.Item>

        <Title level={5} className={styles.sectionTitle}>{t('admin:main_configuration', '主要配置')}</Title>
        <Form.Item
          name="token"
          label="Token"
          rules={[{ required: true, message: t('admin:token_required', '请输入 Token') }]}
          tooltip={t('admin:token_tooltip', 'Dify.AI API Token')}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="baseUrl"
          label="Base URL"
          rules={[{ required: true, message: t('admin:base_url_required', '请输入 Base URL') }]}
          tooltip={t('admin:base_url_tooltip', 'Dify.AI URL (e.g., http://dify.example.com)')}
        >
          <Input />
        </Form.Item>

        <Title level={5} className={styles.sectionTitle}>{t('admin:customization', '自定义')}</Title>
        <Form.Item
          name="customCss"
          label={t('admin:custom_css_label')}
          tooltip={t('admin:custom_css_tooltip', '用于自定义 AI 聊天机器人界面的 CSS 样式')}
        >
          <TextArea
            rows={6}
            placeholder={t(
              'admin:custom_css_placeholder',
              '.dify-chatbot-bubble-button { background-color: #1c64f2 !important; }\n.dify-chatbot-bubble-window { width: 24rem !important; height: 40rem !important; }'
            )}
          />
        </Form.Item>
        <Form.Item
          name="customJs"
          label={t('admin:custom_js_label')}
          tooltip={t('admin:custom_js_tooltip', '用于自定义 AI 聊天机器人行为的 JavaScript 代码')}
        >
          <TextArea rows={6} placeholder={t('admin:custom_js_placeholder')} />
        </Form.Item>
        <Form.Item
          name="systemVariables"
          label={t('admin:system_variables_label')}
          tooltip={t('admin:system_variables_tooltip', '用于传递给 AI 聊天机器人的 JSON 格式系统变量')}
        >
          <TextArea rows={4} placeholder='[ { "key": "variable_name", "value_type": "string", "value": "variable_value" } ]' />
        </Form.Item>

        <Form.Item className={styles.saveButtonFormItem}>
          <Button type="primary" htmlType="submit">
            {t('common:button.save_config', '保存配置')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ChatbotSettingsTab;