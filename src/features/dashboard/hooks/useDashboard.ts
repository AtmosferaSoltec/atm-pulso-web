import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import type { Dashboard } from '@/types/api.types';

/** Figures of one branch: members per status, income of the month and today's access. */
export function useDashboard(branchId: string): UseQueryResult<Dashboard> {
  return useQuery({ queryKey: ['dashboard', branchId], queryFn: () => api.get<Dashboard>('/dashboard', { branch_id: branchId }) });
}
