import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';

// Untuk Android Emulator gunakan 10.0.2.2, untuk fisik/web gunakan IP LAN komputer
const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: Tambahkan Bearer token otomatis
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor: Tangani 401 jika session expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await storage.clearAuth();
    }
    return Promise.reject(error);
  }
);

export default api;

