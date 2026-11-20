import { useState, type ReactElement } from 'react';
import { ApiError } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { documentLabel } from '@/config/documentTypes';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Avatar } from '@/features/members/components/MemberTable';
import { MemberSection } from '@/features/members/components/MemberSection';
import { PeriodEditDialog } from '@/features/members/components/PeriodEditDialog';
import { ReceiptDialog } from '@/features/members/components/ReceiptDialog';
import { useMemberDetail } from '@/features/members/hooks/useMembers';
import { memberStatusLabels, whatsappLink } from '@/features/members/services/memberData';
import { canAmend, periodState, type PeriodState } from '@/features/members/services/renewal';
import type { Member } from '@/features/members/types/member.types';
import { useHasFeature } from '@/features/gym';
import { MemberSalesPanel } from '@/features/sales';
import { BodyTrackingPanel } from '@/features/body-tracking';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { todayInLima } from '@/utils/limaDate';
import type { MembershipView } from '@/types/api.types';
import '@/features/members/members.css';

interface MemberPageProps {
  memberId: string;
  /** The branch where the user works: where a pending sale of this member is collected. */
  branchId: string;
  /** Opens with this receipt on screen (the one just issued). */
  receiptId?: string;
  onBack: () => void;
  onEdit: (member: Member) => void;
  /** `planId` renews that plan (from one of the periods listed); without it the form asks. */
  onRenew: (member: Member, planId?: string) => void;
  onNotify: (message: string) => void;
}

const periodLabels: Record<PeriodState, string> = { current: 'Vigente', scheduled: 'Programada', ended: 'Terminó' };

/** One member in a page of their own (`#members/<id>`): their memberships, receipts, and, if the gym has it, measurements. */
export function MemberPage({ memberId, branchId, receiptId, onBack, onEdit, onRenew, onNotify }: MemberPageProps): ReactElement {
  const detail = useMemberDetail(memberId);
  const bodyTracking = useHasFeature('body_tracking');
  const [previewId, setPreviewId] = useState<string | null>(receiptId ?? null);
  const [amending, setAmending] = useState<MembershipView | null>(null);
  const today = todayInLima();
  const member = detail.data;

  if (detail.isError) {
    const missing = detail.error instanceof ApiError && (detail.error.status === 404 || detail.error.status === 400);
    return (
      <div className="card member-state" role={missing ? 'status' : 'alert'}>
        <Icon name="search" size={28} />
        <h2>{missing ? 'No encontramos a este miembro' : 'No se pudo cargar al miembro'}</h2>
        <p className="muted">{missing ? 'Puede que el enlace esté incompleto o que ya no exista.' : describeError(detail.error)}</p>
        <Button onClick={onBack}>Volver a miembros</Button>
      </div>
    );
  }
  if (!member) return <p className="muted member-loading">Cargando miembro…</p>;

  const periods = member.memberships;
  // The latest period of each plan is the one a renewal continues.
  const latestOfPlan = new Set(periods.flatMap((period) => (periods.find((other) => other.plan_id === period.plan_id && other.ends_on > period.ends_on) ? [] : [period.id])));
  const withReceipt = periods.filter((period) => period.receipt);
  const preview = withReceipt.find((period) => period.receipt?.id === previewId);
  const needsContact = member.status === 'expiring' || member.status === 'expired';

  return (
    <div className="member-page">
      <button type="button" className="member-back" aria-label="Volver a miembros" onClick={onBack}>
        <span aria-hidden="true">←</span> Miembros
      </button>

      <header className="card member-hero">
        <Avatar name={member.full_name} />
        <div className="member-hero-main">
          <h1>{member.full_name}</h1>
          <p className="muted">
            {documentLabel(member.document_type, member.document_number)} · +51 {member.phone}
          </p>
          <span className={`badge ${member.status}`}>
            <i />
            {memberStatusLabels[member.status]}
          </span>
        </div>
        <div className="member-hero-actions">
          <Button onClick={() => onRenew(member)}>
            <Icon name="renewals" size={16} /> Renovar
          </Button>
          <Button variant="secondary" onClick={() => onEdit(member)}>
            <Icon name="edit" size={16} /> Editar
          </Button>
          <a className="button secondary" href={`tel:+51${member.phone}`}>
            <Icon name="phone" size={16} /> Llamar
          </a>
          {needsContact && (
            <a className="button secondary" href={whatsappLink(member)} target="_blank" rel="noreferrer">
              <Icon name="message" size={16} /> WhatsApp
            </a>
          )}
        </div>
      </header>

      <MemberSalesPanel memberId={member.id} memberName={member.full_name} branchId={branchId} onDone={onNotify} />

      <MemberSection title="Membresías" hint={String(periods.length)} defaultOpen>
        {periods.length === 0 ? (
          <p className="muted">Aún no tiene membresías.</p>
        ) : (
          <ul className="member-periods" aria-label="Membresías del miembro">
            {periods.map((period) => {
              const state = periodState(period, today);
              return (
                <li key={period.id} className={`period-row ${state}`}>
                  <span className="period-text">
                    <strong>
                      {period.plan_name} · {period.plan_label}
                      <span className={`badge period-${state}`}>
                        <i />
                        {periodLabels[state]}
                      </span>
                      {period.amended_at && <span className="subtle-pill">Corregida</span>}
                    </strong>
                    <small>
                      {formatDate(period.starts_on)} al {formatDate(period.ends_on)} · {formatCurrency(period.amount)}
                    </small>
                  </span>
                  {latestOfPlan.has(period.id) && <IconButton icon="renewals" label={`Renovar ${period.plan_name}`} onClick={() => onRenew(member, period.plan_id)} />}
                  {canAmend(period, today) && <IconButton icon="edit" label={`Modificar ${period.plan_name}`} onClick={() => setAmending(period)} />}
                </li>
              );
            })}
          </ul>
        )}
      </MemberSection>

      <MemberSection title="Boletas" hint={String(withReceipt.length)} defaultOpen={!!receiptId}>
        {withReceipt.length === 0 ? (
          <p className="muted">Aún no tiene boletas.</p>
        ) : (
          <ul className="receipt-list" aria-label="Boletas del miembro">
            {withReceipt.map((period) => (
              <li key={period.receipt!.id}>
                <button type="button" className="receipt-row" aria-label={`Ver boleta ${period.receipt!.number}`} onClick={() => setPreviewId(period.receipt!.id)}>
                  <strong>{period.receipt!.number}</strong>
                  <span className="receipt-row-plan">
                    {period.plan_name} · {period.plan_label}
                    <small>
                      {formatDate(period.starts_on)} al {formatDate(period.ends_on)}
                    </small>
                  </span>
                  <span className="receipt-row-amount">{formatCurrency(period.amount)}</span>
                  <Icon name="chevron" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </MemberSection>

      {bodyTracking && (
        <MemberSection title="Medidas y rutinas">
          <BodyTrackingPanel memberId={member.id} memberName={member.full_name} />
        </MemberSection>
      )}

      {preview?.receipt && <ReceiptDialog receiptId={preview.receipt.id} number={preview.receipt.number} member={member} onClose={() => setPreviewId(null)} />}
      {amending && (
        <PeriodEditDialog
          memberId={member.id}
          memberName={member.full_name}
          period={amending}
          onClose={() => setAmending(null)}
          onSaved={() => {
            setAmending(null);
            onNotify('Membresía corregida. La boleta muestra los nuevos datos.');
          }}
        />
      )}
    </div>
  );
}
