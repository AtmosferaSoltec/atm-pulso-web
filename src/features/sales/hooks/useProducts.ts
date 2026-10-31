import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import type { Product } from '@/types/api.types';

export const productsKey = ['products'] as const;

/** The catalog. Reception always gets the active products; an admin can also ask for the inactive ones. */
export function useProducts(options: { includeInactive?: boolean; enabled?: boolean } = {}): UseQueryResult<Product[]> {
  const includeInactive = options.includeInactive ?? false;
  return useQuery({
    queryKey: [...productsKey, { includeInactive }],
    queryFn: () => api.get<Product[]>('/products', includeInactive ? { include_inactive: true } : undefined),
    enabled: options.enabled ?? true,
  });
}

export interface ProductInput {
  id?: string;
  name: string;
  price: string;
  is_active?: boolean;
}

export function useProductMutations(): {
  create: UseMutationResult<Product, Error, ProductInput>;
  update: UseMutationResult<Product, Error, { id: string; changes: Partial<ProductInput> & { position?: number } }>;
} {
  const queryClient = useQueryClient();
  const refresh = (): Promise<void> => queryClient.invalidateQueries({ queryKey: productsKey });
  return {
    create: useMutation({ mutationFn: (input: ProductInput) => api.post<Product>('/products', input), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, changes }) => api.patch<Product>(`/products/${id}`, changes), onSuccess: refresh }),
  };
}
