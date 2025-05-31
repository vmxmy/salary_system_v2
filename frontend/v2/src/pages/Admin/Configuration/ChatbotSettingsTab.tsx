import React, { useEffect } from 'react';
import { Form, Input, Button, App, Switch, Card, Typography, Space, Row, Col } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectChatbotFullConfig,
  selectChatbotIsEnabled,
  updateChatbotConfig,
  setChatbotEnabled,
  initialChatbotConfig,
} from '../../../store/chatbotConfigSlice';
import type { ChatbotConfig, ChatbotSliceState } from '../../../store/chatbotConfigSlice';
import type { RootState, AppDispatch } from '../../../store';
import styles from './ChatbotSettingsTab.module.less'; // 导入样式

const { Title, Text } = Typography;
const { TextArea } = Input;

// 建议：如果项目中重复使用某些间距或样式，可以定义成 CSS 类
// 例如：.mb-24 { margin-bottom: 24px; } .mt-20 { margin-top: 20px; }

const ChatbotSettingsTab: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch: AppDispatch = useDispatch();

  const chatbotConfig = useSelector((state: RootState) => selectChatbotFullConfig(state)) || initialChatbotConfig;
  const chatbotIsEnabled = useSelector((state: RootState) => selectChatbotIsEnabled(state)) as boolean;

  useEffect(() => {
    console.log('[ChatbotSettingsTab-Redux-DEBUG] useEffect triggered. Current config from Redux:', chatbotConfig);
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
    console.log('[ChatbotSettingsTab-Redux-DEBUG] handleSave called with form values:', values);
    try {
      let systemVariablesArray = [];
      if (values.systemVariables) {
        try {
          systemVariablesArray = JSON.parse(values.systemVariables);
          if (!Array.isArray(systemVariablesArray)) {
            throw new Error({t('admin:auto_system_variables__json___537973')});
          }
        } catch (e: any) {
          message.error({t('admin:auto_system_variables__e_message__537973')});
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
      message.success({t('admin:auto_ai___414920')});
    } catch (error) {
      console.error({t('admin:auto__chatbotsettingstab_redux_debug___5b4368')}, error);
      message.error({t('admin:auto___e4bf9d')});
    }
  };

  const handleIsEnabledChange = (checked: boolean) => {
    console.log('[ChatbotSettingsTab-Redux-DEBUG] handleIsEnabledChange called with checked:', checked);
    dispatch(setChatbotEnabled(checked));
    message.info(`AI 机器人已 ${checked ? {t('admin:auto_text_e590af')} : {t('admin:auto_text_e7a681')}}`);
  };

  const initialFormValues = {
    token: (chatbotConfig || initialChatbotConfig).token,
    baseUrl: (chatbotConfig || initialChatbotConfig).baseUrl,
    customCss: (chatbotConfig || initialChatbotConfig).customCss,
    customJs: (chatbotConfig || initialChatbotConfig).customJs,
    systemVariables: JSON.stringify((chatbotConfig || initialChatbotConfig).systemVariables || [], null, 2),
  };

  return (
    // Card 的 textAlign: 'left' 通常是默认行为，如果不是，则需要全局CSS或父级强制
    <Card variant="borderless">
      {/* Title 的 textAlign: 'left' 通常是默认行为 */}
      {/* marginBottom 可以通过 ConfigProvider theme.components.Typography.titleMarginBottom 调整，或使用CSS类 */}
      <Title level={4} className={styles.tabTitle}>AI 聊天机器人设置</Title> {/* 应用样式 */}
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleSave}
        initialValues={initialFormValues}
        colon={false}
      >
        <Form.Item > 
          <Row align="middle" gutter={16}> 
            <Col>
              {/* verticalAlign 仍保留，因为它对于特定行内对齐很重要 */}
              <Text className={styles.inlineMiddle}>启用 AI 机器人</Text> {/* 应用样式 */}
            </Col>
            <Col>
              <Switch checked={!!chatbotIsEnabled} onChange={handleIsEnabledChange} className={styles.inlineMiddle}/> {/* 应用样式 */}
            </Col>
          </Row>
        </Form.Item>

        {/* marginTop 和 marginBottom 可以通过 ConfigProvider 或 CSS 类调整 */}
        <Title level={5} className={styles.sectionTitle}>主要配置</Title> {/* 应用样式 */}
        <Form.Item name="token" label="Token" rules={[{ required: true, message: {t('admin:auto__token_e8afb7')} }]} tooltip={t('admin:auto_dify__api_token_446966')}>
          <Input />
        </Form.Item>
        <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true, message: {t('admin:auto__base_url_e8afb7')} }]} tooltip={t('admin:auto_dify__url__http_dify_example_com_446966')}>
          <Input />
        </Form.Item>

        <Title level={5} className={styles.sectionTitle}>自定义</Title> {/* 应用样式 */}
        <Form.Item name="customCss" label={t('admin:auto__css_e887aa')} tooltip={t('admin:auto__css__e794a8')}>
          <TextArea rows={6} placeholder={{t('admin:auto___n_dify_chatbot_bubble_button_n_background_color_1c64f2_important_n_n_dify_chatbot_bubble_window_n_width_24rem_important_n_height_40rem_important_n__2f2a20')}}/>
        </Form.Item>
        <Form.Item name="customJs" label={t('admin:auto__js_e887aa')} tooltip={t('admin:auto__javascript__e794a8')}>
          <TextArea rows={6} placeholder={t('admin:auto__javascript______e8be93')}/>
        </Form.Item>
        <Form.Item name="systemVariables" label={t('admin:auto__json__e7b3bb')} tooltip={t('admin:auto___json__e4bca0')}>
          <TextArea rows={4} placeholder='[ { "key": "variable_name", "value_type": "string", "value": "variable_value" } ]'/>
        </Form.Item>
        
        {/* marginTop 可以通过 ConfigProvider theme.components.Form.itemMarginBottom (如果适用) 或CSS类调整 */}
        <Form.Item className={styles.saveButtonFormItem}> {/* 应用样式 */}
          <Button type="primary" htmlType="submit">
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ChatbotSettingsTab; 