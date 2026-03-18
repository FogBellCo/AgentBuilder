import { useCallback, useRef } from 'react';
import { useSessionStore } from '@/store/session-store';
import type { IntakePayload } from '@/types/decision-tree';
import type { GapQuestion } from '@/types/gap-analysis';
import type { UserSummarySections } from '@/types/summaries';
import { postGenerateUserSummary } from '@/lib/api-client';
import {
  buildFallbackUserSummary,
  calculateTimeSavings,
  buildWhatsNext,
} from '@/lib/user-summary-builder';
import type { FallbackItem } from '@/lib/user-summary-builder';
import type { ProtectionLevel } from '@/types/decision-tree';

interface UseUserSummaryReturn {
  status: 'idle' | 'loading' | 'ready' | 'error';
  sections: UserSummarySections | null;
  manualEdits: Record<string, string>;
  errorMessage?: string;
  timeSavings: { displayText: string; monthlyHours: number } | null;
  whatsNext: string;
  fallback: {
    yourProject: FallbackItem[];
    theData: FallbackItem[];
    whatAIWouldHandle: FallbackItem[];
    howYoudSeeResults: FallbackItem[];
  } | null;
  generateUserSummary: (
    intakePayload: IntakePayload,
    gapAnswers: GapQuestion[],
    signal?: AbortSignal,
  ) => Promise<void>;
  editSection: (sectionKey: string, content: string) => void;
  getConflictingSections: () => string[];
  acceptNewForSection: (sectionKey: string) => void;
}

export function useUserSummary(): UseUserSummaryReturn {
  const store = useSessionStore();
  const previousSectionsRef = useRef<UserSummarySections | null>(null);
  const retryCountRef = useRef(0);

  const {
    userSummary,
    projectIdea,
    gatherDetails,
    refineDetails,
    presentDetails,
    conversationalAnswers,
    gapAnalysis,
    stages,
    setUserSummaryLoading,
    setUserSummaryResult,
    setUserSummaryError,
    editUserSummarySection,
    clearUserSummaryEdit,
  } = store;

  // Compute time savings from conversational answers
  const timeSavings = calculateTimeSavings(
    conversationalAnswers.workloadFrequency,
    conversationalAnswers.workloadDuration,
    conversationalAnswers.workloadPeople,
  );

  // Compute What's Next
  const protectionLevel: ProtectionLevel = stages.GATHER.result?.protectionLevel ?? 'P1';
  const snoozedCount = gapAnalysis.questions.filter(q => q.status === 'snoozed').length;
  const whatsNext = buildWhatsNext(protectionLevel, snoozedCount);

  // Compute fallback
  const fallback = buildFallbackUserSummary(
    projectIdea,
    gatherDetails,
    refineDetails,
    presentDetails,
    protectionLevel,
  );

  const generateUserSummary = useCallback(
    async (
      intakePayload: IntakePayload,
      gapAnswers: GapQuestion[],
      signal?: AbortSignal,
    ) => {
      // Save current sections for conflict detection
      previousSectionsRef.current = userSummary.sections;

      setUserSummaryLoading();
      retryCountRef.current = 0;

      const attemptGeneration = async (): Promise<void> => {
        try {
          const response = await postGenerateUserSummary(
            intakePayload,
            gapAnswers.filter(q => q.status === 'answered'),
            signal,
          );
          setUserSummaryResult(response.sections);
          retryCountRef.current = 0;
        } catch (err) {
          // Don't treat abort as an error
          if (err instanceof DOMException && err.name === 'AbortError') {
            return;
          }

          retryCountRef.current += 1;

          // After 2 retries, show fallback
          if (retryCountRef.current >= 2) {
            setUserSummaryError(
              'We couldn\'t generate your summary right now. Your answers are saved — showing a summary from your responses instead.',
            );
            return;
          }

          // Retry with backoff
          const backoff = retryCountRef.current * 2000;
          await new Promise(resolve => setTimeout(resolve, backoff));
          return attemptGeneration();
        }
      };

      await attemptGeneration();
    },
    [userSummary.sections, setUserSummaryLoading, setUserSummaryResult, setUserSummaryError],
  );

  const editSection = useCallback(
    (sectionKey: string, content: string) => {
      editUserSummarySection(sectionKey, content);
    },
    [editUserSummarySection],
  );

  const getConflictingSections = useCallback(() => {
    const current = userSummary.sections;
    const previous = previousSectionsRef.current;
    if (!current || !previous) return [];

    return Object.keys(userSummary.manualEdits).filter((key) => {
      const storeKey = key.replace('user_', '') as keyof UserSummarySections;
      return (
        previous[storeKey] !== undefined &&
        current[storeKey] !== undefined &&
        previous[storeKey] !== current[storeKey]
      );
    });
  }, [userSummary.sections, userSummary.manualEdits]);

  const acceptNewForSection = useCallback(
    (sectionKey: string) => {
      clearUserSummaryEdit(sectionKey);
    },
    [clearUserSummaryEdit],
  );

  return {
    status: userSummary.status,
    sections: userSummary.sections,
    manualEdits: userSummary.manualEdits,
    errorMessage: userSummary.errorMessage,
    timeSavings,
    whatsNext,
    fallback,
    generateUserSummary,
    editSection,
    getConflictingSections,
    acceptNewForSection,
  };
}
