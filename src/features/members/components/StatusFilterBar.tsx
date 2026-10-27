import type { ReactElement } from 'react';
import { Icon } from '@/components/ui/icon';
import {
  statusFilters,
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
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (value: StatusFilter) => void;
}

/** Colour-coded status filters: a dot and a count; the selected one also shows its name. */
export function StatusFilterBar({ value, counts, onChange }: StatusFilterBarProps): ReactElement {
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
    </div>
  );
}
