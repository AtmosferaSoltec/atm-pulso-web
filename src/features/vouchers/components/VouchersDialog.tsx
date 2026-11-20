import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { Dialog } from '@/components/ui/dialog';
import type { PaymentMethod } from '@/types/api.types';
import { useUploadVoucher, useVouchers } from '@/features/vouchers/hooks/useVouchers';
import { MAX_VOUCHERS, VoucherFileError } from '@/features/vouchers/services/voucherFile';
import type { VoucherOwner } from '@/features/vouchers/services/voucherOwner';
import { VoucherDropzone } from '@/features/vouchers/components/VoucherDropzone';
import { VoucherThumb } from '@/features/vouchers/components/VoucherThumb';

interface VouchersDialogProps {
  owner: VoucherOwner;
  /** Names what is proven in the title: a receipt number, a sale or a collection. */
  label: string;
  method: PaymentMethod;
  onClose: () => void;
}

/**
 * The proof of payment of a receipt, product sale or collection: see it, or add it even after the sale. Only one per
 * payment (older payments may show several). Files expire after the retention period and are then shown as such.
 */
export function VouchersDialog({ owner, label, method, onClose }: VouchersDialogProps): ReactElement {
  const list = useVouchers(owner);
  const upload = useUploadVoucher(owner);
  const [problem, setProblem] = useState('');
  const vouchers = list.data ?? [];
  const room = MAX_VOUCHERS - vouchers.length;
  const canAdd = method !== 'cash' && room > 0;

  async function add(files: File[]): Promise<void> {
    setProblem('');
    for (const file of files.slice(0, Math.max(room, 0))) {
      try {
        await upload.mutateAsync(file);
      } catch (failure) {
        setProblem(failure instanceof VoucherFileError ? failure.message : describeError(failure));
        return;
      }
    }
    if (files.length > room) setProblem('Solo se adjunta un comprobante por pago.');
  }

  return (
    <Dialog title={`Comprobante · ${label}`} onClose={onClose}>
      {method === 'cash' && <p className="muted">Los pagos en efectivo no llevan comprobante.</p>}
      {list.isError && (
        <p role="alert" className="error">
          {describeError(list.error)}
        </p>
      )}
      {list.isPending && <p className="muted">Cargando…</p>}
      {method !== 'cash' && !list.isPending && vouchers.length === 0 && <p className="muted">Aún no hay comprobante.</p>}
      <div className="voucher-grid">
        {vouchers.map((voucher, index) => (
          <VoucherThumb key={voucher.id} voucher={voucher} index={index} />
        ))}
      </div>
      {canAdd && <VoucherDropzone onFiles={(files) => void add(files)} onProblem={setProblem} disabled={upload.isPending} />}
      {!canAdd && method !== 'cash' && !list.isPending && <p className="muted">Este pago ya tiene su comprobante.</p>}
      {upload.isPending && <p className="muted">Subiendo…</p>}
      {problem && (
        <p role="alert" className="error">
          {problem}
        </p>
      )}
      <p className="muted voucher-note">Una vez subido, el comprobante no se puede cambiar: es la prueba del pago. El archivo se borra automáticamente pasado un tiempo.</p>
    </Dialog>
  );
}
