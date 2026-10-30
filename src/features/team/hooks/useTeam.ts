import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api, requestPage } from '@/config/apiClient';
import type { Pagination, Role, TeamUser } from '@/types/api.types';

const teamKey = ['team'] as const;

export type AssignableRole = Extract<Role, 'admin' | 'receptionist'>;

export interface NewTeamUser {
  full_name: string;
  document_number: string;
  role: AssignableRole;
  /** Required for reception; an admin reaches every branch. */
  branch_ids?: string[];
}

/** The DNI never changes: it is the person's login at atm-auth-api. */
export interface TeamUserChanges {
  full_name?: string;
  role?: AssignableRole;
  branch_ids?: string[];
}

/** The users of the account, for its administrators. */
export function useTeamUsers(): UseQueryResult<TeamUser[]> {
  return useQuery({
    queryKey: teamKey,
    queryFn: async () => (await requestPage<TeamUser, Pagination>('/team', { query: { page_size: 100 } })).data,
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
    create: useMutation({ mutationFn: (user: NewTeamUser) => api.post<TeamUser>('/team', user), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, changes }) => api.patch<TeamUser>(`/team/${id}`, changes), onSuccess: refresh }),
    setActive: useMutation({ mutationFn: ({ id, active }) => api.post<TeamUser>(`/team/${id}/${active ? 'activate' : 'deactivate'}`), onSuccess: refresh }),
    resetPassword: useMutation({ mutationFn: (id: string) => api.post<TeamUser>(`/team/${id}/password`), onSuccess: refresh }),
  };
}
