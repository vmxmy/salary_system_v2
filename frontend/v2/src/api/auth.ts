import apiClient from './index';
import type { LoginResponse, User } from './types'; // 假设 User 和 LoginResponse 类型已定义

// const API_PATH_PREFIX = import.meta.env.VITE_API_PATH_PREFIX || '/api/v2'; // This line is removed

// 定义登录凭据的类型
export interface LoginCredentials {
  username: string;
  password: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const form_data = new URLSearchParams();
  form_data.append('username', credentials.username);
  form_data.append('password', credentials.password);

  // 注意：这里我们假设 LoginResponse 包含了 user 信息，如果后端不直接返回，
  // 可能需要在登录成功后单独请求用户信息。
  // 类型断言可能需要根据实际的 LoginResponse 结构调整。
  const response = await apiClient.post<LoginResponse>('/auth/token', form_data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data; // Axios .data 属性包含响应体
};

// (可选) 获取当前登录用户信息的函数，如果登录接口不直接返回用户信息
export const getCurrentUser = async (userId: number): Promise<User> => {
    // 用户信息应通过 /v2/users/{userId} 端点获取
    // userId 通常在登录成功后从 /v2/token 响应中获得 (作为数字ID)，并存储在状态管理中
    const response = await apiClient.get<{ data: User }>(`/users/${userId}`); // Expect a { data: User } structure
    
    // Basic check if response.data and response.data.data exist before returning
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        // This assumes the backend consistently wraps the User object in a 'data' property.
        // If the backend might sometimes return User directly, or other structures, more robust checking is needed.
        return response.data.data as User; // Type assertion as User
    } else {
        // Handle cases where the structure is not { data: User }
        // This could be an error, or the backend might directly return the User object
        // Attempt to return response.data directly if it seems like a User object, otherwise throw error
        // This is a guess; a more robust solution depends on knowing all possible backend response structures.
        if (response.data && typeof response.data === 'object' && 'id' in response.data && 'username' in response.data) {
            return response.data as User; // Type assertion as User
        }
        throw new Error('Unexpected response structure for user details.');
    }
};

// (可选) 登出函数
// export const logout = async (): Promise<void> => {
//   // 如果后端有登出端点使 token 失效
//   // await apiClient.post('/auth/logout');
//   // 清理本地存储等操作通常在 store action 中进行
// }; 