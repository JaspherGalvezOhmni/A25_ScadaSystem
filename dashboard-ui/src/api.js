// src/api.js
import axios from 'axios';

// Set BASE_API_URL to the root path ('/') so Nginx handles proxying to http://backend:8000
export const BASE_API_URL = '/'; 
const API_KEY = import.meta.env.VITE_API_KEY;

const apiClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 5000, // CRITICAL: Fail requests after 5 seconds if server hangs
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

export default apiClient;