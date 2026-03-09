import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,

  initializeAuth: async () => {
    // Prevent multiple initializations if already ready
    if (get().isAuthReady) return;

    try {
      // Use Server Action to check session
      const { checkSession } = await import('@/app/stores/[id]/components/shared/actions/auth');
      const result = await checkSession();

      if (result.success && result.user) {
        set({ user: result.user as User, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth Init Error:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isAuthReady: true });
    }

    // We removed the real-time auth listener since we can't use createClient.
    // The SessionMonitor component will handle tab focus checks.
  },

  signOut: async () => {
    try {
      const { logout } = await import('@/app/stores/[id]/components/shared/actions/auth');
      await logout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },
}));

