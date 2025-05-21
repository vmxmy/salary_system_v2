import React, { useEffect, useMemo } from 'react';
import { RouterProvider, type createBrowserRouter } from 'react-router-dom';
import { App } from 'antd';
import { useAuthStore } from './store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import usePayrollConfigStore from './store/payrollConfigStore';
import useHrLookupStore from './store/hrLookupStore';
import { fetchAllLookupTypesAndCache } from './services/lookupService';

// 导入 Redux hooks 和 selectors
import { useSelector } from 'react-redux';
import {
  selectChatbotIsLoading,
  selectChatbotIsEnabled,
  selectChatbotIsConfigured,
  selectChatbotToken,
  selectChatbotBaseUrl,
  selectChatbotCustomCss,
  selectChatbotCustomJs,
  selectChatbotSystemVariables
} from './store/chatbotConfigSlice';
import type { RootState } from './store'; // 导入 RootState 类型

type AppRouter = ReturnType<typeof createBrowserRouter>;

interface AppWrapperProps {
  router: AppRouter;
}

const queryClient = new QueryClient();

const AppWrapper: React.FC<AppWrapperProps> = ({ router }) => {
  // console.log('AppWrapper: Rendering or re-rendering.');
  const initializeAuth = useAuthStore(state => state.initializeAuth);
  const authToken = useAuthStore(state => state.authToken);
  const currentUser = useAuthStore(state => state.currentUser);
  const isLoadingUser = useAuthStore(state => state.isLoadingUser);
  const fetchPayrollConfigs = usePayrollConfigStore(state => state.fetchComponentDefinitions);
  const fetchHrLookups = useHrLookupStore(state => state.fetchLookup);

  // 从 Redux store 中获取 chatbot 配置状态
  const chatbotIsLoading = useSelector(selectChatbotIsLoading);
  const chatbotIsEnabled = useSelector(selectChatbotIsEnabled);
  const chatbotIsConfigured = useSelector(selectChatbotIsConfigured);
  const chatbotConfigToken = useSelector(selectChatbotToken);
  const chatbotConfigBaseUrl = useSelector(selectChatbotBaseUrl);
  const chatbotConfigCustomCss = useSelector(selectChatbotCustomCss);
  const chatbotConfigCustomJs = useSelector(selectChatbotCustomJs);
  const chatbotSystemVariables = useSelector(selectChatbotSystemVariables);

  // 使用用户配置的baseUrl来构建脚本URL，不再使用硬编码的URL
  const DIFY_EMBED_SCRIPT_SRC = chatbotConfigBaseUrl ?
    `${chatbotConfigBaseUrl.replace(/\/$/, '')}/embed.min.js` :
    "";

  const chatbotSystemVariablesJson = useMemo(() => JSON.stringify(chatbotSystemVariables), [chatbotSystemVariables]);

  useEffect(() => {
    // console.log('[AppWrapper:useEffect-initializeAuth] Effect triggered. About to call initializeAuth.');
    initializeAuth();
    // console.log('[AppWrapper:useEffect-initializeAuth] initializeAuth call completed.');
  }, [initializeAuth]);

  useEffect(() => {
    if (authToken) {
      // console.log('[AppWrapper:useEffect-fetchPayrollConfigs] Auth token present. About to call fetchPayrollConfigs.');
      fetchPayrollConfigs();
      // console.log('[AppWrapper:useEffect-fetchPayrollConfigs] fetchPayrollConfigs call completed.');
    } else {
      // console.log('[AppWrapper:useEffect-fetchPayrollConfigs] No auth token. Skipping payroll configs.');
    }
  }, [authToken, fetchPayrollConfigs]);

  useEffect(() => {
    if (authToken) {
      // console.log('[AppWrapper:useEffect-fetchHrLookups] Auth token present. Fetching essential HR lookups.');
      fetchHrLookups('genders');
      fetchHrLookups('maritalStatuses');
      fetchHrLookups('educationLevels');
      fetchHrLookups('employmentTypes');
      fetchHrLookups('employeeStatuses');
      fetchHrLookups('departments');
      fetchHrLookups('personnelCategories');
      // console.log('[AppWrapper:useEffect-fetchHrLookups] HR lookups fetch calls initiated.');
    } else {
      // console.log('[AppWrapper:useEffect-fetchHrLookups] No auth token. Skipping HR lookups.');
    }
  }, [authToken, fetchHrLookups]);

  useEffect(() => {
    if (authToken) {
      // console.log('[AppWrapper:useEffect-primeLookupCache] Auth token present. Priming lookup types cache.');
      fetchAllLookupTypesAndCache();
    } else {
      // console.log('[AppWrapper:useEffect-primeLookupCache] No auth token. Skipping lookup types cache priming.');
    }
  }, [authToken]);

  useEffect(() => {
    // console.log(
    //   '[AppWrapper:useEffect-authWatcher] Auth state changed:',
    //   {
    //     isAuthenticated: !!authToken,
    //     currentUser: currentUser ? currentUser.username : null,
    //     isLoadingUser,
    //   }
    // );
  }, [authToken, currentUser, isLoadingUser]);

  // --- AI Chatbot Integration useEffect Start ---
  useEffect(() => {
    console.log(
      '[AppWrapper-Redux-DEBUG] Chatbot useEffect triggered. isLoading:', chatbotIsLoading,
      'isEnabled:', chatbotIsEnabled, 'isConfigured:', chatbotIsConfigured,
      'token:', chatbotConfigToken,
      'baseUrl:', chatbotConfigBaseUrl,
      'DIFY_EMBED_SCRIPT_SRC:', DIFY_EMBED_SCRIPT_SRC
    );

    if (chatbotIsLoading) {
      console.log('[AppWrapper-Redux-DEBUG] Chatbot config is loading, deferring script management.');
      return;
    }

    const scriptIdToUse = chatbotConfigToken || 'dify-chatbot-default-id';

    const cleanupChatbotElements = () => {
      console.log(`[AppWrapper-Redux-DEBUG] cleanupChatbotElements called for scriptId: ${scriptIdToUse}.`);
      const existingScript = document.getElementById(scriptIdToUse);
      if (existingScript) existingScript.remove();
      const existingConfigScript = document.getElementById('dify-chatbot-config');
      if (existingConfigScript) existingConfigScript.remove();
      const existingCustomStyle = document.getElementById('chatbot-custom-style');
      if (existingCustomStyle) existingCustomStyle.remove();
      const existingCustomLogic = document.getElementById('chatbot-custom-js');
      if (existingCustomLogic) existingCustomLogic.remove();
      const difyWidgetBubble = document.getElementById('dify-chatbot-bubble-button');
      if (difyWidgetBubble) difyWidgetBubble.remove();
      const difyChatbotRoot = document.querySelector('div[id^="dify-chatbotroot-"]');
      if (difyChatbotRoot) difyChatbotRoot.remove();
    };

    if (chatbotIsEnabled && chatbotIsConfigured && chatbotConfigToken && DIFY_EMBED_SCRIPT_SRC && DIFY_EMBED_SCRIPT_SRC.trim() !== '') {
      console.log('[AppWrapper-Redux-DEBUG] Conditions met: Injecting chatbot script and config.');
      cleanupChatbotElements();

      const configScript = document.createElement('script');
      configScript.id = 'dify-chatbot-config';
      const chatbotWindowConfig: { token: string; baseUrl?: string; system_variables: Record<string, any>; dynamicScript?: boolean } = {
        token: chatbotConfigToken!,
        baseUrl: chatbotConfigBaseUrl,
        system_variables: {},
        dynamicScript: true,
      };
      if (chatbotSystemVariables && Array.isArray(chatbotSystemVariables)) {
        chatbotSystemVariables.forEach(sv => {
          if (sv.key && sv.value !== undefined) {
            chatbotWindowConfig.system_variables[sv.key] = sv.value;
          }
        });
      }
      configScript.innerHTML = `window.difyChatbotConfig = ${JSON.stringify(chatbotWindowConfig)};`;
      document.head.appendChild(configScript);
      // console.log('[AppWrapper-Redux-DEBUG] Added config script with content:', configScript.innerHTML);

      if (chatbotConfigCustomCss) {
        const styleElement = document.createElement('style');
        styleElement.id = 'chatbot-custom-style';
        styleElement.textContent = chatbotConfigCustomCss;
        document.head.appendChild(styleElement);
        // console.log('[AppWrapper-Redux-DEBUG] Added custom CSS.');
      }

      if (chatbotConfigCustomJs) {
        const customScriptElement = document.createElement('script');
        customScriptElement.id = 'chatbot-custom-js';
        customScriptElement.textContent = chatbotConfigCustomJs;
        document.head.appendChild(customScriptElement);
        // console.log('[AppWrapper-Redux-DEBUG] Added custom JS logic.');
      }

      const embedScript = document.createElement('script');
      embedScript.src = DIFY_EMBED_SCRIPT_SRC;
      embedScript.id = scriptIdToUse;
      embedScript.defer = true;
      embedScript.onload = () => {
        console.log(`[AppWrapper-Redux-DEBUG] Chatbot embed script (id: ${scriptIdToUse}, src: ${DIFY_EMBED_SCRIPT_SRC}) LOADED successfully.`);
        console.log('[AppWrapper-Redux-DEBUG] window.difyChatbotConfig on embed script load:', (window as any).difyChatbotConfig);
        console.log('[AppWrapper-Redux-DEBUG] Checking for Dify API on window (e.g., window.Dify):', (window as any).Dify);
        console.log('[AppWrapper-Redux-DEBUG] Checking for Dify Chatbot instance (e.g., window.difyChatbot):', (window as any).difyChatbot);
      };
      embedScript.onerror = () => {
        console.error(`[AppWrapper-Redux-DEBUG] Chatbot embed script (id: ${scriptIdToUse}, src: ${DIFY_EMBED_SCRIPT_SRC}) FAILED to load.`);
      };
      document.head.appendChild(embedScript);
      // console.log(`[AppWrapper-Redux-DEBUG] Added embed script (id: ${scriptIdToUse}, src: ${DIFY_EMBED_SCRIPT_SRC}).`);

    } else {
      // console.log('[AppWrapper-Redux-DEBUG] Conditions not met (isLoading is false, but isEnabled is false or not configured/essential params missing). Cleaning up chatbot elements.');
      cleanupChatbotElements();
    }

    return () => {
      // console.log('[AppWrapper-Redux-DEBUG] Chatbot useEffect cleanup triggered.');
      cleanupChatbotElements();
    };
  }, [
    chatbotIsLoading,
    chatbotIsEnabled,
    chatbotIsConfigured,
    chatbotConfigToken,
    chatbotConfigBaseUrl,
    chatbotConfigCustomCss,
    chatbotConfigCustomJs,
    chatbotSystemVariablesJson,
  ]);
  // --- AI Chatbot Integration useEffect End ---

  return (
    // <React.StrictMode> // StrictMode in main.tsx is already commented out
      <QueryClientProvider client={queryClient}>
        <App>
          <RouterProvider router={router} />
        </App>
      </QueryClientProvider>
    // </React.StrictMode>
  );
};

export default AppWrapper; 