import { useState, type ReactElement } from 'react';
import { VouchersDialog, type VoucherOwner } from '@/features/vouchers';
import type { PaymentMethod, ProductSale } from '@/types/api.types';
import { IconButton } from '@/components/ui/icon-button';
import { formatDate } from '@/utils/formatDate';

/**
 * The clip of a sale, like the payments': opens its proofs of payment. A sale paid on the spot keeps its own; a pending
 * sale collected later is proven by its collection. Nothing for an open pending sale, nor for cash without proofs.
 */
export function SaleVouchersButton({ sale }: { sale: ProductSale }): ReactElement | null {
  const [open, setOpen] = useState(false);
  if (sale.status !== 'paid' || !sale.method) return null;
  if (sale.method === 'cash' && sale.voucher_count === 0) return null;
  const method = sale.method as PaymentMethod;
  const owner: VoucherOwner = sale.collection_id ? { kind: 'collection', id: sale.collection_id } : { kind: 'sale', id: sale.id };
  const label = `${sale.collection_id ? 'cobro de la venta' : 'venta'} del ${formatDate(sale.sold_on)}`;
  return (
    <>
      <IconButton
        icon="clip"
        className={sale.voucher_count > 0 ? 'has-vouchers' : ''}
        label={sale.voucher_count > 0 ? `Comprobantes (${sale.voucher_count}) · ${label}` : `Agregar comprobante · ${label}`}
        onClick={() => setOpen(true)}
      />
      {open && <VouchersDialog owner={owner} label={label} method={method} onClose={() => setOpen(false)} />}
    </>
  );
}
