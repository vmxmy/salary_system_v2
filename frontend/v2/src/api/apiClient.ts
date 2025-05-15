import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // For accessing the auth token

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
      // Attempt to refresh token or redirect to login
      // For now, just log out if not on login page and it's a 401
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        // Avoid logout if the 401 occurs during login attempt itself
        // or if it's from a silent token refresh failing.
        // More sophisticated logic might be needed here based on specific auth flows.
        
        // Check if the original request was to a user-details or token-refresh endpoint
        // to prevent logout loops if these fail silently.
        const isAuthVerificationRequest = error.config.url?.includes('/v2/users/') || error.config.url?.includes('/v2/token/refresh');

        if (!isAuthVerificationRequest) {
            console.warn('ApiClient: Detected 401, attempting logout.');
            // await useAuthStore.getState().logoutAction(); // This might cause issues if called rapidly or in certain contexts
            // window.location.href = '/login'; // Force redirect
        } else {
            console.warn(`ApiClient: Detected 401 on auth verification request (${error.config.url}), not logging out.`);
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