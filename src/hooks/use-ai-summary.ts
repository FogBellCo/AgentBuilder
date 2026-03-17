import { useState, useCallback } from 'react';
import type { IntakePayload } from '@/types/decision-tree';
import type { GapQuestion, AISummaryState } from '@/types/gap-analysis';
import { postGenerateSummary } from '@/lib/api-client';

type SummarySections = AISummaryState['sections'];

interface UseAISummaryReturn {
  status: AISummaryState['status'];
  sections: SummarySections;
  manualEdits: Record<string, string>;
  errorMessage?: string;
  generateSummary: (
    intakePayload: IntakePayload,
    gapAnswers: GapQuestion[],
    signal?: AbortSignal,
  ) => Promise<void>;
  editSection: (sectionKey: string, content: string) => void;
  clearEdit: (sectionKey: string) => void;
  /** Returns section keys that have manual edits conflicting with new generation */
  getConflictingSections: () => string[];
  /** Accept the newly generated content for a section, discarding the manual edit */
  acceptNewForSection: (sectionKey: string) => void;
}

export function useAISummary(): UseAISummaryReturn {
  const [status, setStatus] = useState<AISummaryState['status']>('idle');
  const [sections, setSections] = useState<SummarySections>(null);
  const [manualEdits, setManualEdits] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [previousSections, setPreviousSections] = useState<SummarySections>(null);

  const generateSummary = useCallback(
    async (intakePayload: IntakePayload, gapAnswers: GapQuestion[], signal?: AbortSignal) => {
      setStatus('loading');
      setErrorMessage(undefined);

      // Preserve current sections as previous for conflict detection
      setSections((current) => {
        setPreviousSections(current);
        return current;
      });

      try {
        const response = await postGenerateSummary(intakePayload, gapAnswers, signal);
        setSections(response.sections);
        setStatus('ready');
      } catch (err) {
        // Don't treat abort as an error
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Failed to generate summary';
        setErrorMessage(message);
        setStatus('error');
      }
    },
    [],
  );

  const editSection = useCallback((sectionKey: string, content: string) => {
    setManualEdits((prev) => ({ ...prev, [sectionKey]: content }));
  }, []);

  const clearEdit = useCallback((sectionKey: string) => {
    setManualEdits((prev) => {
      const next = { ...prev };
      delete next[sectionKey];
      return next;
    });
  }, []);

  const getConflictingSections = useCallback(() => {
    if (!sections || !previousSections) return [];
    return Object.keys(manualEdits).filter((key) => {
      const k = key as keyof NonNullable<SummarySections>;
      return (
        previousSections[k] !== undefined &&
        sections[k] !== undefined &&
        previousSections[k] !== sections[k]
      );
    });
  }, [sections, previousSections, manualEdits]);

  const acceptNewForSection = useCallback((sectionKey: string) => {
    setManualEdits((prev) => {
      const next = { ...prev };
      delete next[sectionKey];
      return next;
    });
  }, []);

  return {
    status,
    sections,
    manualEdits,
    errorMessage,
    generateSummary,
    editSection,
    clearEdit,
    getConflictingSections,
    acceptNewForSection,
  };
}
