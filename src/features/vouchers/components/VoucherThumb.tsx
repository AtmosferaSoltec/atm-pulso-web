import { useEffect, useMemo, type ReactElement } from 'react';
import { Icon } from '@/components/ui/icon';
import type { Voucher } from '@/types/api.types';
import { formatDate } from '@/utils/formatDate';
import { useVoucherFile } from '@/features/vouchers/hooks/useVouchers';

/** One saved voucher: a thumbnail (images) or a PDF icon; clicking opens the file in a new tab. */
export function VoucherThumb({ voucher, index }: { voucher: Voucher; index: number }): ReactElement {
  const isImage = voucher.content_type.startsWith('image/');
  const file = useVoucherFile(voucher.id, isImage);
  const url = useMemo(() => (file.data ? URL.createObjectURL(file.data) : null), [file.data]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  async function open(): Promise<void> {
    const blob = file.data ?? (await file.refetch()).data;
    if (blob) window.open(URL.createObjectURL(blob), '_blank');
  }

  return (
    <button type="button" className="voucher-card" aria-label={`Abrir comprobante ${index + 1}`} onClick={() => void open()}>
      <span className="voucher-thumb large">{isImage && url ? <img src={url} alt="" /> : <Icon name="file" size={28} />}</span>
      <small>{voucher.content_type === 'application/pdf' ? 'PDF · ' : ''}{formatDate(voucher.created_at.slice(0, 10))}</small>
    </button>
  );
}
