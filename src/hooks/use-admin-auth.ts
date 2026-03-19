import { useState, useCallback } from 'react';
import { adminLogin, clearAdminToken, hasAdminToken, AdminAuthError } from '@/lib/admin-api-client';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminToken());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminLogin(token);
      setIsAuthenticated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setIsAuthenticated(false);
  }, []);

  const handleAuthError = useCallback((err: unknown) => {
    if (err instanceof AdminAuthError) {
      setIsAuthenticated(false);
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    handleAuthError,
  };
}
