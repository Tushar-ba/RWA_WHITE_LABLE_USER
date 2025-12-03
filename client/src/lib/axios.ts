import axios, { AxiosRequestConfig, Method } from 'axios';
import { ENV } from '@shared/constants';

// Main axios instance
const axiosMain = axios.create({
  baseURL: VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
axiosMain.interceptors.request.use(
  (config) => {
    // Add Authorization header if token exists
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      if (config.headers && typeof config.headers === 'object') {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosMain.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors (token expiration/invalid auth)
    if (error.response?.status === 401) {
      // Check if we're in a browser environment and not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Clear auth state and redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    
    if (error.response?.data?.message) {
      const cleanError = new Error(error.response.data.message);
      cleanError.name = 'APIError';
      return Promise.reject(cleanError);
    }
    return Promise.reject(error);
  }
);

// Utility to change base URL
export const setBaseUrl = (baseUrl: string) => {
  axiosMain.defaults.baseURL = baseUrl;
};

// Clean utility function for API requests
export interface AxiosRequestUtilOptions {
  url: string;
  method?: Method;
  payload?: any;
  baseUrl?: string;
  token?: string;
  customHeaders?: Record<string, string>;
}

function getAuthToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');

    if (authStorage) {
      const authData = JSON.parse(authStorage);
      return authData?.state?.token || null;
    }

    return null;
  } catch (error) {
    console.error('Error parsing auth token from localStorage:', error);
    return null;
  }
}

export async function axiosRequestUtil<T = any>({
  url,
  method = 'GET',
  payload,
  baseUrl,
  customHeaders = {},
}: AxiosRequestUtilOptions): Promise<T> {
  // Set Authorization and merge custom headers
   const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : { }),
    ...customHeaders,
  };

  // Optionally set base URL
  if (baseUrl) setBaseUrl(baseUrl);

  const config: AxiosRequestConfig = {
    method,
    url,
    headers,
  };

  if (payload) {
    config.data = payload;
  }

  const response = await axiosMain.request<T>(config);
  return response.data;
}

export default axiosMain; 