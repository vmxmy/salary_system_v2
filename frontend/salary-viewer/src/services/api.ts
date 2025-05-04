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
    console.error('API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (Unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API Response Interceptor Error:', error.response || error.message || error);
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

// Ensure the instance is exported as default
export default apiClient; 