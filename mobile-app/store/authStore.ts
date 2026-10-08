import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  preferredLanguage?: string;
  rewardPoints?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => Promise<void>;
  updateUser: (partialUser: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  setAuth: async (user, token) => {
    set({ user, token });
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
      } else {
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
      }
    } catch (_) {}
  },

  updateUser: async (partialUser) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partialUser };
    set({ user: updated });
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('userData', JSON.stringify(updated));
      } else {
        localStorage.setItem('userData', JSON.stringify(updated));
      }
    } catch (_) {}
  },

  logout: async () => {
    set({ user: null, token: null });
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
      } else {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      }
    } catch (_) {}
  },

  loadAuth: async () => {
    try {
      let token: string | null = null;
      let userData: string | null = null;
      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync('userToken');
        userData = await SecureStore.getItemAsync('userData');
      } else {
        token = localStorage.getItem('userToken');
        userData = localStorage.getItem('userData');
      }
      if (token && userData) {
        set({ token, user: JSON.parse(userData) });
      }
    } catch (_) {}
  },
}));
