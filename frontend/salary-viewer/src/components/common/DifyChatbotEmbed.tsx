import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface DifyChatbotEmbedProps {
  token?: string;
  baseUrl?: string;
  customStyles?: {
    buttonColor?: string;
    windowWidth?: string;
    windowHeight?: string;
  };
}

/**
 * DifyChatbotEmbed - 使用直接嵌入方式集成Dify聊天机器人
 * 这个组件模拟了直接在HTML中嵌入Dify聊天机器人的方式
 */
const DifyChatbotEmbed: React.FC<DifyChatbotEmbedProps> = ({
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized.current) return;
    
    const allowedHostnames = [
      'localhost',
      '127.0.0.1',
      // 在这里添加您的生产环境域名
    ];
    
    if (!allowedHostnames.includes(window.location.hostname)) {
      console.log("DifyChatbot not initialized: Hostname not allowed.", window.location.hostname);
      return;
    }
    
    // 创建全局配置对象
    window.difyChatbotConfig = {
      token: token,
      baseUrl: baseUrl,
      systemVariables: {}
    };
    
    // 添加用户信息
    if (isAuthenticated && user) {
      window.difyChatbotConfig.systemVariables = {
        user_id: user.id ? String(user.id) : user.username
      };
    }
    
    console.log("Dify config initialized:", window.difyChatbotConfig);
    
    // 创建样式元素
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
    
    // 创建脚本元素
    const scriptElement = document.createElement('script');
    scriptElement.src = `${baseUrl}/embed.min.js`;
    scriptElement.id = token;
    scriptElement.defer = true;
    
    // 添加到文档
    document.body.appendChild(scriptElement);
    
    scriptElement.onload = () => {
      console.log('Dify chatbot script loaded successfully');
    };
    
    scriptElement.onerror = (error) => {
      console.error('Failed to load Dify chatbot script:', error);
      console.log('Attempted to load from URL:', `${baseUrl}/embed.min.js`);
      
      // 尝试使用完整URL
      const fullUrlScript = document.createElement('script');
      fullUrlScript.src = `http://dify.atx.ziikoo.com/embed.min.js`;
      fullUrlScript.id = `${token}-fallback`;
      fullUrlScript.defer = true;
      document.body.appendChild(fullUrlScript);
      
      fullUrlScript.onload = () => {
        console.log('Dify chatbot script loaded successfully with fallback URL');
      };
      
      fullUrlScript.onerror = (fallbackError) => {
        console.error('Failed to load Dify chatbot script with fallback URL:', fallbackError);
      };
    };
    
    initialized.current = true;
  }, [token, baseUrl, customStyles, isAuthenticated, user]);

  return null;
};

// 添加全局类型声明
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

export default DifyChatbotEmbed;
