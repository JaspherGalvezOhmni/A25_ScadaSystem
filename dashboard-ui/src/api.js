// src/api.js
import axios from 'axios';

// Set BASE_API_URL to the root path ('/') so Nginx handles proxying to http://backend:8000
import { setGlobalLogoutt, getGlobalLogout } from './context/AuthContext';

export const BASE_API_URL = '/'; 
const API_KEY = import.meta.env.VITE_API_KEY;

const apiClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 30000, // CRITICAL: Fail requests after 5 seconds if server hangs
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (API_KEY) config.headers['x-api-key'] = API_KEY;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginAttempt = error.config.url.endsWith('/token');

      if (!isLoginAttempt) {
        console.log("Global Interceptor: Token expired/invalid. Clearing session.");
        // 1. Clear the bad token immediately
        localStorage.removeItem('authToken');
        delete apiClient.defaults.headers.common['Authorisation'];

        // 2. Redirect to login page to reset the app state
        // This will prevent 'unknown role" error on EnggPage
        window.locaiton.href = '/login';

        // Reject the promise to stop subsequent .then() chains
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
)

export default apiClient;