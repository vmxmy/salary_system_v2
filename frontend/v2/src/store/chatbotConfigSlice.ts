import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 定义 ChatbotConfig 接口，与之前 Zustand store 中的保持一致
export interface ChatbotConfig {
  token: string;
  baseUrl?: string;
  scriptSrc: string;
  scriptId: string;
  customCss?: string;
  customJs?: string;
  systemVariables?: Array<{ key: string; value_type: string; value: any; label?: string }>;
  isEnabled?: boolean; // isEnabled 也在 config 内部，用于 initialChatbotConfig
}

export const initialChatbotConfig: ChatbotConfig = {
  token: 'hMAF064QpYeYtSHm',
  baseUrl: 'https://proxy-llm.1024paas.com/v1',
  scriptSrc: 'https://cdn.dify.ai/embed-chatbot/embed.min.js',
  scriptId: 'hMAF064QpYeYtSHm',
  customCss: '',
  customJs: '',
  isEnabled: true,
  systemVariables: [
    { key: 'scene', value_type: 'string', value: 'general', label: '对话场景' },
    { key: 'lib_search_topk', value_type: 'number', value: 3, label: '知识库检索TopK' },
  ],
};

export interface ChatbotSliceState { // 重命名 State 接口以避免与 ChatbotConfig 混淆
  config: ChatbotConfig;
  isEnabled: boolean;       // 这个 isEnabled 是顶层的，用于控制机器人是否启用
  isConfigured: boolean;
  isLoading: boolean;
}

const initialState: ChatbotSliceState = {
  config: initialChatbotConfig,
  isEnabled: initialChatbotConfig.isEnabled !== undefined ? initialChatbotConfig.isEnabled : true,
  isConfigured: !!(initialChatbotConfig.token && initialChatbotConfig.scriptSrc),
  isLoading: true, 
};

const chatbotConfigSlice = createSlice({
  name: 'chatbotConfig',
  initialState,
  reducers: {
    setHydratedChatbotState: (state, action: PayloadAction<ChatbotSliceState>) => {
      console.log('[Redux-chatbotConfigSlice] setHydratedChatbotState called with:', action.payload);
      state.config = action.payload.config;
      state.isEnabled = action.payload.isEnabled;
      state.isConfigured = action.payload.isConfigured;
      state.isLoading = false; 
      console.log('[Redux-chatbotConfigSlice] setHydratedChatbotState - state.isLoading is now:', state.isLoading);
    },
    setInitialChatbotState: (state) => {
      console.log('[Redux-chatbotConfigSlice] setInitialChatbotState called. Resetting to default.');
      state.config = initialChatbotConfig;
      state.isEnabled = initialChatbotConfig.isEnabled !== undefined ? initialChatbotConfig.isEnabled : true;
      state.isConfigured = !!(initialChatbotConfig.token && initialChatbotConfig.scriptSrc);
      state.isLoading = false; 
      console.log('[Redux-chatbotConfigSlice] setInitialChatbotState - state.isLoading is now:', state.isLoading);
    },
    updateChatbotConfig: (state, action: PayloadAction<Partial<ChatbotConfig>>) => {
      console.log('[Redux-chatbotConfigSlice] updateChatbotConfig called with:', action.payload);
      state.config = { ...state.config, ...action.payload };
      state.isConfigured = !!(state.config.token && state.config.scriptSrc);
    },
    setChatbotEnabled: (state, action: PayloadAction<boolean>) => {
      console.log('[Redux-chatbotConfigSlice] setChatbotEnabled called with:', action.payload);
      state.isEnabled = action.payload;
    },
  },
});

export const {
  setHydratedChatbotState,
  setInitialChatbotState,
  updateChatbotConfig,
  setChatbotEnabled,
} = chatbotConfigSlice.actions;

export default chatbotConfigSlice.reducer;

// Selectors - 确保 RootState 类型与 store 配置一致
// 我们假设 RootState 会有一个 chatbotConfig 字段指向这个 slice 的状态
interface RootStateForSelectors {
  chatbotConfig: ChatbotSliceState;
}

export const selectChatbotFullConfig = (state: RootStateForSelectors) => state.chatbotConfig.config;
export const selectChatbotIsEnabled = (state: RootStateForSelectors) => state.chatbotConfig.isEnabled;
export const selectChatbotIsConfigured = (state: RootStateForSelectors) => state.chatbotConfig.isConfigured;
export const selectChatbotIsLoading = (state: RootStateForSelectors) => state.chatbotConfig.isLoading;
export const selectChatbotToken = (state: RootStateForSelectors) => state.chatbotConfig.config.token;
export const selectChatbotBaseUrl = (state: RootStateForSelectors) => state.chatbotConfig.config.baseUrl;
export const selectChatbotScriptSrc = (state: RootStateForSelectors) => state.chatbotConfig.config.scriptSrc;
export const selectChatbotScriptId = (state: RootStateForSelectors) => state.chatbotConfig.config.scriptId;
export const selectChatbotCustomCss = (state: RootStateForSelectors) => state.chatbotConfig.config.customCss;
export const selectChatbotCustomJs = (state: RootStateForSelectors) => state.chatbotConfig.config.customJs;
export const selectChatbotSystemVariables = (state: RootStateForSelectors) => state.chatbotConfig.config.systemVariables; 