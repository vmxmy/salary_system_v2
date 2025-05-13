import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * DifyChatbotSimple - 简单的Dify聊天机器人集成方式
 * 使用环境变量配置token和baseUrl，并集成用户信息
 * 只在超级管理员登录时才加载
 */
const DifyChatbotSimple: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // 从环境变量获取配置
  const token = import.meta.env.VITE_DIFY_TOKEN || 'jsPqTK9jkG42gNSr';
  const baseUrl = import.meta.env.VITE_DIFY_BASE_URL || 'http://dify.atx.ziikoo.com';

  useEffect(() => {
    // 检查用户是否为超级管理员
    let isSuperAdmin = false;

    // 使用单个日志输出所有信息，避免日志丢失
    try {
      const userInfo = user ? {
        id: user.id,
        username: user.username,
        role: user.role,
        roleType: user.role ? typeof user.role : 'undefined',
        roleJSON: user.role ? JSON.stringify(user.role) : 'undefined'
      } : 'null';

      // 检查用户角色
      if (isAuthenticated && user) {
        // 如果用户名是admin，直接授权
        if (user.username === 'admin') {
          isSuperAdmin = true;
        }
        // 检查角色
        else if (user.role) {
          // 如果role是字符串类型
          if (typeof user.role === 'string') {
            isSuperAdmin = user.role === 'Super Admin';
          }
          // 如果role是对象类型
          else if (typeof user.role === 'object' && user.role !== null) {
            const roleObj = user.role as any;

            // 检查name属性
            if (roleObj.name) {
              isSuperAdmin = roleObj.name === 'Super Admin';
            }
          }
        }
      }

      // 单个日志输出所有信息
      console.log('DIFY AUTH CHECK:', {
        isAuthenticated,
        user: userInfo,
        isSuperAdmin
      });
    } catch (error) {
      console.error('Error in Dify auth check:', error);
    }

    // 如果不是超级管理员，不加载聊天机器人
    if (!isSuperAdmin) {
      console.log('Dify chatbot not loaded: User is not a Super Admin');
      return;
    }

    // 检查是否已经加载过脚本
    if (document.getElementById(token as string)) {
      console.log('Dify script already loaded');
      return;
    }

    console.log('Initializing Dify chatbot with:', { token, baseUrl });

    // 准备系统变量
    const systemVariables: Record<string, string> = {};

    // 添加用户信息 - 此时我们已经确认user不为null
    if (user) {
      systemVariables.user_id = user.id ? String(user.id) : user.username;
      console.log('Adding user info to Dify config:', user.username);
    }

    // 创建配置脚本
    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.difyChatbotConfig = {
        token: '${token}',
        baseUrl: '${baseUrl}',
        systemVariables: ${JSON.stringify(systemVariables)},
      }
    `;
    document.head.appendChild(configScript);

    // 创建嵌入脚本
    const embedScript = document.createElement('script');
    embedScript.src = `${baseUrl}/embed.min.js`;
    embedScript.id = token as string;
    embedScript.defer = true;
    document.body.appendChild(embedScript);

    // 创建样式
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      #dify-chatbot-bubble-button {
        background-color: #1C64F2 !important;
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
      }
    `;
    document.head.appendChild(styleElement);

    console.log('Dify chatbot simple integration initialized');

    // 清理函数
    return () => {
      // 不移除脚本，因为这可能会导致聊天机器人停止工作
    };
  }, []);

  return null;
};

export default DifyChatbotSimple;
