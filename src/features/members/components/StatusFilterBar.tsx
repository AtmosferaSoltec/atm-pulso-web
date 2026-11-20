import type { ReactElement } from 'react';
import { Icon } from '@/components/ui/icon';
import {
  statusFilters,
  type MemberListFilter,
  type StatusFilter,
} from '@/features/members/hooks/useMemberFilters';

const labels: Record<StatusFilter, string> = {
  all: 'Todos',
  active: 'Vigentes',
  expiring: 'Por vencer',
  expired: 'Vencidos',
  scheduled: 'Por iniciar',
};

interface StatusFilterBarProps {
  value: MemberListFilter;
  counts: Record<StatusFilter, number>;
  /** How many members owe pending sales. Undefined hides the "Deben" filter (the gym has no sales module). */
  debtors?: number;
  onChange: (value: MemberListFilter) => void;
}

/** Colour-coded status filters: a dot and a count; the selected one also shows its name. */
export function StatusFilterBar({ value, counts, debtors, onChange }: StatusFilterBarProps): ReactElement {
  return (
    <div className="status-filters" role="group" aria-label="Filtrar miembros por estado">
      {statusFilters.map((id) => (
        <button
          key={id}
          type="button"
          className={`status-chip ${id}`}
          aria-pressed={value === id}
          aria-label={`${labels[id]} (${counts[id]})`}
          title={labels[id]}
          onClick={() => onChange(id)}
        >
          {id === 'all' ? <Icon name="members" size={15} /> : <i />}
          {value === id && <span className="status-chip-name">{labels[id]}</span>}
          <b>{counts[id]}</b>
        </button>
      ))}
      {debtors !== undefined && (
        <button
          type="button"
          className="status-chip debtors"
          aria-pressed={value === 'debtors'}
          aria-label={`Deben (${debtors})`}
          title="Deben: miembros con ventas pendientes de cobro"
          onClick={() => onChange('debtors')}
        >
          <Icon name="clock" size={15} />
          {value === 'debtors' && <span className="status-chip-name">Deben</span>}
          <b>{debtors}</b>
        </button>
      )}
    </div>
  );
}
