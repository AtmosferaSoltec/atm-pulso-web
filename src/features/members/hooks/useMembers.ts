import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api, requestPage } from '@/config/apiClient';
import type { AccessScope, DocumentType, MemberCounts, MemberDetail, MemberView, Pagination, PaymentMethod, ReceiptDetail, Sale } from '@/types/api.types';

export interface MemberList {
  data: MemberView[];
  meta: Pagination & { counts: MemberCounts };
}

export interface MemberQuery {
  search: string;
  status: string;
  homeBranchId?: string;
  page: number;
  pageSize: number;
}

/** A page of the shared directory with the count of each status. */
export function useMemberList(query: MemberQuery): UseQueryResult<MemberList> {
  return useQuery({
    queryKey: ['members', 'list', query],
    queryFn: () =>
      requestPage<MemberView, MemberList['meta']>('/members', {
        query: { q: query.search, status: query.status === 'all' ? '' : query.status, home_branch_id: query.homeBranchId, page: query.page, page_size: query.pageSize },
      }),
    placeholderData: keepPreviousData,
  });
}

export function useMemberDetail(id: string | null): UseQueryResult<MemberDetail> {
  return useQuery({ queryKey: ['members', 'detail', id], queryFn: () => api.get<MemberDetail>(`/members/${id}`), enabled: !!id });
}

export function useReceipt(id: string | null): UseQueryResult<ReceiptDetail> {
  return useQuery({ queryKey: ['receipts', id], queryFn: () => api.get<ReceiptDetail>(`/receipts/${id}`), enabled: !!id });
}

export interface EnrollInput {
  id: string;
  branch_id: string;
  /** Omitted when the gym has a single plan: the API uses it. */
  plan_id?: string;
  document_type: DocumentType;
  document_number: string;
  full_name: string;
  phone: string;
  months: number;
  starts_on: string;
  amount: string;
  method: PaymentMethod;
  access_scope: AccessScope;
  access_branch_ids: string[];
}

export interface RenewInput {
  memberId: string;
  id: string;
  branch_id: string;
  /** Omitted when the gym has a single plan: the API uses it. */
  plan_id?: string;
  months: number;
  starts_on: string;
  amount: string;
  method: PaymentMethod;
  access_scope: AccessScope;
  access_branch_ids: string[];
}

export interface AmendInput {
  memberId: string;
  membershipId: string;
  months?: number;
  starts_on?: string;
  amount?: string;
  method?: PaymentMethod;
}

/** Corrects a period that has not ended (months, start, amount, method). The server recalculates the end. */
export function useAmendMembership(): UseMutationResult<Sale, Error, AmendInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, membershipId, ...changes }: AmendInput) => api.patch<Sale>(`/members/${memberId}/memberships/${membershipId}`, changes),
    onSuccess: async () => {
      await Promise.all(['members', 'payments', 'dashboard', 'receipts'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });
}

export function useMemberMutations(): {
  enroll: UseMutationResult<Sale, Error, EnrollInput>;
  renew: UseMutationResult<Sale, Error, RenewInput>;
  update: UseMutationResult<MemberDetail, Error, { id: string; full_name: string; phone: string }>;
} {
  const queryClient = useQueryClient();
  // A sale changes the members, the payments, the dashboard and the receipts.
  const refreshAll = async (): Promise<void> => {
    await Promise.all(['members', 'payments', 'dashboard', 'receipts'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
  };
  return {
    enroll: useMutation({ mutationFn: (input: EnrollInput) => api.post<Sale>('/members', input), onSuccess: refreshAll }),
    renew: useMutation({
      mutationFn: ({ memberId, ...body }: RenewInput) => api.post<Sale>(`/members/${memberId}/renewals`, body),
      onSuccess: refreshAll,
    }),
    update: useMutation({ mutationFn: ({ id, ...body }) => api.patch<MemberDetail>(`/members/${id}`, body), onSuccess: refreshAll }),
  };
}
