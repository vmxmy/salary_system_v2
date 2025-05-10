import axios from 'axios';

// Get the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'; // Default fallback
// const AUTH_STORAGE_KEY = 'salaryAppAuth'; // Key for localStorage - Old Basic Auth Key
const AUTH_TOKEN_KEY = 'authToken'; // New Key for JWT localStorage

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Set a reasonable timeout (10 seconds)
});

// --- JWT Authentication Helper Functions ---

/**
 * Stores the JWT token in localStorage.
 */
export const storeAuthToken = (token: string) => {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        // console.log('Auth token stored in localStorage.');
    } catch (e) {
        console.error('Failed to store auth token in localStorage:', e);
    }
};

/**
 * Retrieves the JWT token from localStorage.
 */
const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to retrieve auth token from localStorage:', e);
        return null;
    }
};

/**
 * Clears the JWT token from localStorage.
 */
export const clearAuthToken = () => {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        // console.log('Auth token cleared from localStorage.');
    } catch (e) {
        console.error('Failed to clear auth token from localStorage:', e);
    }
};

// --- Old Basic Auth Helper Functions (Commented Out) ---
/*
/**
 * Stores Base64 encoded credentials in localStorage.
 * WARNING: localStorage is not secure for sensitive data in production.
 * /
export const storeCredentials = (username?: string, password?: string) => {
    if (username && password) {
        const basicAuth = btoa(`${username}:${password}`);
        try {
            localStorage.setItem(AUTH_STORAGE_KEY, basicAuth);
            console.log('Credentials stored in localStorage.');
        } catch (e) {
            console.error('Failed to store credentials in localStorage:', e);
            // Handle potential storage errors (e.g., quota exceeded)
        }
    } else {
        console.warn('Attempted to store empty credentials.');
    }
};

/**
 * Retrieves Base64 encoded credentials from localStorage.
 * /
const getStoredAuthHeader = (): string | null => {
    try {
        return localStorage.getItem(AUTH_STORAGE_KEY);
    } catch (e) {
        console.error('Failed to retrieve credentials from localStorage:', e);
        return null;
    }
};

/**
 * Clears stored credentials from localStorage.
 * /
export const clearCredentials = () => {
    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        console.log('Credentials cleared from localStorage.');
    } catch (e) {
        console.error('Failed to clear credentials from localStorage:', e);
    }
};
*/

// --- Axios Interceptors ---

// Request interceptor to add JWT Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const requestTimestamp = new Date().toISOString();
    console.log(`[API Interceptor - Request] ${requestTimestamp} - URL: ${config.url}`, config); // Log request
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.debug('Authorization header added with JWT token.');
    } else {
       // Ensure Authorization header is removed if no token exists
       delete config.headers.Authorization;
       // console.debug('No JWT token found. Authorization header removed.');
    }
    return config;
  },
  (error) => {
    const errorTimestamp = new Date().toISOString();
    console.error(`[API Interceptor - Request Error] ${errorTimestamp} - URL: ${error.config?.url}`, error); // Log request error
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (Unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    const responseTimestamp = new Date().toISOString();
    console.log(`[API Interceptor - Response] ${responseTimestamp} - URL: ${response.config.url} - Status: ${response.status}`, response); // Log response
    return response;
  },
  (error) => {
    const errorTimestamp = new Date().toISOString();
    console.error(`[API Interceptor - Response Error] ${errorTimestamp} - URL: ${error.config?.url} - Status: ${error.response?.status}`, error.response || error.message || error); // Log response error
    if (error.response && error.response.status === 401) {
        console.warn('Received 401 Unauthorized. Clearing token and logging out.');
        clearAuthToken();
        window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Specific API Call Functions ---

/**
 * Fetches the list of distinct establishment types.
 */
export const fetchEstablishmentTypes = async (): Promise<string[]> => {
    try {
        // 使用连字符而非下划线，与后端保持一致
        const response = await apiClient.get<string[]>('/api/establishment-types');
        return response.data || []; // Return data or empty array on failure
    } catch (error) {
        console.error("Failed to fetch establishment types:", error);
        // Depending on requirements, you might want to re-throw or return empty array
        // alert('Could not load establishment types for filtering.'); // Optional user feedback
        return []; // Return empty array to prevent breaking the Select component
    }
};

/**
 * Fetches the list of distinct department names.
 */
export const fetchDepartments = async (): Promise<string[]> => {
    try {
        const response = await apiClient.get<string[]>('/api/departments');
        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        return [];
    }
};

/**
 * Fetches the list of distinct unit names.
 */
export const fetchUnits = async (): Promise<string[]> => {
    try {
        const response = await apiClient.get<string[]>('/api/units');
        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch units:", error);
        return [];
    }
};

/**
 * Fetches the field definitions for salary data.
 * These definitions are used to dynamically generate table columns.
 */
export interface SalaryFieldDefinition {
    key: string;
    dataIndex: string;
    title: string;
    group: string;
    type: string;
    sortable: boolean;
    align?: 'left' | 'right' | 'center';
    render?: string;
    render_type?: string;
    fixed?: 'left' | 'right';
    width?: number;
}

export const fetchSalaryFieldDefinitions = async (): Promise<SalaryFieldDefinition[]> => {
    try {
        const response = await apiClient.get<SalaryFieldDefinition[]>('/api/salary_data/fields');
        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch salary field definitions:", error);
        return [];
    }
  };

  // --- Email Server Configuration API Calls ---

  // Define interfaces for EmailConfig data based on Pydantic models
  export interface EmailConfigCreateData {
    server_name: string;
    host: string;
    port: number;
    use_tls: boolean;
    use_ssl: boolean;
    username: string;
    password: string;
    sender_email: string;
    is_default: boolean;
  }

  export interface EmailConfigUpdateData extends Partial<EmailConfigCreateData> {}

  export interface EmailConfigResponse {
    id: number;
    server_name: string;
    host: string;
    port: number;
    use_tls: boolean;
    use_ssl: boolean;
    username: string;
    sender_email: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    // password will not be in response
  }

  interface EmailTestResponse {
      success: boolean;
      message: string;
  }

  export const getEmailConfigs = async (): Promise<EmailConfigResponse[]> => {
    try {
      const response = await apiClient.get<{ data: EmailConfigResponse[], total: number }>('/api/email-configs');
      return response.data.data || [];
    } catch (error) {
      console.error("Failed to fetch email configs:", error);
      throw error; // Re-throw to be handled by caller
    }
  };

  export const createEmailConfig = async (configData: EmailConfigCreateData): Promise<EmailConfigResponse> => {
    try {
      const response = await apiClient.post<EmailConfigResponse>('/api/email-configs', configData);
      return response.data;
    } catch (error) {
      console.error("Failed to create email config:", error);
      throw error;
    }
  };

  export const updateEmailConfig = async (id: number, configData: EmailConfigUpdateData): Promise<EmailConfigResponse> => {
    try {
      const response = await apiClient.put<EmailConfigResponse>(`/api/email-configs/${id}`, configData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update email config ${id}:`, error);
      throw error;
    }
  };

  export const deleteEmailConfig = async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/email-configs/${id}`);
    } catch (error) {
      console.error(`Failed to delete email config ${id}:`, error);
      throw error;
    }
  };

  export const testEmailConfig = async (id: number): Promise<EmailTestResponse> => {
    const callTimestamp = new Date().toISOString();
    console.log(`[api.ts - testEmailConfig START] ${callTimestamp} - Testing config ID: ${id}`);
    try {
      const postTimestamp = new Date().toISOString();
      console.log(`[api.ts - testEmailConfig PRE-POST] ${postTimestamp} - About to POST for ID: ${id} to URL: /api/email-configs/${id}/test`);
      const response = await apiClient.post<EmailTestResponse>(`/api/email-configs/${id}/test`);
      const responseTimestamp = new Date().toISOString();
      console.log(`[api.ts - testEmailConfig POST-SUCCESS] ${responseTimestamp} - Successfully received response for ID: ${id}`, response.data);
      return response.data;
    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[api.ts - testEmailConfig POST-ERROR] ${errorTimestamp} - Failed to test email config ${id}:`, error);
      return { success: false, message: `Failed to test configuration: ${error instanceof Error ? error.message : String(error)}` };
    } finally {
      const finallyTimestamp = new Date().toISOString();
      console.log(`[api.ts - testEmailConfig FINALLY] ${finallyTimestamp} - Finished testing attempt for ID: ${id}`);
    }
  };

  // Ensure the instance is exported as default
  export default apiClient;