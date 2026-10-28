import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api, requestBlob } from '@/config/apiClient';
import type { Voucher } from '@/types/api.types';
import { uploadVoucher } from '@/features/vouchers/services/uploadVouchers';

/** The vouchers of the payment of a receipt, oldest first. */
export function useVouchers(receiptId: string): UseQueryResult<Voucher[]> {
  return useQuery({ queryKey: ['vouchers', receiptId], queryFn: () => api.get<Voucher[]>(`/receipts/${receiptId}/vouchers`) });
}

/** A voucher's file, fetched with the session's token (it is private). Files never change, so they are kept. */
export function useVoucherFile(voucherId: string, enabled = true): UseQueryResult<Blob> {
  return useQuery({
    queryKey: ['vouchers', 'file', voucherId],
    queryFn: () => requestBlob(`/vouchers/${voucherId}/file`),
    enabled,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });
}

/** Adds a voucher to a payment already saved, then refreshes its list and the payments report. */
export function useUploadVoucher(receiptId: string): UseMutationResult<Voucher, Error, File> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadVoucher(receiptId, file),
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ['vouchers', receiptId] }), queryClient.invalidateQueries({ queryKey: ['payments'] })]),
  });
}
