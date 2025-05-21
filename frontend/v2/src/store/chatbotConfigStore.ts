import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage, type PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface ChatbotConfig {
  token: string;
  baseUrl?: string;
  scriptSrc: string;
  scriptId: string;
  customCss?: string;
  customJs?: string;
  systemVariables?: Array<{ key: string; value_type: string; value: any; label?: string }>;
  isEnabled?: boolean; // Added isEnabled here for consistency in defaultConfig typing
}

export interface ChatbotConfigState {
  config: ChatbotConfig;
  isEnabled: boolean;
  isConfigured: boolean;
  isLoading: boolean; // To track rehydration
  setConfig: (newConfig: Partial<ChatbotConfig>) => void;
  setEnabled: (enabled: boolean) => void;
  getSystemVariables: () => Array<{ key: string; value_type: string; value: any; label?: string }>;
  setHydrated: () => void; // Explicitly set hydration status
}

export const defaultConfig: ChatbotConfig = {
  token: '', // Default token
  baseUrl: '', // Default baseUrl
  scriptSrc: 'https://cdn.dify.ai/embed-chatbot/embed.min.js',
  scriptId: '', // Default scriptId, ensure it matches token
  customCss: '',
  customJs: '',
  isEnabled: true, // Default enabled state
  systemVariables: [
    { key: 'scene', value_type: 'string', value: 'general', label: '对话场景' },
    { key: 'lib_search_topk', value_type: 'number', value: 3, label: '知识库检索TopK' },
  ],
};

// This is the shape of the data that will be persisted to localStorage
interface PersistedChatbotState {
  config: ChatbotConfig;
  isEnabled: boolean;
}

// Type for the state creator function passed to persist
// StateCreator<T, Mps extends [StoreMutatorIdentifier, unknown][] = [], Mcs extends [StoreMutatorIdentifier, unknown][] = []>
// Mps (MiddlewarePersistSignatures) and Mcs (MiddlewareCreatorSignatures) should be empty for the base creator if persist wraps it.
type ChatbotStoreCreator = StateCreator<
  ChatbotConfigState,
  [], 
  [],
  ChatbotConfigState
>;


const chatbotStoreCreator: ChatbotStoreCreator = (set, get) => ({
  config: defaultConfig,
  isEnabled: defaultConfig.isEnabled !== undefined ? defaultConfig.isEnabled : true, // Initialize from defaultConfig
  isConfigured: !!(defaultConfig.token && defaultConfig.scriptSrc),
  isLoading: true, // Start as loading

  setConfig: (newConfig: Partial<ChatbotConfig>) =>
    set((state) => { // `state` will be inferred as ChatbotConfigState by `set` context
      const updatedConfig = { ...state.config, ...newConfig };
      console.log('[ChatbotConfigStore-DEBUG] setConfig called. New full config:', updatedConfig);
      return {
        config: updatedConfig,
        isConfigured: !!(updatedConfig.token && updatedConfig.scriptSrc),
      };
    }),
  setEnabled: (enabled: boolean) =>
    set((state) => { // `state` will be inferred as ChatbotConfigState
      console.log(`[ChatbotConfigStore-DEBUG] setEnabled called with: ${enabled}. Current state.isEnabled: ${state.isEnabled}, isLoading: ${state.isLoading}`);
      // Allow update during hydration (isLoading=true) or if value changes
      if (state.isEnabled === enabled && !state.isLoading) {
        console.log(`[ChatbotConfigStore-DEBUG] setEnabled: value is already ${enabled} and not loading, skipping update.`);
        return {}; // Skips the actual state update and notification
      }
      return { isEnabled: enabled };
    }),
  getSystemVariables: () => get().config.systemVariables || [],
  setHydrated: () => {
    console.log('[ChatbotConfigStore-DEBUG] setHydrated action called.');
    set({ isLoading: false });
  },
});

const persistOptions: PersistOptions<ChatbotConfigState, PersistedChatbotState> = {
  name: 'chatbot-config-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ // `state` will be inferred as ChatbotConfigState
    config: state.config,
    isEnabled: state.isEnabled,
  }),
  onRehydrateStorage: (stateFromStorage) => { // stateFromStorage is the raw value from storage, or null
    console.log('[ChatbotConfigStore-DEBUG] persist.onRehydrateStorage: Raw state from storage:', stateFromStorage);
    return (hydratedState, error) => { // hydratedState is the state *after* potential merging by persist logic
      if (error) {
        console.error('[ChatbotConfigStore-DEBUG] persist.onRehydrateStorage: Error during rehydration:', error);
      } else {
        console.log('[ChatbotConfigStore-DEBUG] persist.onRehydrateStorage: Rehydration finished callback. Merged hydrated state provided by persist:', hydratedState);
        if (hydratedState) {
             console.log('[ChatbotConfigStore-DEBUG] persist.onRehydrateStorage: Effective rehydrated isEnabled from merged state:', (hydratedState as ChatbotConfigState).isEnabled);
        }
        // The store's state is updated by the persist middleware *after* this callback.
        // We will use onFinishHydration to set isLoading to false.
      }
    };
  },
};

export const useChatbotConfigStore = create<ChatbotConfigState>()(
  persist(
    chatbotStoreCreator,
    persistOptions
  )
);

// Call setHydrated when hydration is truly finished.
// onFinishHydration is the correct hook for this.
const unsubFinishHydration = useChatbotConfigStore.persist.onFinishHydration((state) => {
  console.log("[ChatbotConfigStore-DEBUG] Zustand persist.onFinishHydration: Hydration fully finished. Current store state:", state);
  // state here is the fully rehydrated and merged state.
  useChatbotConfigStore.getState().setHydrated(); // Call the action to set isLoading to false
  unsubFinishHydration(); // Unsubscribe to prevent memory leaks and multiple calls
});

// Log initial state right after creation (this will be pre-hydration values from chatbotStoreCreator)
console.log('[ChatbotConfigStore-DEBUG] Store created. Initial state (sync, pre-hydration):', useChatbotConfigStore.getState());

// Add a subscriber to log all state changes for isEnabled and isLoading
useChatbotConfigStore.subscribe(
  (state: ChatbotConfigState, prevState: ChatbotConfigState) => {
    if (state.isEnabled !== prevState.isEnabled) {
      console.log(`[ChatbotConfigStore-SUBSCRIBE-DEBUG] isEnabled changed from ${prevState.isEnabled} to ${state.isEnabled}`);
    }
    if (state.isLoading !== prevState.isLoading) {
      console.log(`[ChatbotConfigStore-SUBSCRIBE-DEBUG] isLoading changed from ${prevState.isLoading} to ${state.isLoading}`);
    }
    if (JSON.stringify(state.config) !== JSON.stringify(prevState.config)) {
      console.log(`[ChatbotConfigStore-SUBSCRIBE-DEBUG] config changed from ${JSON.stringify(prevState.config)} to ${JSON.stringify(state.config)}`);
    }
  }
);

// For debugging: expose store to window
// if (process.env.NODE_ENV === 'development') {
//   (window as any).chatbotStore = useChatbotConfigStore;
// } 