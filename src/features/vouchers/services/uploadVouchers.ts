import { api } from '@/config/apiClient';
import type { Voucher } from '@/types/api.types';
import { prepareVoucher } from '@/features/vouchers/services/voucherFile';

/** Uploads one voucher to the payment of a receipt. */
export async function uploadVoucher(receiptId: string, file: File): Promise<Voucher> {
  return api.postFile<Voucher>(`/receipts/${receiptId}/vouchers`, await prepareVoucher(file));
}

/**
 * Uploads the files one by one after a sale. The sale is already saved, so a failure never undoes it:
 * it returns how many files could not be uploaded, for the caller to tell the user.
 */
export async function uploadVouchers(receiptId: string, files: File[]): Promise<number> {
  let failed = 0;
  for (const file of files) {
    try {
      await uploadVoucher(receiptId, file);
    } catch {
      failed += 1;
    }
  }
  return failed;
}
