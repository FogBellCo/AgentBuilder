import { useQuery } from '@tanstack/react-query';
import { fetchTimeline } from '@/lib/admin-api-client';

export function useAdminTimeline(submissionId: string) {
  return useQuery({
    queryKey: ['admin', 'timeline', submissionId],
    queryFn: () => fetchTimeline(submissionId),
    staleTime: 30_000,
    enabled: !!submissionId,
  });
}
