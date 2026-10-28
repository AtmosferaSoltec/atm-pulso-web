import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import { catalogKey } from '@/features/organization/hooks/useCatalog';
import type { CatalogGym, CatalogMembershipPrice } from '@/types/api.types';

export interface GymChanges {
  display_name?: string | null;
  brand_color?: string;
  day_pass_price?: string | null;
  membership_prices?: CatalogMembershipPrice[];
}

/** Changes a gym's identity, day pass price or membership prices, then refreshes the catalog. */
export function useUpdateGym(gymId: string): UseMutationResult<CatalogGym, Error, GymChanges> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: GymChanges) => api.patch<CatalogGym>(`/gyms/${gymId}`, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKey }),
  });
}

/** Uploads (or, with null, removes) a gym's logo, then refreshes the catalog. Superadmin only. */
export function useGymLogo(gymId: string): UseMutationResult<CatalogGym, Error, Blob | null> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: Blob | null) => (file ? api.put<CatalogGym>(`/gyms/${gymId}/logo`, file) : api.delete<CatalogGym>(`/gyms/${gymId}/logo`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKey }),
  });
}
