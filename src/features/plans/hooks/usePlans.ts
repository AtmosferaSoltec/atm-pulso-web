import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import type { CatalogMembershipPrice, MembershipPlan } from '@/types/api.types';

export const plansKey = ['plans'] as const;

/** The gym's plans: all of them for an admin, only the sellable ones for reception (the API decides). */
export function useMembershipPlans(): UseQueryResult<MembershipPlan[]> {
  return useQuery({ queryKey: plansKey, queryFn: () => api.get<MembershipPlan[]>('/membership-plans'), staleTime: 30_000 });
}

export interface PlanInput {
  name: string;
  description: string | null;
  is_active?: boolean;
  prices: CatalogMembershipPrice[];
}

export interface PlanMutations {
  create: UseMutationResult<MembershipPlan, Error, PlanInput>;
  update: UseMutationResult<MembershipPlan, Error, { id: string; changes: Partial<PlanInput> & { position?: number } }>;
}

export function usePlanMutations(): PlanMutations {
  const queryClient = useQueryClient();
  const refresh = (): Promise<void> => queryClient.invalidateQueries({ queryKey: plansKey });
  return {
    create: useMutation({ mutationFn: (input: PlanInput) => api.post<MembershipPlan>('/membership-plans', input), onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, changes }) => api.patch<MembershipPlan>(`/membership-plans/${id}`, changes),
      onSuccess: refresh,
    }),
  };
}
