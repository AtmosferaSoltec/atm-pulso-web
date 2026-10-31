import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { brandTheme, GymBrand } from '@/features/branding';
import { useMemberDetail, useReceipt } from '@/features/members/hooks/useMembers';
import { membershipTerms } from '@/features/members/services/membershipTerms';
import type { Member } from '@/features/members/types/member.types';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { OptionCards } from '@/components/ui/option-cards';
import { documentLabel } from '@/config/documentTypes';
import { paymentMethodLabels } from '@/config/paymentMethods';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { PaymentMethod } from '@/types/api.types';
import { VouchersDialog } from '@/features/vouchers';
import { IconButton } from '@/components/ui/icon-button';
import { PeriodEditDialog } from '@/features/members/components/PeriodEditDialog';
import { canAmend, periodState, type PeriodState } from '@/features/members/services/renewal';
import { MemberSalesPanel } from '@/features/sales';
import { BodyTrackingPanel } from '@/features/body-tracking';
import { todayInLima } from '@/utils/limaDate';
import '@/features/members/members.css';
import type { MembershipView } from '@/types/api.types';

interface MemberSheetProps {
  member: Member;
  /** Opens on this receipt (the one just issued); otherwise on the latest. */
  receiptId?: string;
  onClose: () => void;
  onEdit: (member: Member) => void;
  /** `planId` renews that plan (from one of the periods listed); without it the form asks. */
  onRenew: (member: Member, planId?: string) => void;
  /** The branch where the user works: where a pending sale of this member is collected. */
  branchId?: string;
  /** Shows a message to the user (a toast). */
  onNotify?: (message: string) => void;
}

const stateLabels: Record<PeriodState, string> = { current: 'Vigente', scheduled: 'Programada', ended: 'Terminó' };

/** The member's receipt ("boleta"): printable; the terms and conditions appear only on paper. Reprints any past one. */
export function MemberSheet({ member, receiptId, onClose, onRenew, onEdit, branchId, onNotify }: MemberSheetProps): ReactElement {
  const detail = useMemberDetail(member.id);
  const [chosen, setChosen] = useState<string | null>(receiptId ?? null);
  const periods = detail.data?.memberships.filter((period) => period.receipt) ?? [];
  // Receipts are labelled with their plan only when the member has more than one.
  const severalPlans = new Set(periods.map((period) => period.plan_id)).size > 1;
  const currentId = chosen ?? periods[0]?.receipt?.id ?? null;
  const receipt = useReceipt(currentId);
  const data = receipt.data;
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [amending, setAmending] = useState<MembershipView | null>(null);
  const today = todayInLima();
  const allPeriods = detail.data?.memberships ?? [];
  // The latest period of each plan is the one a renewal continues.
  const latestOfPlan = new Set(
    allPeriods.flatMap((period) => (allPeriods.find((other) => other.plan_id === period.plan_id && other.ends_on > period.ends_on) ? [] : [period.id])),
  );

  return (
    <Dialog title="Boleta de membresía" wide onClose={onClose}>
      {periods.length > 1 && (
        <OptionCards
          label="Boleta a mostrar"
          variant="chip"
          options={periods.map((period) => ({ value: period.receipt!.id, label: severalPlans ? `${period.receipt!.number} · ${period.plan_name}` : period.receipt!.number }))}
          value={currentId ?? ''}
          onChange={setChosen}
        />
      )}
      {allPeriods.length > 0 && (
        <section className="member-periods no-print" aria-label="Membresías del miembro">
          <ul>
            {allPeriods.map((period) => {
              const state = periodState(period, today);
              return (
                <li key={period.id} className={`period-row ${state}`}>
                  <span className="period-text">
                    <strong>
                      {period.plan_name} · {period.plan_label}
                      <span className={`badge period-${state}`}>
                        <i />
                        {stateLabels[state]}
                      </span>
                      {period.amended_at && <span className="subtle-pill">Corregida</span>}
                    </strong>
                    <small>
                      {formatDate(period.starts_on)} al {formatDate(period.ends_on)} · {formatCurrency(period.amount)}
                    </small>
                  </span>
                  {latestOfPlan.has(period.id) && (
                    <IconButton icon="renewals" label={`Renovar ${period.plan_name}`} onClick={() => onRenew(member, period.plan_id)} />
                  )}
                  {canAmend(period, today) && <IconButton icon="edit" label={`Modificar ${period.plan_name}`} onClick={() => setAmending(period)} />}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {branchId && <MemberSalesPanel memberId={member.id} memberName={member.full_name} branchId={branchId} onDone={(message) => onNotify?.(message)} />}
      <BodyTrackingPanel memberId={member.id} />
      {(receipt.isError || detail.isError) && (
        <p className="error" role="alert">
          {describeError(receipt.error ?? detail.error)}
        </p>
      )}
      {!data && !receipt.isError && <p className="muted">Cargando boleta…</p>}
      {data && (
        <article className="receipt tenant-theme" style={brandTheme(data.gym.brand_color)}>
          <header className="receipt-header">
            <div className="receipt-issuer">
              <GymBrand name={data.gym.name} logoUrl={data.gym.logo_url} />
              {data.gym.tax_id && <p>RUC {data.gym.tax_id}</p>}
              <p>
                Sede {data.branch.name}
                {data.branch.address ? ` · ${data.branch.address}` : ''}
              </p>
            </div>
            <div className="receipt-id">
              <span>BOLETA DE MEMBRESÍA</span>
              <strong>N.º {data.number}</strong>
              <small>Emitida el {formatDate(data.issued_on)}</small>
            </div>
          </header>

          <section className="receipt-section">
            <h4>Datos del socio</h4>
            <h3 className="receipt-name">{data.member?.full_name ?? member.full_name}</h3>
            <dl className="receipt-grid">
              <div>
                <dt>Documento</dt>
                <dd>{documentLabel(member.document_type, member.document_number)}</dd>
              </div>
              <div>
                <dt>Celular</dt>
                <dd>+51 {data.member?.phone ?? member.phone}</dd>
              </div>
            </dl>
          </section>

          {data.membership && (
            <section className="receipt-section">
              <h4>Detalle de la membresía</h4>
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Vigencia</th>
                    <th className="right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>
                        {data.membership.plan_name} · {data.membership.plan_label}
                      </strong>
                      <small>Acceso: {data.membership.access_branches.map((branch) => branch.label).join(', ')}</small>
                    </td>
                    <td>
                      {formatDate(data.membership.starts_on)} al {formatDate(data.membership.ends_on)}
                    </td>
                    <td className="right">{formatCurrency(data.payment.amount)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total pagado · {paymentMethodLabels[data.payment.method as PaymentMethod]}</td>
                    <td className="right">{formatCurrency(data.payment.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}

          <section className="receipt-section receipt-legal">
            <h4>Términos y condiciones</h4>
            <ol className="receipt-terms">
              {membershipTerms.map((clause) => (
                <li key={clause.title}>
                  <strong>{clause.title}.</strong> {clause.body}
                </li>
              ))}
            </ol>
            <p className="receipt-accept">Al firmar, el socio declara haber leído y aceptado estos términos y condiciones.</p>
          </section>

          <div className="receipt-signatures">
            <span>Firma del socio</span>
            <span>Sello del gimnasio</span>
          </div>
          <footer className="receipt-footer">Este documento acredita el registro de la membresía y no sustituye un comprobante de pago electrónico.</footer>
        </article>
      )}
      <div className="form-actions no-print">
        <Button variant="ghost" onClick={() => onEdit(member)}>
          Editar datos
        </Button>
        {!receiptId && (
          <Button variant="secondary" onClick={() => onRenew(member)}>
            <Icon name="renewals" size={16} /> Renovar membresía
          </Button>
        )}
        {data && data.payment.method !== 'cash' && (
          <IconButton icon="clip" label="Comprobantes de pago" onClick={() => setVouchersOpen(true)} />
        )}
        <Button onClick={() => window.print()} disabled={!data}>
          <Icon name="print" size={16} /> Imprimir boleta
        </Button>
      </div>
      {amending && (
        <PeriodEditDialog
          memberId={member.id}
          memberName={member.full_name}
          period={amending}
          onClose={() => setAmending(null)}
          onSaved={() => {
            setAmending(null);
            onNotify?.('Membresía corregida. La boleta muestra los nuevos datos.');
          }}
        />
      )}
      {vouchersOpen && data && (
        <VouchersDialog receiptId={data.id} receiptNumber={data.number} method={data.payment.method as PaymentMethod} onClose={() => setVouchersOpen(false)} />
      )}
    </Dialog>
  );
}
