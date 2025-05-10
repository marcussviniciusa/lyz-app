import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/lib/api';
import { User, AuthResponse } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, company: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Inicialize o token a partir do localStorage para garantir que o API interceptor tenha acesso imediato
      token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
      user: null,
      isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authAPI.login(email, password);
          const { token, user } = response.data.data;
          
          // Save token to localStorage for API interceptor
          localStorage.setItem('token', token);
          
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to login';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      register: async (name: string, email: string, password: string, company: string) => {
        try {
          set({ isLoading: true, error: null });
          await authAPI.register(name, email, password, company);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to register';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      forgotPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          await authAPI.forgotPassword(email);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to send reset password email';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      resetPassword: async (token: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          await authAPI.resetPassword(token, password);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to reset password';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true, error: null });
          await authAPI.changePassword(currentPassword, newPassword);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to change password';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;
