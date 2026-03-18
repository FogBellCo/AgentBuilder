import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminSubmissions,
  updateSubmissionStatus,
  assignSubmission,
  toggleFlag,
  batchAction,
} from '@/lib/admin-api-client';
import type { SubmissionFilters, PaginatedAdminResponse } from '@/types/admin';

export function useAdminSubmissions(filters: SubmissionFilters) {
  return useQuery({
    queryKey: ['admin', 'submissions', filters],
    queryFn: () => fetchAdminSubmissions(filters),
    staleTime: 30_000,
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateSubmissionStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'submissions'] });
      const queries = queryClient.getQueriesData<PaginatedAdminResponse>({
        queryKey: ['admin', 'submissions'],
      });
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(key, {
            ...data,
            submissions: data.submissions.map((s) =>
              s.id === id ? { ...s, status } : s,
            ),
          });
        }
      }
    },
    onSuccess: () => {
      toast.success('Status updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });
}

export function useAssignSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string | null }) =>
      assignSubmission(id, assignedTo),
    onSuccess: () => {
      toast.success('Assignment updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update assignment');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });
}

export function useToggleFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, flagged }: { id: string; flagged: boolean }) =>
      toggleFlag(id, flagged),
    onMutate: async ({ id, flagged }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'submissions'] });
      const queries = queryClient.getQueriesData<PaginatedAdminResponse>({
        queryKey: ['admin', 'submissions'],
      });
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(key, {
            ...data,
            submissions: data.submissions.map((s) =>
              s.id === id ? { ...s, flagged } : s,
            ),
          });
        }
      }
    },
    onSuccess: (_data, { flagged }) => {
      toast.success(flagged ? 'Submission flagged' : 'Flag removed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to toggle flag');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });
}

export function useBatchAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      action,
      params,
    }: {
      ids: string[];
      action: 'change_status' | 'archive' | 'unarchive';
      params?: { status?: string };
    }) => batchAction(ids, action, params),
    onSuccess: (data) => {
      toast.success(`${data.affected} submission${data.affected === 1 ? '' : 's'} updated`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Batch action failed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });
}
