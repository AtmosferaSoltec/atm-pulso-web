import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { Dialog } from '@/components/ui/dialog';
import type { PaymentMethod } from '@/types/api.types';
import { useUploadVoucher, useVouchers } from '@/features/vouchers/hooks/useVouchers';
import { MAX_VOUCHERS } from '@/features/vouchers/services/voucherFile';
import { VoucherDropzone } from '@/features/vouchers/components/VoucherDropzone';
import { VoucherThumb } from '@/features/vouchers/components/VoucherThumb';

interface VouchersDialogProps {
  receiptId: string;
  receiptNumber: string;
  method: PaymentMethod;
  /** The superadmin only looks. */
  readOnly?: boolean;
  onClose: () => void;
}

/** The proofs of payment of one receipt: see them, and add more (up to five) even after the sale. */
export function VouchersDialog({ receiptId, receiptNumber, method, readOnly = false, onClose }: VouchersDialogProps): ReactElement {
  const list = useVouchers(receiptId);
  const upload = useUploadVoucher(receiptId);
  const [problem, setProblem] = useState('');
  const vouchers = list.data ?? [];
  const room = MAX_VOUCHERS - vouchers.length;
  const canAdd = !readOnly && method !== 'cash' && room > 0;

  async function add(files: File[]): Promise<void> {
    setProblem('');
    for (const file of files.slice(0, room)) {
      try {
        await upload.mutateAsync(file);
      } catch (failure) {
        setProblem(describeError(failure));
        return;
      }
    }
    if (files.length > room) setProblem(`Máximo ${MAX_VOUCHERS} comprobantes por pago.`);
  }

  return (
    <Dialog title={`Comprobantes · ${receiptNumber}`} onClose={onClose}>
      {method === 'cash' && <p className="muted">Los pagos en efectivo no llevan comprobante.</p>}
      {list.isError && (
        <p role="alert" className="error">
          {describeError(list.error)}
        </p>
      )}
      {list.isPending && <p className="muted">Cargando…</p>}
      {method !== 'cash' && !list.isPending && vouchers.length === 0 && <p className="muted">Aún no hay comprobantes.</p>}
      <div className="voucher-grid">
        {vouchers.map((voucher, index) => (
          <VoucherThumb key={voucher.id} voucher={voucher} index={index} />
        ))}
      </div>
      {canAdd && <VoucherDropzone onFiles={(files) => void add(files)} onProblem={setProblem} disabled={upload.isPending} />}
      {!canAdd && !readOnly && method !== 'cash' && <p className="muted">Se alcanzó el máximo de {MAX_VOUCHERS} comprobantes.</p>}
      {upload.isPending && <p className="muted">Subiendo…</p>}
      {problem && (
        <p role="alert" className="error">
          {problem}
        </p>
      )}
      <p className="muted voucher-note">Una vez subido, un comprobante no se puede borrar: es la prueba del pago.</p>
    </Dialog>
  );
}
