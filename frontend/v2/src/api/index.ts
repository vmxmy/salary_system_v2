import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // 取消注释并使用

// VITE_API_BASE_URL 应该在 .env 文件中配置为类似 'http://localhost:8000/v2'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined. Please check your .env file.");
}
console.log('VITE_API_BASE_URL from api/index.ts:', API_BASE_URL);


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().authToken; // 从 Zustand store 获取 token
    // const token = localStorage.getItem('authToken'); // 临时使用 localStorage，后续替换为 Zustand
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    if (error.response) {
      const { status, data } = error.response;
      console.error(`API Error: Status ${status}`, data);

      if (status === 401) {
        // Token 过期或无效，清除本地 token 并跳转到登录页
        // localStorage.removeItem('authToken'); // 临时，后续应通过 authStore action
        // localStorage.removeItem('currentUser'); // 临时
        useAuthStore.getState().logoutAction(); // 理想方式
        // if (window.location.pathname !== '/login') { // logoutAction 内部可能会处理
        //    window.location.href = '/login'; // 简单跳转，会导致页面刷新
        // }
      } else if (status === 403) {
        // 无权限访问，可以显示全局提示
        // 例如: message.error('您没有权限执行此操作'); (如果 antd message 在此可用)
        console.error('Forbidden: You do not have permission to access this resource.');
      } else if (status === 404) {
        console.error('Resource not found.');
      } else if (status >= 500) {
        console.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('Network Error: No response received from server.', error.request);
    } else {
      // 发送请求时出了点问题
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient; 