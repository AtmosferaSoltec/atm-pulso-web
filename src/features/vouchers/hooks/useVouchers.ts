import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api, requestBlob } from '@/config/apiClient';
import type { Voucher } from '@/types/api.types';
import { uploadVoucher } from '@/features/vouchers/services/uploadVouchers';
import { voucherPath, type VoucherOwner } from '@/features/vouchers/services/voucherOwner';

const ownerKey = (owner: VoucherOwner): string[] => ['vouchers', owner.kind, owner.id];

/** The vouchers of a payment, product sale or collection, oldest first. */
export function useVouchers(owner: VoucherOwner): UseQueryResult<Voucher[]> {
  return useQuery({ queryKey: ownerKey(owner), queryFn: () => api.get<Voucher[]>(voucherPath(owner)) });
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

/** Adds a voucher to something already saved, then refreshes its list and the list that counts them. */
export function useUploadVoucher(owner: VoucherOwner): UseMutationResult<Voucher, Error, File> {
  const queryClient = useQueryClient();
  const counted = owner.kind === 'receipt' ? ['payments'] : ['product-sales'];
  return useMutation({
    mutationFn: (file: File) => uploadVoucher(owner, file),
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ownerKey(owner) }), queryClient.invalidateQueries({ queryKey: counted })]),
  });
}
