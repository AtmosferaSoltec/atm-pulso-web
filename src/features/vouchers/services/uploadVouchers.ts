import { api } from '@/config/apiClient';
import type { Voucher } from '@/types/api.types';
import { prepareVoucher } from '@/features/vouchers/services/voucherFile';
import { voucherPath, type VoucherOwner } from '@/features/vouchers/services/voucherOwner';

/** Uploads one voucher to a payment, a product sale or a collection. */
export async function uploadVoucher(owner: VoucherOwner, file: File): Promise<Voucher> {
  return api.postFile<Voucher>(voucherPath(owner), await prepareVoucher(file));
}

/**
 * Uploads the files one by one after a sale. The sale is already saved, so a failure never undoes it:
 * it returns how many files could not be uploaded, for the caller to tell the user.
 */
export async function uploadVouchers(receiptId: string, files: File[]): Promise<number> {
  let failed = 0;
  for (const file of files) {
    try {
      await uploadVoucher({ kind: 'receipt', id: receiptId }, file);
    } catch {
      failed += 1;
    }
  }
  return failed;
}
