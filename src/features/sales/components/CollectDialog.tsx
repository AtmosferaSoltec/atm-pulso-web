import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { paymentMethodOptions } from '@/config/paymentMethods';
import { useMemberPending, useSalesMutations } from '@/features/sales/hooks/useSales';
import { centsToText, priceToCents } from '@/features/sales/services/cart';
import type { PaymentMethod } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { OptionCards } from '@/components/ui/option-cards';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import '@/features/sales/sales.css';

interface CollectDialogProps {
  memberId: string;
  memberName: string;
  /** The branch where the payment is collected. */
  branchId: string;
  onClose: () => void;
  onDone: (message: string) => void;
}

/** "Cobrar": the member pays whole pending sales (all of them by default; untick the ones that stay open). */
export function CollectDialog({ memberId, memberName, branchId, onClose, onDone }: CollectDialogProps): ReactElement {
  const pending = useMemberPending(memberId);
  const { collect } = useSalesMutations();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  // The ids the person unticked; everything else is paid.
  const [kept, setKept] = useState<ReadonlySet<string>>(new Set());
  const [collectionId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState('');
  const sales = pending.data?.sales ?? [];
  const chosen = sales.filter((sale) => !kept.has(sale.id));
  const total = chosen.reduce((sum, sale) => sum + priceToCents(sale.total), 0);

  function toggle(id: string): void {
    const next = new Set(kept);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setKept(next);
  }

  async function submit(): Promise<void> {
    setError('');
    try {
      const result = await collect.mutateAsync({ id: collectionId, member_id: memberId, branch_id: branchId, method, sale_ids: chosen.map((sale) => sale.id) });
      onDone(`${memberName} pagó ${formatCurrency(result.amount)}.${Number(result.remaining_balance) > 0 ? ` Aún debe ${formatCurrency(result.remaining_balance)}.` : ''}`);
      onClose();
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <Dialog title={`Cobrar a ${memberName}`} onClose={onClose}>
      {pending.isError && (
        <p className="error" role="alert">
          {describeError(pending.error)}
        </p>
      )}
      {pending.isPending && <p className="muted">Cargando ventas pendientes…</p>}
      {pending.isSuccess && sales.length === 0 && <p className="muted">No tiene ventas pendientes.</p>}
      {sales.length > 0 && (
        <ul className="collect-list" aria-label="Ventas pendientes">
          {sales.map((sale) => (
            <li key={sale.id}>
              <label>
                <input type="checkbox" checked={!kept.has(sale.id)} onChange={() => toggle(sale.id)} />
                <span className="collect-text">
                  <strong>{sale.items.map((item) => `${item.quantity} ${item.name}`).join(', ')}</strong>
                  <small>{formatDate(sale.sold_on)}</small>
                </span>
                <strong>{formatCurrency(sale.total)}</strong>
              </label>
            </li>
          ))}
        </ul>
      )}
      <Field label="Medio de pago" as="div">
        <OptionCards label="Medio de pago" variant="chip" options={paymentMethodOptions} value={method} onChange={setMethod} />
      </Field>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={chosen.length === 0 || collect.isPending} onClick={() => void submit()}>
          Cobrar {formatCurrency(centsToText(total))}
        </Button>
      </div>
    </Dialog>
  );
}
