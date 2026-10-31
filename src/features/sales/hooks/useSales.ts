import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api, requestPage } from '@/config/apiClient';
import type { PendingBalance, MemberPending, PaymentMethod, Pagination, ProductSale, ProductsReport, Collection } from '@/types/api.types';

const salesKey = ['product-sales'] as const;

export interface SaleInput {
  id: string;
  branch_id: string;
  member_id?: string;
  status: 'paid' | 'pending';
  /** Required when paid. */
  method?: PaymentMethod;
  items: { product_id: string; quantity: number }[];
}

export interface CollectInput {
  id: string;
  member_id: string;
  branch_id: string;
  method: PaymentMethod;
  sale_ids: string[];
}

export function useSalesMutations(): {
  sell: UseMutationResult<ProductSale, Error, SaleInput>;
  collect: UseMutationResult<Collection, Error, CollectInput>;
} {
  const queryClient = useQueryClient();
  const refresh = (): Promise<void> => queryClient.invalidateQueries({ queryKey: salesKey });
  return {
    sell: useMutation({ mutationFn: (input: SaleInput) => api.post<ProductSale>('/sales', input), onSuccess: refresh }),
    collect: useMutation({ mutationFn: (input: CollectInput) => api.post<Collection>('/sales/collections', input), onSuccess: refresh }),
  };
}

/** Members who owe something, the biggest debt first. */
export function usePendingBalances(): UseQueryResult<PendingBalance[]> {
  return useQuery({ queryKey: [...salesKey, 'pending'], queryFn: () => api.get<PendingBalance[]>('/sales/pending') });
}

/** What one member still has to pay and the pending sales behind it. */
/** The purchase history of a member (paid and pending), newest first. */
export function useMemberSales(memberId: string | null, enabled = true): UseQueryResult<ProductSale[]> {
  return useQuery({
    queryKey: [...salesKey, 'history', memberId],
    queryFn: async () => (await requestPage<ProductSale, Pagination>(`/members/${memberId}/sales`, { query: { page: 1, page_size: 10 } })).data,
    enabled: !!memberId && enabled,
  });
}

export function useMemberPending(memberId: string | null, enabled = true): UseQueryResult<MemberPending> {
  return useQuery({
    queryKey: [...salesKey, 'member', memberId],
    queryFn: () => api.get<MemberPending>(`/members/${memberId}/pending-sales`),
    enabled: !!memberId && enabled,
  });
}

export interface ReportQuery {
  from: string;
  to: string;
  branchId?: string;
  groupBy: 'day' | 'month';
}

/** The sales report (admin). Separate from membership income. */
export function useSalesReport(query: ReportQuery, enabled: boolean): UseQueryResult<ProductsReport> {
  return useQuery({
    queryKey: [...salesKey, 'report', query],
    queryFn: () => api.get<ProductsReport>('/sales/report', { from: query.from, to: query.to, branch_id: query.branchId, group_by: query.groupBy }),
    enabled,
  });
}
