import type { StateStorage } from 'zustand/middleware';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { removeToken, setToken } from '@/lib/auth/utils';
import { storage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

export type User = {
  id: number;
  nativeLanguage: string;
  learningLanguage: string;
  avatarUrl: string;
  exp: number;
  coin: number;
  streakDays: number;
  lastStudiedAt: string;
  email: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: User;
};

type Status = 'idle' | 'signOut' | 'signIn';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: Status;

  login: (data: AuthResponse) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (userData: Partial<User>) => void;
};

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.remove(name);
  },
};

const store = create<AuthState>()(
  persist(
    set => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle' as Status,

      login: (data) => {
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          status: 'signIn',
        });
        setToken({ access: data.access_token, refresh: data.refresh_token });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: 'signOut',
        });
        removeToken();
      },

      updateTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        setToken({ access: accessToken, refresh: refreshToken });
      },

      updateUser: userData =>
        set(state => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        status: state.status,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && state?.user) {
          store.setState({ status: 'signIn' });
        }
        else {
          store.setState({ status: 'signOut' });
        }
      },
    },
  ),
);

export { store };
export const useAuthStore = createSelectors(store);
