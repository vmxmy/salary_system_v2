import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface DifyChatbotDirectProps {
  token?: string;
  baseUrl?: string;
  customStyles?: {
    buttonColor?: string;
    windowWidth?: string;
    windowHeight?: string;
  };
}

/**
 * DifyChatbotDirect - 使用直接嵌入方式集成Dify聊天机器人
 * 这个组件使用更直接的方式嵌入Dify聊天机器人，通过直接在DOM中添加脚本和样式
 */
const DifyChatbotDirect: React.FC<DifyChatbotDirectProps> = ({
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
    
    try {
      // 创建配置脚本
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      
      // 构建配置对象
      let configObj = {
        token,
        baseUrl,
        systemVariables: {}
      };
      
      // 添加用户信息
      if (isAuthenticated && user) {
        configObj.systemVariables = {
          user_id: user.id ? String(user.id) : user.username
        };
      }
      
      // 设置配置脚本内容
      configScript.textContent = `
        window.difyChatbotConfig = ${JSON.stringify(configObj)};
        console.log("Dify config initialized:", window.difyChatbotConfig);
      `;
      
      // 添加配置脚本到容器
      if (containerRef.current) {
        containerRef.current.appendChild(configScript);
      } else {
        document.head.appendChild(configScript);
      }
      
      // 创建嵌入脚本
      const embedScript = document.createElement('script');
      embedScript.src = `${baseUrl}/embed.min.js`;
      embedScript.id = token;
      embedScript.defer = true;
      embedScript.async = true;
      
      // 添加加载事件
      embedScript.onload = () => {
        console.log('Dify chatbot script loaded successfully');
      };
      
      // 添加错误事件
      embedScript.onerror = (error) => {
        console.error('Failed to load Dify chatbot script:', error);
        console.log('Attempted to load from URL:', `${baseUrl}/embed.min.js`);
      };
      
      // 添加嵌入脚本到容器
      if (containerRef.current) {
        containerRef.current.appendChild(embedScript);
      } else {
        document.body.appendChild(embedScript);
      }
      
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
      
      // 添加样式到文档
      document.head.appendChild(styleElement);
      
      console.log('Dify chatbot initialized with direct method');
      initialized.current = true;
    } catch (error) {
      console.error('Error initializing Dify chatbot:', error);
    }
  }, [token, baseUrl, customStyles, isAuthenticated, user]);

  return <div ref={containerRef} id="dify-chatbot-container"></div>;
};

export default DifyChatbotDirect;
