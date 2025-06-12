import { configureStore } from '@reduxjs/toolkit';
import chatbotConfigReducer, { setHydratedChatbotState, setInitialChatbotState, initialChatbotConfig, type ChatbotSliceState } from './chatbotConfigSlice';
import authReducer, { rehydrateAuth, type AuthState } from './authSlice'; // Import authReducer and rehydrateAuth
import hrLookupReducer from './hrLookupSlice'; // Import hrLookupReducer
import payrollConfigReducer from './payrollConfigSlice'; // Import payrollConfigReducer

const CHATBOT_CONFIG_STORAGE_KEY = 'chatbot-config-redux-storage';
const AUTH_STORAGE_KEY = 'auth-storage';

// 从 localStorage 加载 chatbot 状态
const loadChatbotState = (): ChatbotSliceState | undefined => {
  try {
    const serializedState = localStorage.getItem(CHATBOT_CONFIG_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    const storedState = JSON.parse(serializedState) as ChatbotSliceState;
    return storedState;
  } catch (error) {
    return undefined;
  }
};

// 从 localStorage 加载认证状态
const loadAuthState = (): Partial<AuthState> | undefined => {
  try {
    const serializedState = localStorage.getItem(AUTH_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    const storedState = JSON.parse(serializedState);
    return storedState;
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
    return undefined;
  }
};

// 保存状态到 localStorage (只保存 chatbotConfig 部分)
const saveState = (state: { chatbotConfig: ChatbotSliceState }) => {
  try {
    const serializedState = JSON.stringify(state.chatbotConfig);
    localStorage.setItem(CHATBOT_CONFIG_STORAGE_KEY, serializedState);
  } catch (error) {
  }
};

const preloadedState = (() => {
  const loadedChatbotConfig = loadChatbotState();
  const loadedAuthState = loadAuthState();
  
  const state: any = {};
  
  if (loadedChatbotConfig) {
    state.chatbotConfig = { ...loadedChatbotConfig, isLoading: true };
  }
  
  if (loadedAuthState) {
    state.auth = loadedAuthState;
  }
  
  return Object.keys(state).length > 0 ? state : undefined;
})();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hrLookup: hrLookupReducer,
    payrollConfig: payrollConfigReducer,
    chatbotConfig: chatbotConfigReducer, // ✅ 添加缺失的 chatbotConfig reducer
  } as any, // 临时使用类型断言解决类型冲突
  preloadedState, // ✅ 恢复预加载状态
});

// 初始化 store：尝试从 localStorage 加载，否则使用默认值
// 这个逻辑会在 store 创建后立即执行

// 初始化 chatbot 配置
if (preloadedState && preloadedState.chatbotConfig) {
    // 确保传递给 setHydratedChatbotState 的是完整的 ChatbotSliceState，包括正确的 isLoading
    // loadChatbotState 返回的已经是 ChatbotSliceState，但 preloadedState 修改了 isLoading
    // 我们需要的是从 loadChatbotState 得到的原始对象（如果存在），或者 initialState（如果不存在）
    const stateToHydrate = loadChatbotState(); // 重新调用 loadChatbotState 以获取未修改 isLoading 的版本
    if (stateToHydrate) {
        store.dispatch(setHydratedChatbotState(stateToHydrate));
    } else {
        // 此情况理论上不应发生，因为如果 loadChatbotState 返回 undefined，preloadedState 也应该是 undefined
        // 但作为保险，如果真的发生了，就用 initial state 初始化
        store.dispatch(setInitialChatbotState());
    }
} else {
    // 如果 localStorage 中没有任何内容 (preloadedState is undefined)
    store.dispatch(setInitialChatbotState());
}

// 初始化认证状态
if (preloadedState && preloadedState.auth) {
    console.log('🔄 恢复认证状态:', preloadedState.auth);
    store.dispatch(rehydrateAuth(preloadedState.auth as AuthState));
}


// 订阅 store 的变化以保存到 localStorage
// 我们只在认证相关的状态变化时保存
let currentAuthState = store.getState().auth;

store.subscribe(() => {
  const state = store.getState();
  
  // 保存认证状态
  const previousAuthState = currentAuthState;
  currentAuthState = state.auth;
  if (currentAuthState !== previousAuthState) {
    try {
      // 只保存必要的认证信息，不保存临时状态
      const authDataToSave = {
        authToken: currentAuthState.authToken,
        currentUserId: currentAuthState.currentUserId,
        currentUserNumericId: currentAuthState.currentUserNumericId,
        currentUser: currentAuthState.currentUser,
        userRoles: currentAuthState.userRoles,
        userRoleCodes: currentAuthState.userRoleCodes,
        userPermissions: currentAuthState.userPermissions,
      };
      localStorage.setItem('auth-storage', JSON.stringify(authDataToSave));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }
});

// 定义 RootState 类型，供整个应用使用
export type RootState = ReturnType<typeof store.getState>;
// 定义 AppDispatch 类型
export type AppDispatch = typeof store.dispatch; 