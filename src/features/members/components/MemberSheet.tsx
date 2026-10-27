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

interface MemberSheetProps {
  member: Member;
  /** Opens on this receipt (the one just issued); otherwise on the latest. */
  receiptId?: string;
  readOnly?: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onRenew: (member: Member) => void;
}

/** The member's receipt ("boleta"): printable, with the gym's terms and conditions. Reprints any past one. */
export function MemberSheet({ member, receiptId, readOnly = false, onClose, onRenew, onEdit }: MemberSheetProps): ReactElement {
  const detail = useMemberDetail(member.id);
  const [chosen, setChosen] = useState<string | null>(receiptId ?? null);
  const periods = detail.data?.memberships.filter((period) => period.receipt) ?? [];
  const currentId = chosen ?? periods[0]?.receipt?.id ?? null;
  const receipt = useReceipt(currentId);
  const data = receipt.data;

  return (
    <Dialog title="Boleta de membresía" wide onClose={onClose}>
      {periods.length > 1 && (
        <OptionCards
          label="Boleta a mostrar"
          variant="chip"
          options={periods.map((period) => ({ value: period.receipt!.id, label: period.receipt!.number }))}
          value={currentId ?? ''}
          onChange={setChosen}
        />
      )}
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
              <GymBrand name={data.gym.name} />
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
                      <strong>Membresía {data.membership.plan_label}</strong>
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

          <section className="receipt-section">
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
        {!readOnly && (
          <Button variant="ghost" onClick={() => onEdit(member)}>
            Editar datos
          </Button>
        )}
        {!readOnly && (
          <Button variant="secondary" onClick={() => onRenew(member)}>
            <Icon name="renewals" size={16} /> Renovar membresía
          </Button>
        )}
        <Button onClick={() => window.print()} disabled={!data}>
          <Icon name="print" size={16} /> Imprimir boleta
        </Button>
      </div>
    </Dialog>
  );
}
