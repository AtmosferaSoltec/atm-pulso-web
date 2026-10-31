import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import { catalogKey } from '@/features/gym/hooks/useCatalog';
import type { CatalogGym } from '@/types/api.types';

export interface GymChanges {
  brand_color?: string;
  day_pass_price?: string | null;
}

/** Changes the colour or day pass price of the gym, then refreshes the catalog. Name, logo and branches are Atmósfera's. */
export function useUpdateGym(gymId: string): UseMutationResult<CatalogGym, Error, GymChanges> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: GymChanges) => api.patch<CatalogGym>(`/gyms/${gymId}`, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKey }),
  });
}
