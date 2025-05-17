import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // For accessing the auth token

// Define authentication verification URLs
const AUTH_VERIFICATION_URLS: string[] = [
    '/v2/users/', // Example: Get current user details
    '/v2/token/refresh', // Example: Refresh token endpoint
    // Add any other relevant auth-related endpoints here
];

const host = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''); // 移除VITE_API_BASE_URL末尾的斜杠（如果有）
const pathPrefix = (import.meta.env.VITE_API_PATH_PREFIX || '/api/v2'); // VITE_API_PATH_PREFIX，默认为 /api/v2

// 确保 pathPrefix 以 / 开头
const resolvedPathPrefix = pathPrefix.startsWith('/') ? pathPrefix : `/${pathPrefix}`;
const fullBaseURL = host ? `${host}${resolvedPathPrefix}` : resolvedPathPrefix;

const apiClient = axios.create({
  baseURL: fullBaseURL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Added for diagnostics
      console.log('ApiClient: Attaching token (first 10 chars):', token.substring(0, 10)); 
    } else {
      // Added for diagnostics
      console.warn('ApiClient: No token found in authStore.');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for global error handling (e.g., 401 redirects)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
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
    // else if (error.response && error.response.status === 500) {
    //   // Handle 500 errors globally if desired
    //   console.error('API Error 500:', error.response.data);
    //   // message.error('An unexpected server error occurred.');
    // }
    return Promise.reject(error);
  }
);

export default apiClient; 