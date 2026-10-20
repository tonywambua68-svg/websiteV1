import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';
import apiClient from './api';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }
    
    return null;
  },

  async register(data: RegisterData): Promise<AuthResponse | null> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }
    
    return null;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};

export default authService;
