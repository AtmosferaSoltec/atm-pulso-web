import { useEffect, useMemo, type ReactElement } from 'react';
import { Icon } from '@/components/ui/icon';
import type { Voucher } from '@/types/api.types';
import { formatDate } from '@/utils/formatDate';
import { limaDateOf } from '@/utils/limaDate';
import { useVoucherFile } from '@/features/vouchers/hooks/useVouchers';

/**
 * One saved voucher: a thumbnail (images) or a PDF icon; clicking opens the file in a new tab. An expired voucher's
 * file was deleted after the retention period: it is shown muted, without fetching anything.
 */
export function VoucherThumb({ voucher, index }: { voucher: Voucher; index: number }): ReactElement {
  const isImage = voucher.content_type.startsWith('image/');
  const file = useVoucherFile(voucher.id, isImage && !voucher.expired);
  const url = useMemo(() => (file.data ? URL.createObjectURL(file.data) : null), [file.data]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  const uploaded = formatDate(limaDateOf(voucher.created_at));
  const deletes = voucher.expires_at ? formatDate(limaDateOf(voucher.expires_at)) : null;

  if (voucher.expired) {
    const when = deletes ? `Se borró el ${deletes}` : 'Se borró';
    return (
      <div className="voucher-card expired" role="img" aria-label={`Comprobante ${index + 1} vencido. ${when}.`} title={`Subido el ${uploaded}. ${when}.`}>
        <span className="voucher-thumb large">
          <Icon name="file" size={28} />
        </span>
        <strong>Vencido</strong>
        <small>{when}</small>
      </div>
    );
  }

  async function open(): Promise<void> {
    const blob = file.data ?? (await file.refetch()).data;
    if (blob) window.open(URL.createObjectURL(blob), '_blank');
  }

  return (
    <button type="button" className="voucher-card" aria-label={`Abrir comprobante ${index + 1}`} title={deletes ? `Se borra el ${deletes}` : undefined} onClick={() => void open()}>
      <span className="voucher-thumb large">{isImage && url ? <img src={url} alt="" /> : <Icon name="file" size={28} />}</span>
      <small>
        {voucher.content_type === 'application/pdf' ? 'PDF · ' : ''}
        {uploaded}
      </small>
      {deletes && <small className="voucher-expiry">Se borra el {deletes}</small>}
    </button>
  );
}
