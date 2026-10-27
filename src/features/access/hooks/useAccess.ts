import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api, requestPage } from '@/config/apiClient';
import type { AccessCheck, AccessEvent, Pagination } from '@/types/api.types';

/** The latest entries of a branch (checks and day passes). */
export function useAccessEvents(branchId: string, limit = 12): UseQueryResult<AccessEvent[]> {
  return useQuery({
    queryKey: ['access', 'events', branchId, limit],
    queryFn: async () => (await requestPage<AccessEvent, Pagination>('/access/events', { query: { branch_id: branchId, page_size: limit } })).data,
  });
}

/** Asks the server whether a document may enter a branch; every answer is logged there. */
export function useAccessCheck(branchId: string): UseMutationResult<AccessCheck, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentNumber: string) => api.post<AccessCheck>('/access/checks', { id: crypto.randomUUID(), branch_id: branchId, document_number: documentNumber }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access'] }),
  });
}
