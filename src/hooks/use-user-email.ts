import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ucsd-agentbuilder-email';

// Shared listeners so every hook instance re-renders together
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
function notify() {
  listeners.forEach((cb) => cb());
}

export function useUserEmail(): {
  email: string | null;
  setEmail: (email: string) => void;
  clearEmail: () => void;
  isIdentified: boolean;
} {
  const email = useSyncExternalStore(subscribe, getSnapshot);

  const setEmail = useCallback((value: string) => {
    localStorage.setItem(STORAGE_KEY, value);
    notify();
  }, []);

  const clearEmail = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    notify();
  }, []);

  return { email, setEmail, clearEmail, isIdentified: email !== null };
}
