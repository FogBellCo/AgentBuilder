import { useState, useEffect, useCallback } from 'react';
import { fetchSubmissions } from '@/lib/api-client';
import type { SubmissionListItem } from '@/lib/api-client';

export function useSubmissions(email: string | null): {
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
    if (!email) {
      setSubmissions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchSubmissions(email)
      .then((res) => {
        if (!cancelled) {
          setSubmissions(res.submissions);
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
  }, [email, fetchKey]);

  return { submissions, isLoading, error, refetch };
}
