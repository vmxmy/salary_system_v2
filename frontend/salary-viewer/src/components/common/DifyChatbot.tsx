import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface DifyChatbotProps {
  // Configuration props
  token?: string;
  baseUrl?: string;
  // Optional props for customization
  customStyles?: {
    buttonColor?: string;
    windowWidth?: string;
    windowHeight?: string;
  };
}

/**
 * DifyChatbot component for integrating Dify chatbot with React
 * This component provides a way to dynamically update the chatbot configuration
 * based on the application state, such as user authentication.
 *
 * The component can be configured with token and baseUrl props or through environment variables:
 * - VITE_DIFY_TOKEN: The Dify chatbot token
 * - VITE_DIFY_BASE_URL: The Dify chatbot base URL
 */
const DifyChatbot: React.FC<DifyChatbotProps> = ({
  token = import.meta.env.VITE_DIFY_TOKEN || 'jsPqTK9jkG42gNSr',
  baseUrl = import.meta.env.VITE_DIFY_BASE_URL || 'http://dify.atx.ziikoo.com',
  customStyles = {
    buttonColor: '#1C64F2',
    windowWidth: '24rem',
    windowHeight: '40rem'
  }
}) => {
  const { isAuthenticated, user } = useAuth();
  const initialized = useRef(false);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    console.log("DifyChatbot rendered at:", window.location.href);

    const allowedHostnames = [
      'localhost',
      '127.0.0.1',
      // 在这里添加您的生产环境域名
      // 例如: 'your-production-domain.com'
    ];
    const currentHostname = window.location.hostname;

    if (!allowedHostnames.includes(currentHostname)) {
      console.log("DifyChatbot not initialized: Hostname not allowed.", currentHostname);
      return; // 如果不是允许的域名，则不初始化
    }

    // Skip if already initialized
    if (initialized.current) return;

    // 确保全局配置对象存在
    if (!window.difyChatbotConfig) {
      // 初始化Dify聊天机器人配置
      window.difyChatbotConfig = {
        token: token,
        baseUrl: baseUrl,
        systemVariables: {}
      };

      console.log('Initialized Dify chatbot config:', { token, baseUrl });
    } else {
      console.log('Dify chatbot config already exists, updating if needed');
      // 更新现有配置
      window.difyChatbotConfig.token = token;
      window.difyChatbotConfig.baseUrl = baseUrl;
    }

    // 更新聊天机器人配置中的用户信息（如果已认证）
    if (isAuthenticated && user) {
      window.difyChatbotConfig.systemVariables = {
        user_id: user.id ? String(user.id) : user.username,
        // 可以在这里添加更多用户相关变量
      };
      console.log('Added user info to Dify config:', user.username);
    }

    // Apply custom styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      #dify-chatbot-bubble-button {
        background-color: ${customStyles.buttonColor} !important;
      }
      #dify-chatbot-bubble-window {
        width: ${customStyles.windowWidth} !important;
        height: ${customStyles.windowHeight} !important;
      }
    `;
    document.head.appendChild(styleElement);

    // Load Dify script if not already loaded
    if (!scriptLoaded.current) {
      try {
        // 首先检查是否已经存在同ID的脚本
        const existingScript = document.getElementById(token);
        if (existingScript) {
          console.log('Dify chatbot script already exists, not loading again');
          scriptLoaded.current = true;
          return;
        }

        // 创建并添加脚本元素
        const script = document.createElement('script');
        script.src = `${baseUrl}/embed.min.js`;
        script.id = token;
        script.defer = true;
        script.async = true; // 添加async属性

        // 添加加载事件监听
        script.onload = () => {
          console.log('Dify chatbot script loaded successfully');
          scriptLoaded.current = true;
        };

        // 添加错误事件监听
        script.onerror = (error) => {
          console.error('Failed to load Dify chatbot script:', error);
          console.log('Attempted to load from URL:', `${baseUrl}/embed.min.js`);
        };

        // 将脚本添加到文档中
        document.body.appendChild(script);

        console.log('Dify chatbot script added to document body');
      } catch (error) {
        console.error('Error during script loading:', error);
      }
    }

    initialized.current = true;
  }, [isAuthenticated, user, customStyles, token, baseUrl]);

  // This component doesn't render anything visible
  return null;
};

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    difyChatbotConfig: {
      token: string;
      baseUrl: string;
      systemVariables: {
        user_id?: string;
        conversation_id?: string;
        [key: string]: any;
      };
    };
  }
}

export default DifyChatbot;
