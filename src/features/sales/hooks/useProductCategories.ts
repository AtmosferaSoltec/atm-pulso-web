import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import { productsKey } from '@/features/sales/hooks/useProducts';
import type { ProductCategory } from '@/types/api.types';

export const productCategoriesKey = ['product-categories'] as const;

/** The gym's product categories, by position. */
export function useProductCategories(options: { enabled?: boolean } = {}): UseQueryResult<ProductCategory[]> {
  return useQuery({
    queryKey: productCategoriesKey,
    queryFn: () => api.get<ProductCategory[]>('/product-categories'),
    enabled: options.enabled ?? true,
  });
}

export function useProductCategoryMutations(): {
  create: UseMutationResult<ProductCategory, Error, string>;
  update: UseMutationResult<ProductCategory, Error, { id: string; changes: { name?: string; position?: number } }>;
  remove: UseMutationResult<void, Error, string>;
} {
  const queryClient = useQueryClient();
  // Products carry their category's name, so both lists refresh.
  const refresh = async (): Promise<void> => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: productCategoriesKey }), queryClient.invalidateQueries({ queryKey: productsKey })]);
  };
  return {
    create: useMutation({ mutationFn: (name: string) => api.post<ProductCategory>('/product-categories', { name }), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, changes }) => api.patch<ProductCategory>(`/product-categories/${id}`, changes), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => api.delete<void>(`/product-categories/${id}`), onSuccess: refresh }),
  };
}
