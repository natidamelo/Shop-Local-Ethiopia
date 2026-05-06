import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';
import { useCartStore, loadUserCart, saveUserCart } from './cartStore';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  mfaEnabled?: boolean;
  addresses?: Address[];
}

interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, mfaToken?: string) => Promise<{ requiresMfa?: boolean }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password, mfaToken) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password, mfaToken });
          if (res.data.requiresMfa) {
            set({ isLoading: false });
            return { requiresMfa: true };
          }
          const { user, accessToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          set({ user, accessToken, isAuthenticated: true, isLoading: false });
          loadUserCart(user._id);
          return {};
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.message || 'Login failed');
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          await api.post('/auth/register', { name, email, password });
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.message || 'Registration failed');
        }
      },

      logout: async () => {
        const currentUser = get().user;
        if (currentUser) {
          saveUserCart(currentUser._id);
        }
        try {
          await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('promo_v3_dismissed_at'); // show promo again after logout
        set({ user: null, accessToken: null, isAuthenticated: false });
        useCartStore.getState().clearCart();
      },

      updateUser: (updates) => {
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }));
      },

      fetchProfile: async () => {
        try {
          const res = await api.get('/users/profile');
          set({ user: res.data.data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // If the persisted state says authenticated but there's no token, clear it
        if (state && state.isAuthenticated && !state.accessToken) {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
        }
        // Keep localStorage in sync with the persisted token
        if (state?.accessToken) {
          localStorage.setItem('accessToken', state.accessToken);
        } else {
          localStorage.removeItem('accessToken');
        }
      },
    }
  )
);
