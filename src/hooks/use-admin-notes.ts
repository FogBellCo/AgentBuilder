import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchAdminNotes, postAdminNote } from '@/lib/admin-api-client';

export function useAdminNotes(submissionId: string) {
  return useQuery({
    queryKey: ['admin', 'notes', submissionId],
    queryFn: () => fetchAdminNotes(submissionId),
    staleTime: 30_000,
    enabled: !!submissionId,
  });
}

export function useAddNote(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ author, content }: { author: string; content: string }) =>
      postAdminNote(submissionId, author, content),
    onSuccess: () => {
      toast.success('Note added');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add note');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notes', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'submission', submissionId] });
    },
  });
}
