import { useState, type ReactElement } from 'react';
import { useHasFeature } from '@/features/gym';
import { CollectDialog } from '@/features/sales/components/CollectDialog';
import { useMemberPending, useMemberSales } from '@/features/sales/hooks/useSales';
import type { ProductSale } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import '@/features/sales/sales.css';

interface MemberSalesPanelProps {
  memberId: string;
  memberName: string;
  branchId: string;
  onDone: (message: string) => void;
}

const describe = (sale: ProductSale): string => sale.items.map((item) => `${item.quantity} ${item.name}`).join(', ');

/**
 * In the member's file: "Pendiente de cobro" (what they have not paid yet: the products, dates and total, with "Cobrar") and
 * the purchase history. Renders nothing when the gym does not have the sales module, or when the member has no purchases at all.
 */
export function MemberSalesPanel({ memberId, memberName, branchId, onDone }: MemberSalesPanelProps): ReactElement | null {
  const enabled = useHasFeature('sales');
  const pending = useMemberPending(memberId, enabled);
  const history = useMemberSales(memberId, enabled);
  const [collecting, setCollecting] = useState(false);
  const owed = pending.data && Number(pending.data.balance) > 0 ? pending.data : null;
  const purchases = history.data ?? [];
  if (!enabled || (!owed && purchases.length === 0)) return null;
  return (
    <section className="member-sales no-print" aria-label="Ventas del miembro">
      {owed && (
        <div className="pending-notice" role="status">
          <div className="pending-head">
            <Icon name="clock" size={18} />
            <span>
              Pendiente de cobro: <strong>{formatCurrency(owed.balance)}</strong>
            </span>
            <Button variant="secondary" onClick={() => setCollecting(true)}>
              Cobrar
            </Button>
          </div>
          <ul className="pending-detail" aria-label="Ventas pendientes">
            {owed.sales.map((sale) => (
              <li key={sale.id}>
                <span>
                  {describe(sale)}
                  <small>{formatDate(sale.sold_on)}</small>
                </span>
                <strong>{formatCurrency(sale.total)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
      {purchases.length > 0 && (
        <details className="purchase-history">
          <summary>Compras del miembro ({purchases.length})</summary>
          <ul aria-label="Historial de compras">
            {purchases.map((sale) => (
              <li key={sale.id}>
                <span>
                  {describe(sale)}
                  <small>
                    {formatDate(sale.sold_on)} · {sale.status === 'pending' ? 'Pendiente' : 'Cobrada'}
                  </small>
                </span>
                <strong>{formatCurrency(sale.total)}</strong>
              </li>
            ))}
          </ul>
        </details>
      )}
      {collecting && <CollectDialog memberId={memberId} memberName={memberName} branchId={branchId} onClose={() => setCollecting(false)} onDone={onDone} />}
    </section>
  );
}
