import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { getAuthMe, postMagicLink, postLogout } from '@/lib/api-client';
import type { AuthUser } from '@/lib/api-client';

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  magicLinkSent: boolean;
  clearMagicLinkSent: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/**
 * Core auth state management hook. Used by AuthProvider.
 */
export function useAuthState(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: me } = await getAuthMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendMagicLink = useCallback(async (email: string) => {
    setError(null);
    try {
      await postMagicLink(email);
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await postLogout();
    } catch {
      // Ignore errors — clear local state regardless
    }
    setUser(null);
    setMagicLinkSent(false);
  }, []);

  const clearMagicLinkSent = useCallback(() => {
    setMagicLinkSent(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    error,
    sendMagicLink,
    logout,
    refresh,
    magicLinkSent,
    clearMagicLinkSent,
  };
}
