import { configureStore } from '@reduxjs/toolkit';
import chatbotConfigReducer, { setHydratedChatbotState, setInitialChatbotState, initialChatbotConfig, type ChatbotSliceState } from './chatbotConfigSlice';

const CHATBOT_CONFIG_STORAGE_KEY = 'chatbot-config-redux-storage';

// 从 localStorage 加载状态
const loadState = (): ChatbotSliceState | undefined => {
  try {
    const serializedState = localStorage.getItem(CHATBOT_CONFIG_STORAGE_KEY);
    if (serializedState === null) {
      console.log('[ReduxStore] No chatbot config found in localStorage.');
      return undefined;
    }
    const storedState = JSON.parse(serializedState) as ChatbotSliceState;
    console.log('[ReduxStore] Loaded chatbot config from localStorage:', storedState);
    // 我们不在这里设置 isLoading: false，因为 preloadedState 会被 slice 的 initialState 覆盖，
    // 然后我们 dispatch action 来正确设置水合后的状态，包括 isLoading: false。
    return storedState;
  } catch (error) {
    console.error('[ReduxStore] Could not load chatbot config from localStorage:', error);
    return undefined;
  }
};

// 保存状态到 localStorage (只保存 chatbotConfig 部分)
const saveState = (state: { chatbotConfig: ChatbotSliceState }) => {
  try {
    const serializedState = JSON.stringify(state.chatbotConfig);
    localStorage.setItem(CHATBOT_CONFIG_STORAGE_KEY, serializedState);
    console.log('[ReduxStore] Saved chatbot config to localStorage:', state.chatbotConfig);
  } catch (error) {
    console.error('[ReduxStore] Could not save chatbot config to localStorage:', error);
  }
};

const preloadedState = (() => {
  const loadedChatbotConfig = loadState();
  if (loadedChatbotConfig) {
    // 如果从 localStorage 加载了状态，我们仍然希望 isLoading 为 true，
    // 直到我们 dispatch setHydratedChatbotState。
    // initialState of slice 已经将 isLoading 设置为 true，所以这里不需要特别处理。
    // preloadedState 主要用于传递 config, isEnabled, isConfigured。
    return { chatbotConfig: { ...loadedChatbotConfig, isLoading: true } }; 
  }
  // 如果 localStorage 没有，则 slice 的 initialState (包含 isLoading: true) 会被使用。
  return undefined; 
})();

console.log('[ReduxStore] Preloaded state before configureStore:', preloadedState);

export const store = configureStore({
  reducer: {
    chatbotConfig: chatbotConfigReducer,
    // ... 这里可以添加应用中的其他 reducers
  },
  preloadedState,
});

// 初始化 store：尝试从 localStorage 加载，否则使用默认值
// 这个逻辑会在 store 创建后立即执行
if (preloadedState && preloadedState.chatbotConfig) {
    // 确保传递给 setHydratedChatbotState 的是完整的 ChatbotSliceState，包括正确的 isLoading
    // loadState 返回的已经是 ChatbotSliceState，但 preloadedState 修改了 isLoading
    // 我们需要的是从 loadState 得到的原始对象（如果存在），或者 initialState（如果不存在）
    const stateToHydrate = loadState(); // 重新调用 loadState 以获取未修改 isLoading 的版本
    if (stateToHydrate) {
        console.log('[ReduxStore] Dispatching setHydratedChatbotState with state from localStorage.');
        store.dispatch(setHydratedChatbotState(stateToHydrate));
    } else {
        // 此情况理论上不应发生，因为如果 loadState 返回 undefined，preloadedState 也应该是 undefined
        // 但作为保险，如果真的发生了，就用 initial state 初始化
        console.log('[ReduxStore] Dispatching setInitialChatbotState (fallback in hydration logic).');
        store.dispatch(setInitialChatbotState());
    }
} else {
    // 如果 localStorage 中没有任何内容 (preloadedState is undefined)
    console.log('[ReduxStore] No preloaded state from localStorage, dispatching setInitialChatbotState.');
    store.dispatch(setInitialChatbotState());
}


// 订阅 store 的变化以保存到 localStorage
// 我们只在 chatbotConfig slice 相关的状态变化时保存
let currentChatbotState = store.getState().chatbotConfig;
store.subscribe(() => {
  const previousChatbotState = currentChatbotState;
  currentChatbotState = store.getState().chatbotConfig;
  if (currentChatbotState !== previousChatbotState) {
    console.log('[ReduxStore] Chatbot config state changed, attempting to save to localStorage.');
    saveState({ chatbotConfig: currentChatbotState });
  }
});

// 定义 RootState 类型，供整个应用使用
export type RootState = ReturnType<typeof store.getState>;
// 定义 AppDispatch 类型
export type AppDispatch = typeof store.dispatch; 