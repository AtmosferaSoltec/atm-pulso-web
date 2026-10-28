import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { requestPage } from '@/config/apiClient';
import type { Pagination, PaymentRow, PaymentTotals } from '@/types/api.types';

export interface PaymentFilter {
  branchId: string;
  from: string;
  to: string;
  /** "all" or a payment method. */
  method: string;
  page: number;
  pageSize: number;
}

export interface PaymentList {
  data: PaymentRow[];
  /** `totals` is absent for reception, who must not get KPIs. */
  meta: Pagination & { totals?: PaymentTotals };
}

/** Query parameters shared by the list and the CSV download. */
export function paymentQuery(filter: Pick<PaymentFilter, 'branchId' | 'from' | 'to' | 'method'>): Record<string, string> {
  return { branch_id: filter.branchId, from: filter.from, to: filter.to, ...(filter.method === 'all' ? {} : { method: filter.method }) };
}

export function usePayments(filter: PaymentFilter): UseQueryResult<PaymentList> {
  return useQuery({
    queryKey: ['payments', filter],
    queryFn: () => requestPage<PaymentRow, PaymentList['meta']>('/payments', { query: { ...paymentQuery(filter), page: filter.page, page_size: filter.pageSize } }),
    placeholderData: keepPreviousData,
  });
}

/** Period totals for the KPIs: they ignore the method filter so they stay put while the list is narrowed. */
export function usePaymentTotals(filter: Pick<PaymentFilter, 'branchId' | 'from' | 'to'>, enabled: boolean): UseQueryResult<PaymentTotals | undefined> {
  return useQuery({
    queryKey: ['payments', 'totals', filter],
    queryFn: async () => {
      const result = await requestPage<PaymentRow, PaymentList['meta']>('/payments', {
        query: { ...paymentQuery({ ...filter, method: 'all' }), page: 1, page_size: 1 },
      });
      return result.meta.totals;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}
