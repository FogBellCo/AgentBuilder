import { useState, useEffect, useCallback } from 'react';
import { fetchSubmissions } from '@/lib/api-client';
import type { SubmissionListItem } from '@/lib/api-client';

/**
 * Fetch the current user's submissions.
 * Auth is handled by the cookie — no email parameter needed.
 * The `isAuthenticated` flag controls whether to fetch.
 */
export function useSubmissions(isAuthenticated: boolean): {
  submissions: SubmissionListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setSubmissions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchSubmissions()
      .then((res) => {
        if (!cancelled) {
          setSubmissions(res.data);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchKey]);

  return { submissions, isLoading, error, refetch };
}
