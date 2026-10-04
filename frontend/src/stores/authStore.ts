import { create } from 'zustand';
import {
  apiLogin,
  apiSignup,
  apiGetMe,
  apiUpdatePlan,
  UserAuth,
  BoardLimitInfo,
} from '@/lib/api';

const TOKEN_KEY = 'canvasconnect_auth_token';

const PLAN_MAX_LIMITS: Record<string, number> = {
  free: 3,
  plus: 10,
  premium: 20,
};

interface AuthState {
  token: string | null;
  user: UserAuth | null;
  boardLimit: BoardLimitInfo;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup';

  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, plan?: 'free' | 'plus' | 'premium', avatar?: string) => Promise<void>;
  logout: () => void;
  updatePlan: (newPlan: 'free' | 'plus' | 'premium') => Promise<void>;
  setBoardLimitCount: (count: number) => void;
  openAuthModal: (tab?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  boardLimit: { limit: 3, current: 0 },
  isAuthenticated: false,
  isLoading: true,
  isAuthModalOpen: false,
  authModalTab: 'login',

  initializeAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const data = await apiGetMe();
      set({
        token,
        user: data.user,
        boardLimit: data.boardLimit,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      set({
        token: null,
        user: null,
        boardLimit: { limit: 3, current: 0 },
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    const data = await apiLogin({ email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    set({
      token: data.token,
      user: data.user,
      boardLimit: data.boardLimit,
      isAuthenticated: true,
      isAuthModalOpen: false,
    });
  },

  signup: async (name, email, password, plan = 'free', avatar = '🎨') => {
    const data = await apiSignup({ name, email, password, plan, avatar });
    localStorage.setItem(TOKEN_KEY, data.token);
    set({
      token: data.token,
      user: data.user,
      boardLimit: data.boardLimit,
      isAuthenticated: true,
      isAuthModalOpen: false,
    });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({
      token: null,
      user: null,
      boardLimit: { limit: 3, current: 0 },
      isAuthenticated: false,
    });
  },

  updatePlan: async (newPlan) => {
    const data = await apiUpdatePlan(newPlan);
    set({
      user: data.user,
      boardLimit: data.boardLimit,
    });
  },

  setBoardLimitCount: (count) => {
    set((state) => ({
      boardLimit: {
        ...state.boardLimit,
        current: count,
      },
    }));
  },

  openAuthModal: (tab = 'login') => {
    set({ isAuthModalOpen: true, authModalTab: tab });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false });
  },
}));
