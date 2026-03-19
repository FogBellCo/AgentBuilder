import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/store/session-store';
import { saveSubmission, createSubmission, fetchSubmission, ApiConflictError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

const DEBOUNCE_MS = 2000;
const OFFLINE_QUEUE_KEY = 'ab-offline-queue';

interface PendingSave {
  submissionId: string;
  sessionState: Record<string, unknown>;
  title: string;
  expectedVersion: number;
  queuedAt: number;
}

function fastHash(obj: unknown): string {
  return JSON.stringify(obj);
}

function getOfflineQueue(): PendingSave[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setOfflineQueue(queue: PendingSave[]): void {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function useAutoSave() {
  const { user, isAuthenticated } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHashRef = useRef<string>('');
  const versionRef = useRef<number>(1);
  const submissionIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const offlineQueueRef = useRef<PendingSave[]>(getOfflineQueue());

  const flushOfflineQueue = useCallback(async () => {
    const queue = offlineQueueRef.current;
    if (queue.length === 0) return;

    // Only use the latest entry per submissionId
    const latest = new Map<string, PendingSave>();
    for (const entry of queue) {
      const existing = latest.get(entry.submissionId);
      if (!existing || entry.queuedAt > existing.queuedAt) {
        latest.set(entry.submissionId, entry);
      }
    }

    for (const entry of latest.values()) {
      try {
        const result = await saveSubmission(entry.submissionId, {
          title: entry.title,
          sessionState: entry.sessionState,
          expectedVersion: entry.expectedVersion,
        });
        versionRef.current = result.submission.version;
      } catch (err) {
        console.warn('[auto-save] Offline queue flush failed:', err);
      }
    }

    offlineQueueRef.current = [];
    setOfflineQueue([]);
  }, []);

  // Flush offline queue when connectivity returns
  useEffect(() => {
    const handleOnline = () => {
      flushOfflineQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushOfflineQueue]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = useSessionStore.subscribe((state) => {
      if (!user) return;
      if (!state.projectIdea) return;

      const snapshot = state.getSessionSnapshot();
      const hash = fastHash(snapshot);
      if (hash === prevHashRef.current) return;
      prevHashRef.current = hash;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        performSave(
          state.sessionId,
          snapshot as Record<string, unknown>,
          state.projectIdea?.title || '',
        );
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  async function performSave(
    sessionId: string,
    sessionState: Record<string, unknown>,
    title: string,
  ) {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      // If we don't have a server-side submission yet, create one
      if (!submissionIdRef.current) {
        const result = await createSubmission({
          sessionId,
          title,
          sessionState,
        });
        submissionIdRef.current = result.submission.id;
        versionRef.current = result.submission.version;
        isSavingRef.current = false;
        return;
      }

      const result = await saveSubmission(submissionIdRef.current, {
        title,
        sessionState,
        expectedVersion: versionRef.current,
      });
      versionRef.current = result.submission.version;
    } catch (err) {
      if (err instanceof ApiConflictError) {
        // Another tab saved a newer version. Reload from server.
        await handleConflict(submissionIdRef.current!);
      } else if (!navigator.onLine) {
        enqueueOffline({
          submissionId: submissionIdRef.current || sessionId,
          sessionState,
          title,
          expectedVersion: versionRef.current,
          queuedAt: Date.now(),
        });
      } else {
        console.warn('[auto-save] Failed:', err);
      }
    } finally {
      isSavingRef.current = false;
    }
  }

  async function handleConflict(submissionId: string) {
    try {
      const { submission } = await fetchSubmission(submissionId);
      useSessionStore.getState().loadSession(submission.sessionState);
      versionRef.current = submission.version;
      prevHashRef.current = fastHash(submission.sessionState);
    } catch (err) {
      console.warn('[auto-save] Conflict resolution failed:', err);
    }
  }

  function enqueueOffline(entry: PendingSave) {
    offlineQueueRef.current.push(entry);
    // Keep max 50 entries
    if (offlineQueueRef.current.length > 50) {
      offlineQueueRef.current = offlineQueueRef.current.slice(-50);
    }
    setOfflineQueue(offlineQueueRef.current);
  }

  /** Set the active submission ID and version (called when loading a submission from server). */
  return {
    setActiveSubmission: (id: string, version: number) => {
      submissionIdRef.current = id;
      versionRef.current = version;
    },
    currentVersion: () => versionRef.current,
    submissionId: () => submissionIdRef.current,
  };
}
