import type { ReactElement } from 'react';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { documentLabel } from '@/config/documentTypes';
import { debtAge, pendingCountLabel } from '@/features/sales/services/debtors';
import type { SalesDebtor } from '@/types/api.types';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { todayInLima } from '@/utils/limaDate';
import '@/features/sales/sales.css';

interface DebtorsTableProps {
  debtors: SalesDebtor[];
  loading?: boolean;
  /** Opens the member's file, where the pending sales are listed and collected. */
  onSelect: (memberId: string) => void;
}

/** The "Deben" list of the members page: who owes pending sales, how much and since when. No grand total on purpose. */
export function DebtorsTable({ debtors, loading = false, onSelect }: DebtorsTableProps): ReactElement {
  const today = todayInLima();
  return (
    <div className="table-scroll">
      <table className="member-table debtors-table" aria-label="Miembros con ventas pendientes">
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Debe</th>
            <th className="col-secondary">Desde</th>
            <th className="right">
              <span className="visually-hidden">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {debtors.map((debtor) => {
            const { member } = debtor;
            return (
              <tr key={member.id} className="debtor-row" onClick={() => onSelect(member.id)}>
                <td>
                  <div className="person">
                    <span className={`avatar color-${member.full_name.length % 5}`}>
                      {member.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                    </span>
                    <div>
                      <strong>{member.full_name}</strong>
                      <small>{documentLabel(member.document_type, member.document_number)}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong className="debt-amount">Debe {formatCurrency(debtor.balance)}</strong>
                  <small>{pendingCountLabel(debtor.pending_count)}</small>
                </td>
                <td className="col-secondary">
                  desde {formatDate(debtor.oldest_sold_on)}
                  <small>{debtAge(debtor.oldest_sold_on, today)}</small>
                </td>
                <td className="right">
                  <div className="row-actions">
                    <span className="action-slot">
                      <IconButton
                        icon="eye"
                        label={`Ver ficha de ${member.full_name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(member.id);
                        }}
                      />
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {loading && <div className="empty">Cargando…</div>}
      {!loading && debtors.length === 0 && (
        <div className="empty">
          <Icon name="check" size={24} />
          <p>Nadie debe ventas pendientes.</p>
        </div>
      )}
    </div>
  );
}
