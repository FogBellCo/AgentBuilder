import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '@/lib/admin-api-client';

export function useAdminAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: ['admin', 'analytics', from, to],
    queryFn: () => fetchAnalytics(from, to),
    staleTime: 60_000,
  });
}
