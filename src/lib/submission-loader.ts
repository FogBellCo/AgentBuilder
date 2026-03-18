import { fetchSubmission } from '@/lib/api-client';
import { useSessionStore } from '@/store/session-store';

/**
 * Load a submission from the server into the Zustand store.
 * Returns the submission version for auto-save tracking.
 */
export async function loadSubmission(submissionId: string): Promise<{
  version: number;
  status: string;
}> {
  const { submission } = await fetchSubmission(submissionId);

  // Load the server's session state into the Zustand store
  useSessionStore.getState().loadSession(submission.sessionState);

  return {
    version: submission.version,
    status: submission.status,
  };
}
