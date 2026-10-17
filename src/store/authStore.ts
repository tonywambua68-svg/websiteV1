import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    if (result) {
      set({ user: result.user, isAuthenticated: true, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },

  register: async (email: string, password: string, name: string) => {
    const result = await authService.register({ email, password, name });
    if (result) {
      set({ user: result.user, isAuthenticated: true, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    set({ user, isAuthenticated, isLoading: false });
  },
}));
