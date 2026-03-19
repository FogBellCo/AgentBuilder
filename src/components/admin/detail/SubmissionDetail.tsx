import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminSubmission, useSubmissionStatusUpdate, useSubmissionAssign, useScoreOverrides, useFollowUpQuestion } from '@/hooks/use-admin-submission';
import { useAdminTeam } from '@/hooks/use-admin-team';
import { useAddNote } from '@/hooks/use-admin-notes';
import { exportSingleSubmission } from '@/lib/admin-api-client';
import type { ScoreOverrides } from '@/types/admin';
import { DetailHeader } from './DetailHeader';
import { IntakeFormatView } from './IntakeFormatView';
import { InternalNotes } from './InternalNotes';
import { ActivityTimeline } from './ActivityTimeline';
import { ScoreOverridePanel } from './ScoreOverridePanel';
import { FollowUpModal } from './FollowUpModal';

export function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useAdminSubmission(id ?? '');
  const statusMutation = useSubmissionStatusUpdate(id ?? '');
  const assignMutation = useSubmissionAssign(id ?? '');
  const scoresMutation = useScoreOverrides(id ?? '');
  const questionMutation = useFollowUpQuestion(id ?? '');
  const noteMutation = useAddNote(id ?? '');
  const { data: teamData } = useAdminTeam();
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  const handleStatusChange = useCallback(
    (status: string) => statusMutation.mutate(status),
    [statusMutation],
  );

  const handleAddNote = useCallback(
    (content: string) => noteMutation.mutate({ author: 'OSI Admin', content }),
    [noteMutation],
  );

  const handleScoreOverrides = useCallback(
    (overrides: ScoreOverrides) => scoresMutation.mutate(overrides),
    [scoresMutation],
  );

  const handleSendQuestion = useCallback(
    (question: string) => {
      questionMutation.mutate(question, {
        onSuccess: () => setQuestionModalOpen(false),
      });
    },
    [questionMutation],
  );

  const handleExport = useCallback(
    async (format: string) => {
      if (!id) return;
      try {
        const blob = await exportSingleSubmission(id, format as 'json' | 'markdown');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `submission-${id}.${format === 'json' ? 'json' : 'md'}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export downloaded');
      } catch {
        toast.error('Failed to export submission');
      }
    },
    [id],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center text-sm text-red-500">
        {error instanceof Error ? error.message : 'Failed to load submission.'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DetailHeader
        title={data.title}
        email={data.email}
        status={data.status}
        completeness={data.completeness}
        assignedTo={data.assignedTo}
        submittedAt={data.submittedAt}
        onStatusChange={handleStatusChange}
        onAskQuestion={() => setQuestionModalOpen(true)}
        onExport={handleExport}
        teamMembers={teamData?.members ?? []}
        onAssign={(assignedTo) => assignMutation.mutate(assignedTo)}
      />

      <IntakeFormatView sessionState={data.sessionState} />

      <ScoreOverridePanel
        sessionState={data.sessionState}
        overrides={data.scoreOverrides}
        onSave={handleScoreOverrides}
        isSaving={scoresMutation.isPending}
      />

      <InternalNotes
        notes={data.notes}
        onAddNote={handleAddNote}
        isSubmitting={noteMutation.isPending}
      />

      <ActivityTimeline events={data.timeline} />

      <FollowUpModal
        email={data.email}
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        onSend={handleSendQuestion}
        isSending={questionMutation.isPending}
      />
    </div>
  );
}
