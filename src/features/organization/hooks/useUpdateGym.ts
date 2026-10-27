import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import { catalogKey } from '@/features/organization/hooks/useCatalog';
import type { CatalogGym } from '@/types/api.types';

export interface GymChanges {
  display_name?: string | null;
  brand_color?: string;
  day_pass_price?: string | null;
  branch_sharing?: boolean;
}

/** Changes a gym's identity, day pass price or branch sharing, then refreshes the catalog. */
export function useUpdateGym(gymId: string): UseMutationResult<CatalogGym, Error, GymChanges> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: GymChanges) => api.patch<CatalogGym>(`/gyms/${gymId}`, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKey }),
  });
}
