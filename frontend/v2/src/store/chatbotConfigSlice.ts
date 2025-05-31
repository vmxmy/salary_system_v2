import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 定义 ChatbotConfig 接口，与之前 Zustand store 中的保持一致
export interface ChatbotConfig {
  token: string;
  baseUrl?: string;
  customCss?: string;
  customJs?: string;
  systemVariables?: Array<{ key: string; value_type: string; value: any; label?: string }>;
  isEnabled?: boolean; // isEnabled 也在 config 内部，用于 initialChatbotConfig
}

export const initialChatbotConfig: ChatbotConfig = {
  token: import.meta.env.VITE_DIFY_TOKEN || '',
  baseUrl: import.meta.env.VITE_DIFY_BASE_URL || '',
  customCss: '',
  customJs: '',
  isEnabled: true,
  systemVariables: [
    { key: 'scene', value_type: 'string', value: 'general', label: {t('common:auto_text_e5afb9')} },
    { key: 'lib_search_topk', value_type: 'number', value: 3, label: {t('common:auto_topk_e79fa5')} },
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
  isConfigured: !!(initialChatbotConfig.token),
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
      state.isConfigured = !!(initialChatbotConfig.token);
      state.isLoading = false; 
      console.log('[Redux-chatbotConfigSlice] setInitialChatbotState - state.isLoading is now:', state.isLoading);
    },
    updateChatbotConfig: (state, action: PayloadAction<Partial<ChatbotConfig>>) => {
      console.log('[Redux-chatbotConfigSlice] updateChatbotConfig called with:', action.payload);
      const newConfigCandidate = { ...state.config, ...action.payload };
      if (action.payload.systemVariables === undefined && state.config.systemVariables) {
        newConfigCandidate.systemVariables = state.config.systemVariables;
      } else if (action.payload.systemVariables === null || action.payload.systemVariables === undefined) {
        newConfigCandidate.systemVariables = [];
      } else {
        newConfigCandidate.systemVariables = action.payload.systemVariables;
      }
      state.config = newConfigCandidate;
      state.isConfigured = !!(state.config.token);
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
export const selectChatbotCustomCss = (state: RootStateForSelectors) => state.chatbotConfig.config.customCss;
export const selectChatbotCustomJs = (state: RootStateForSelectors) => state.chatbotConfig.config.customJs;
export const selectChatbotSystemVariables = (state: RootStateForSelectors) => state.chatbotConfig.config.systemVariables; 