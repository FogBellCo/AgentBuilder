import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminSubmission,
  updateSubmissionStatus,
  assignSubmission,
  toggleFlag,
  updateScoreOverrides,
  sendFollowUpQuestion,
} from '@/lib/admin-api-client';
import type { ScoreOverrides } from '@/types/admin';

export function useAdminSubmission(id: string) {
  return useQuery({
    queryKey: ['admin', 'submission', id],
    queryFn: () => fetchAdminSubmission(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useSubmissionStatusUpdate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => updateSubmissionStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submission', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });
}

export function useSubmissionAssign(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignedTo: string | null) => assignSubmission(id, assignedTo),
    onSuccess: () => {
      toast.success('Assignment updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update assignment');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submission', id] });
    },
  });
}

export function useSubmissionFlag(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (flagged: boolean) => toggleFlag(id, flagged),
    onSuccess: (_data, flagged) => {
      toast.success(flagged ? 'Submission flagged' : 'Flag removed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to toggle flag');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submission', id] });
    },
  });
}

export function useScoreOverrides(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (overrides: ScoreOverrides) => updateScoreOverrides(id, overrides),
    onSuccess: () => {
      toast.success('Score overrides saved');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save score overrides');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submission', id] });
    },
  });
}

export function useFollowUpQuestion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (question: string) => sendFollowUpQuestion(id, question),
    onSuccess: () => {
      toast.success('Follow-up question sent');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send question');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submission', id] });
    },
  });
}
