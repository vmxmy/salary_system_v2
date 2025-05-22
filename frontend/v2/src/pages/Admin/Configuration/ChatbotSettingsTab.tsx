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
            throw new Error('System Variables 必须是一个 JSON 数组。');
          }
        } catch (e: any) {
          message.error(`System Variables 格式无效: ${e.message}`);
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
      message.success('AI 机器人配置已保存!');
    } catch (error) {
      console.error('[ChatbotSettingsTab-Redux-DEBUG] 保存配置失败:', error);
      message.error('保存配置失败。');
    }
  };

  const handleIsEnabledChange = (checked: boolean) => {
    console.log('[ChatbotSettingsTab-Redux-DEBUG] handleIsEnabledChange called with checked:', checked);
    dispatch(setChatbotEnabled(checked));
    message.info(`AI 机器人已 ${checked ? '启用' : '禁用'}`);
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
        <Form.Item name="token" label="Token" rules={[{ required: true, message: '请输入 Token' }]} tooltip="Dify 服务提供的 API Token">
          <Input />
        </Form.Item>
        <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true, message: '请输入 Base URL' }]} tooltip="Dify 服务的基础 URL, 例如: http://dify.example.com">
          <Input />
        </Form.Item>

        <Title level={5} className={styles.sectionTitle}>自定义</Title> {/* 应用样式 */}
        <Form.Item name="customCss" label="自定义 CSS" tooltip="用于调整机器人聊天气泡和窗口样式的 CSS 代码">
          <TextArea rows={6} placeholder={`/* 示例 */\n#dify-chatbot-bubble-button {\n  background-color: #1C64F2 !important;\n}\n#dify-chatbot-bubble-window {\n  width: 24rem !important;\n  height: 40rem !important;\n}`}/>
        </Form.Item>
        <Form.Item name="customJs" label="自定义 JS" tooltip="用于调整机器人脚本行为的 JavaScript 代码">
          <TextArea rows={6} placeholder="输入自定义 JavaScript 代码。注意：此功能可能影响机器人行为，请谨慎使用。"/>
        </Form.Item>
        <Form.Item name="systemVariables" label="系统变量 (JSON格式)" tooltip="传递给机器人的额外系统级变量，必须是有效的 JSON 字符串">
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