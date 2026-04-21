import { create } from 'zustand';
import { authAPI } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(username, password);
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false 
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const response = await authAPI.me();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      get().logout();
    }
  },
}));
