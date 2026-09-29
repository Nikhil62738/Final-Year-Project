import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// In Expo, EXPO_PUBLIC_API_URL can be set in .env
// Defaults to localhost or local network fallback
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fda-safewatch.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    let token: string | null = null;
    if (Platform.OS !== 'web') {
      token = await SecureStore.getItemAsync('userToken');
    } else {
      token = localStorage.getItem('userToken');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

export const authAPI = {
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post('/api/auth/users/register', data),

  login: (data: { emailOrPhone: string; password: string }) =>
    api.post('/api/auth/users/login', data),

  requestOtp: (data: { emailOrPhone: string }) =>
    api.post('/api/auth/users/otp/request', data),

  verifyOtp: (data: { emailOrPhone: string; otp: string }) =>
    api.post('/api/auth/users/otp/verify', data),

  forgotPasswordRequest: (data: { emailOrPhone: string }) =>
    api.post('/api/auth/users/forgot-password/request', data),

  forgotPasswordVerify: (data: { emailOrPhone: string; otp: string; newPassword: string }) =>
    api.post('/api/auth/users/forgot-password/verify', data),
};

export const complaintsAPI = {
  getPublic: (params?: { district?: string; category?: string }) =>
    api.get('/api/complaints/public', { params }),

  getMyHistory: () => api.get('/api/complaints/history'),

  track: (trackingCode: string) =>
    api.get(`/api/complaints/track/${trackingCode.toUpperCase()}`),

  checkDuplicates: (data: {
    category: string;
    description: string;
    district: string;
    taluka?: string;
    vendorName?: string;
  }) => api.post('/api/complaints/check-duplicates', data),

  submit: async (formData: FormData) => {
    let token: string | null = null;
    if (Platform.OS !== 'web') {
      token = await SecureStore.getItemAsync('userToken');
    } else {
      token = localStorage.getItem('userToken');
    }
    return axios.post(`${API_BASE_URL}/api/complaints`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 30000,
    });
  },

  vote: (id: string) => api.post(`/api/complaints/${id}/vote`),
};

export const foodFactsAPI = {
  getProduct: (barcode: string) =>
    api.post('/api/products/scan', { barcode }),
  scanImage: (query: string) =>
    api.post('/api/products/scan', { query, isImageUpload: true }),
};

export const userAPI = {
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (data: { name?: string; phone?: string; preferredLanguage?: string; avatar?: string }) =>
    api.patch('/api/users/me', data),
  getSavedProducts: () => api.get('/api/users/me/saved-products'),
  saveProduct: (product: {
    barcode: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    nutriscoreGrade?: string;
  }) => api.post('/api/users/me/saved-products', product),
  removeSavedProduct: (id: string) => api.delete(`/api/users/me/saved-products/${id}`),
};

export default api;
