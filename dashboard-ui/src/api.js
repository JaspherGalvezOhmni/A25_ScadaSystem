// src/api.js
import axios from 'axios';

export const BASE_API_URL = 'http://localhost:8000'; // Or your 192.168.x.x IP
const API_KEY = import.meta.env.VITE_API_KEY;

const apiClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 5000, // CRITICAL FIX: Fail requests after 5 seconds if server hangs
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