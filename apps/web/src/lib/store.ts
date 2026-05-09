import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  username?: string | null;
  walletId?: string;
  avatar?: string | null;
  status?: string;
  // UI/UX sozlamalar
  theme?: string;
  fontSize?: string;
  language?: string;
  notifyNewOrder?: boolean;
  notifyChat?: boolean;
  notifySystem?: boolean;
  notifyApplication?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
  setTheme: (theme: string) => void;
  setFontSize: (fontSize: string) => void;
  setLanguage: (language: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          set({ user: JSON.parse(userStr), isAuthenticated: true });
        } catch {
          localStorage.removeItem('user');
        }
      }
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  setTheme: (theme: string) => {
    localStorage.setItem('theme', theme);
    if (typeof window !== 'undefined') {
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      document.documentElement.setAttribute('data-theme', resolved);
    }
    const current = get().user;
    if (current) {
      const updated = { ...current, theme };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated });
    }
  },

  setFontSize: (fontSize: string) => {
    localStorage.setItem('fontSize', fontSize);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-fontsize', fontSize);
    }
    const current = get().user;
    if (current) {
      const updated = { ...current, fontSize };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated });
    }
  },

  setLanguage: (language: string) => {
    localStorage.setItem('language', language);
    const current = get().user;
    if (current) {
      const updated = { ...current, language };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));
