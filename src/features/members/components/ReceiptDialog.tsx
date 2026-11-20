import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ReceiptDocument } from '@/features/members/components/ReceiptDocument';
import { useReceipt } from '@/features/members/hooks/useMembers';
import type { Member } from '@/features/members/types/member.types';
import type { PaymentMethod } from '@/types/api.types';
import { VouchersDialog } from '@/features/vouchers';

interface ReceiptDialogProps {
  receiptId: string;
  number: string;
  member: Member;
  onClose: () => void;
}

/** One receipt on screen, loaded only when it is opened; "Descargar boleta" prints it (the browser saves it as PDF). */
export function ReceiptDialog({ receiptId, number, member, onClose }: ReceiptDialogProps): ReactElement {
  const receipt = useReceipt(receiptId);
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const data = receipt.data;
  return (
    <Dialog title={`Boleta ${number}`} wide onClose={onClose}>
      {receipt.isError && (
        <p className="error" role="alert">
          {describeError(receipt.error)}
        </p>
      )}
      {!data && !receipt.isError && <p className="muted">Cargando boleta…</p>}
      {data && <ReceiptDocument data={data} member={member} />}
      <div className="form-actions no-print">
        {data && data.payment.method !== 'cash' && <IconButton icon="clip" label="Comprobante de pago" onClick={() => setVouchersOpen(true)} />}
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
        <Button onClick={() => window.print()} disabled={!data}>
          <Icon name="download" size={16} /> Descargar boleta
        </Button>
      </div>
      {vouchersOpen && data && (
        <VouchersDialog owner={{ kind: 'receipt', id: data.id }} label={data.number} method={data.payment.method as PaymentMethod} onClose={() => setVouchersOpen(false)} />
      )}
    </Dialog>
  );
}
