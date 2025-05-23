import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // For accessing the auth token

// 工具函数：检测和处理网络连接或服务器错误
export const isServerUnavailableError = (error: any): boolean => {
  // 检查网络连接错误（服务器完全不可用）
  if (!error.response && error.message && (
    error.message.includes('Network Error') || 
    error.message.includes('Failed to fetch') ||
    error.message.includes('connect ECONNREFUSED')
  )) {
    return true;
  }
  
  // 检查服务器内部错误
  if (error.response && error.response.status === 500) {
    return true;
  }
  
  return false;
};

// 格式化错误消息，确保始终返回字符串
export const formatErrorMessage = (error: any): string => {
  if (isServerUnavailableError(error)) {
    return '服务器错误：可能是数据库未启动或后端服务不可用，请联系系统管理员。';
  }
  
  if (error.response?.data?.detail) {
    return typeof error.response.data.detail === 'string'
      ? error.response.data.detail
      : JSON.stringify(error.response.data.detail);
  }
  
  if (error.message) {
    return String(error.message);
  }
  
  return '发生未知错误';
};

// Define authentication verification URLs
const AUTH_VERIFICATION_URLS: string[] = [
    '/v2/users/', // Example: Get current user details
    '/v2/token/refresh', // Example: Refresh token endpoint
    // Add any other relevant auth-related endpoints here
];

const host = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''); // 移除VITE_API_BASE_URL末尾的斜杠（如果有）
const pathPrefix = (import.meta.env.VITE_API_PATH_PREFIX || '/v2'); // VITE_API_PATH_PREFIX，默认为 /v2

// 确保 pathPrefix 以 / 开头
const resolvedPathPrefix = pathPrefix.startsWith('/') ? pathPrefix : `/${pathPrefix}`;
const fullBaseURL = host ? `${host}${resolvedPathPrefix}` : resolvedPathPrefix;

console.log('API Client Initialized with base URL:', fullBaseURL);

const apiClient = axios.create({
  baseURL: fullBaseURL, 
  headers: {
    'Content-Type': 'application/json'
  },
});

// Request interceptor to add the auth token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Added for diagnostics
      console.log(`ApiClient请求: ${config.method?.toUpperCase()} ${config.url}`); 
    } else {
      // Added for diagnostics
      console.warn(`ApiClient未认证请求: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // 记录请求详情
    console.log('ApiClient请求详情:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      params: config.params
    });
    
    return config;
  },
  (error) => {
    console.error('ApiClient请求错误:', error);
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for global error handling (e.g., 401 redirects)
apiClient.interceptors.response.use(
  (response) => {
    // 记录成功响应详情
    console.log(`ApiClient响应成功 (${response.status}) 请求: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('响应数据:', response.data);
    return response;
  },
  async (error) => {
    // 记录错误响应详情
    if (error.response) {
      const { status, data, config } = error.response;
      console.error(`ApiClient错误 (${status}) 请求: ${config.method?.toUpperCase()} ${config.url}`);
      console.error('错误详情:', { data, url: config.url, method: config.method });
        
      // 特殊处理404错误
      if (status === 404) {
        console.error('HTTP 404 资源不存在:', {
          url: config.url,
          method: config.method,
          message: '请求的资源不存在，请检查API路径是否正确',
          fullPath: `${config.baseURL}${config.url}`
        });
      }
      // 特殊处理405错误
      else if (status === 405) {
        console.error('HTTP 405 方法不允许:', {
          url: config.url,
          method: config.method,
          allowedMethods: error.response.headers['allow'] || 'Not specified',
          requestData: config.data
        });
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('ApiClient未收到响应:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
    } else {
      // 设置请求时发生错误
      console.error('ApiClient请求配置错误:', error.message);
    }
    
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      const isAuthVerificationUrl = AUTH_VERIFICATION_URLS.some((url: string) =>
        error.config.url?.includes(url)
      );

      if (window.location.pathname === '/login' || isAuthVerificationUrl) {
        // 💡 如果当前已在登录页，或错误来源于认证接口本身，则不执行登出，避免循环
        console.warn(
          'ApiClient: 401 on login page or auth verification URL, not attempting logout.',
          error.config.url
        );
      } else {
        console.warn('ApiClient: Detected 401, attempting logout.', error.config.url);
        // 确保 logoutAction 是异步的，并且正确处理
        try {
          await useAuthStore.getState().logoutAction();
          window.location.href = '/login';
        } catch (logoutError) {
          console.error("ApiClient: Error during logoutAction: ", logoutError);
          // 即使登出失败，也尝试跳转到登录页作为后备
          window.location.href = '/login';
        }
      }
    } 
    
    // 添加全局500错误处理
    else if (error.response && error.response.status === 500) {
      console.error('Server Error 500:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 