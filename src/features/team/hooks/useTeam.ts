import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api, requestPage } from '@/config/apiClient';
import type { Pagination, Role, TeamUser } from '@/types/api.types';

const teamKey = ['team'] as const;

export type AssignableRole = Extract<Role, 'admin' | 'receptionist'>;

export interface NewTeamUser {
  id: string;
  full_name: string;
  document_number: string;
  role: AssignableRole;
  gym_id?: string;
  branch_ids?: string[];
}

export interface TeamUserChanges {
  full_name?: string;
  document_number?: string;
  role?: AssignableRole;
  gym_id?: string;
  branch_ids?: string[];
}

/** The users the signed-in owner or admin manages (the API decides who each one sees). */
export function useTeamUsers(): UseQueryResult<TeamUser[]> {
  return useQuery({
    queryKey: teamKey,
    queryFn: async () => (await requestPage<TeamUser, Pagination>('/users', { query: { page_size: 100 } })).data,
  });
}

export function useTeamMutations(): {
  create: UseMutationResult<TeamUser, Error, NewTeamUser>;
  update: UseMutationResult<TeamUser, Error, { id: string; changes: TeamUserChanges }>;
  setActive: UseMutationResult<TeamUser, Error, { id: string; active: boolean }>;
  resetPassword: UseMutationResult<TeamUser, Error, string>;
} {
  const queryClient = useQueryClient();
  const refresh = (): Promise<void> => queryClient.invalidateQueries({ queryKey: teamKey });
  return {
    create: useMutation({ mutationFn: (user: NewTeamUser) => api.post<TeamUser>('/users', user), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, changes }) => api.patch<TeamUser>(`/users/${id}`, changes), onSuccess: refresh }),
    setActive: useMutation({ mutationFn: ({ id, active }) => api.post<TeamUser>(`/users/${id}/${active ? 'activate' : 'deactivate'}`), onSuccess: refresh }),
    resetPassword: useMutation({ mutationFn: (id: string) => api.post<TeamUser>(`/users/${id}/password`), onSuccess: refresh }),
  };
}
