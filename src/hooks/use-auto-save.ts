import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/session-store';
import { saveSubmission } from '@/lib/api-client';

const DEBOUNCE_MS = 2000;
const STORAGE_KEY = 'ucsd-agentbuilder-email';

function getEmail(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSnapshotRef = useRef<string>('');

  useEffect(() => {
    const unsubscribe = useSessionStore.subscribe((state) => {
      const email = getEmail();
      if (!email) return;

      if (!state.projectIdea) return;

      const snapshot = state.getSessionSnapshot();
      const serialized = JSON.stringify(snapshot);

      if (serialized === prevSnapshotRef.current) return;
      prevSnapshotRef.current = serialized;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const title = state.projectIdea?.title || '';
        const status = 'draft';

        saveSubmission(state.sessionId, {
          email,
          title,
          status,
          sessionState: snapshot,
        }).catch((err) => {
          console.warn('[auto-save] Failed:', err);
        });
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
