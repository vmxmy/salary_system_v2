import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // For accessing the auth token

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
      console.log(`ApiClient Request: ${config.method?.toUpperCase()} ${config.url}`); 
      console.log('ApiClient: Attaching token (first 10 chars):', token.substring(0, 10)); 
    } else {
      // Added for diagnostics
      console.warn(`ApiClient Request (no auth): ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // 记录请求详情（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('ApiClient Request Details:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('ApiClient Request Error:', error);
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for global error handling (e.g., 401 redirects)
apiClient.interceptors.response.use(
  (response) => {
    // 记录成功响应详情（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`ApiClient Response (${response.status}) for ${response.config.method?.toUpperCase()} ${response.config.url}:`, 
        { headers: response.headers, data: response.data });
    }
    return response;
  },
  async (error) => {
    // 记录错误响应详情
    if (error.response) {
      const { status, data, headers, config } = error.response;
      console.error(`ApiClient Error (${status}) for ${config.method?.toUpperCase()} ${config.url}:`, 
        { data, headers });
        
      // 特殊处理404错误
      if (status === 404) {
        console.error('HTTP 404 Not Found Error:', {
          url: config.url,
          method: config.method,
          message: '请求的资源不存在，请检查API路径是否正确',
          fullPath: `${config.baseURL}${config.url}`
        });
      }
      // 特殊处理405错误
      else if (status === 405) {
        console.error('HTTP 405 Method Not Allowed Error:', {
          url: config.url,
          method: config.method,
          allowedMethods: headers['allow'] || 'Not specified',
          requestData: config.data
        });
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('ApiClient No Response Error:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
    } else {
      // 设置请求时发生错误
      console.error('ApiClient Request Setup Error:', error.message);
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