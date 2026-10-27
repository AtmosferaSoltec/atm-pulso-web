import type { ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { type Member, MemberTable, useMemberList } from '@/features/members';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { Icon, type IconName } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/formatCurrency';

interface DashboardProps {
  branchId: string;
  readOnly?: boolean;
  onNavigate: (page: 'members' | 'payments') => void;
  onExpiring: () => void;
  onSelect: (member: Member) => void;
  onEdit: (member: Member) => void;
  onRenew: (member: Member) => void;
}

interface Metric {
  id: string;
  label: string;
  value: string;
  icon: IconName;
  tone: 'ok' | 'money' | 'warn';
  onOpen: () => void;
}

const UPCOMING_LIMIT = 5;

export function Dashboard({ branchId, readOnly = false, onNavigate, onExpiring, onSelect, onEdit, onRenew }: DashboardProps): ReactElement {
  const dashboard = useDashboard(branchId);
  // The five nearest to expire, as full rows so the quick actions (view, edit, renew) work.
  const upcoming = useMemberList({ search: '', status: 'expiring', homeBranchId: branchId, page: 1, pageSize: UPCOMING_LIMIT });
  const data = dashboard.data;
  const expiringCount = data?.members.expiring ?? 0;

  const metrics: Metric[] = [
    { id: 'active', label: 'Vigentes', value: data ? String(data.members.active + data.members.expiring) : '–', icon: 'members', tone: 'ok', onOpen: () => onNavigate('members') },
    { id: 'revenue', label: 'Ingresos del mes', value: data ? formatCurrency(data.income.month) : '–', icon: 'payments', tone: 'money', onOpen: () => onNavigate('payments') },
    { id: 'expiring', label: 'Por vencer', value: data ? String(expiringCount) : '–', icon: 'clock', tone: 'warn', onOpen: onExpiring },
  ];

  return (
    <>
      {dashboard.isError && (
        <p className="error" role="alert">
          {describeError(dashboard.error)}
        </p>
      )}
      <div className="metrics">
        {metrics.map((metric) => (
          <button key={metric.id} type="button" className={`card metric tone-${metric.tone}`} onClick={metric.onOpen}>
            <span className="metric-icon">
              <Icon name={metric.icon} size={22} />
            </span>
            <span className="metric-text">
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{metric.value}</strong>
            </span>
          </button>
        ))}
      </div>
      <section className="card renewal-card">
        <div className="card-heading">
          <h2>
            Próximos vencimientos <span className="count">{expiringCount}</span>
          </h2>
        </div>
        {data && expiringCount === 0 ? (
          <div className="empty">
            <Icon name="check" size={24} />
            <p>Nadie vence esta semana.</p>
          </div>
        ) : (
          <MemberTable
            members={upcoming.data?.data ?? []}
            loading={upcoming.isPending}
            onSelect={onSelect}
            onEdit={readOnly ? undefined : onEdit}
            onRenew={readOnly ? undefined : onRenew}
            allowReminders={!readOnly}
          />
        )}
        {expiringCount > UPCOMING_LIMIT && (
          <button type="button" className="see-all" onClick={onExpiring}>
            Ver los {expiringCount} <Icon name="arrow" size={16} />
          </button>
        )}
      </section>
    </>
  );
}
