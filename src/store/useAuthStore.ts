import { create } from 'zustand';
import { getMe, logout as apiLogout, getUserData, type User } from '../lib/api';
import { useAppStore } from './useAppStore';

interface AuthStore {
  user: User | null;
  loading: boolean;
  /** Call once on app mount — checks JWT cookie and loads user data. */
  init: () => Promise<void>;
  /** Signs out: clears cookie, resets app store, clears local user. */
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:    null,
  loading: true,

  init: async () => {
    set({ loading: true });
    try {
      const user = await getMe();
      if (user?.status === 'approved') {
        const data = await getUserData();
        if (data) {
          useAppStore.getState().loadFromRemote(data);
        }
      }
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  signOut: async () => {
    try {
      await apiLogout();
    } finally {
      useAppStore.getState().resetStore();
      set({ user: null, loading: false });
    }
  },
}));
