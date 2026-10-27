import type { ReactElement } from 'react';
import { DEMO_DATE, type Member, MemberTable, memberStatus } from '@/features/members';
import { Icon, type IconName } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/formatCurrency';

interface DashboardProps {
  members: Member[];
  payments: Member[];
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

export function Dashboard({
  members,
  payments,
  readOnly = false,
  onNavigate,
  onExpiring,
  onSelect,
  onEdit,
  onRenew,
}: DashboardProps): ReactElement {
  const expiring = members.filter((member) => memberStatus(member) === 'expiring');
  const active = members.filter((member) => ['active', 'expiring'].includes(memberStatus(member)));
  const month = DEMO_DATE.slice(0, 7);
  const monthRevenue = payments
    .filter((payment) => (payment.recordedAt ?? payment.start).startsWith(month))
    .reduce((sum, payment) => sum + payment.paid, 0);

  const metrics: Metric[] = [
    { id: 'active', label: 'Vigentes', value: String(active.length), icon: 'members', tone: 'ok', onOpen: () => onNavigate('members') },
    { id: 'revenue', label: 'Ingresos del mes', value: formatCurrency(monthRevenue), icon: 'payments', tone: 'money', onOpen: () => onNavigate('payments') },
    { id: 'expiring', label: 'Por vencer', value: String(expiring.length), icon: 'clock', tone: 'warn', onOpen: onExpiring },
  ];

  return (
    <>
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
            Próximos vencimientos <span className="count">{expiring.length}</span>
          </h2>
        </div>
        {expiring.length === 0 ? (
          <div className="empty">
            <Icon name="check" size={24} />
            <p>Nadie vence esta semana.</p>
          </div>
        ) : (
          <MemberTable
            members={expiring.slice(0, UPCOMING_LIMIT)}
            onSelect={onSelect}
            onEdit={readOnly ? undefined : onEdit}
            onRenew={readOnly ? undefined : onRenew}
            allowReminders={!readOnly}
          />
        )}
        {expiring.length > UPCOMING_LIMIT && (
          <button type="button" className="see-all" onClick={onExpiring}>
            Ver los {expiring.length} <Icon name="arrow" size={16} />
          </button>
        )}
      </section>
    </>
  );
}
