import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchTeamMembers, addTeamMember, removeTeamMember } from '@/lib/admin-api-client';

export function useAdminTeam() {
  return useQuery({
    queryKey: ['admin', 'team'],
    queryFn: fetchTeamMembers,
    staleTime: 60_000,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, email }: { name: string; email: string }) =>
      addTeamMember(name, email),
    onSuccess: () => {
      toast.success('Team member added');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add team member');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeTeamMember(id),
    onSuccess: () => {
      toast.success('Team member removed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove team member');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
    },
  });
}
