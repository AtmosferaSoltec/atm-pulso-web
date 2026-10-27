import type { ReactElement } from 'react';
import { useOrganizationCatalog, type Gym } from '@/features/organization';
import { GymBrand, brandTheme } from '@/features/branding';
import type { Member } from '@/features/members/types/member.types';
import { defaultAccessBranchIds } from '@/features/members/services/memberScope';
import { membershipTerms } from '@/features/members/services/membershipTerms';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { documentLabel } from '@/config/documentTypes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface MemberSheetProps {
  member: Member;
  gym: Gym;
  readOnly?: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onRenew: (id: string) => void;
}

/** The member's membership receipt ("boleta"): printable, with the gym's terms and conditions. */
export function MemberSheet({ member, gym, readOnly = false, onClose, onRenew, onEdit }: MemberSheetProps): ReactElement {
  const { branchLabel, organizationBranches } = useOrganizationCatalog();
  const accountBranches = organizationBranches(member.organizationId);
  const homeBranch = accountBranches.find((branch) => branch.id === member.homeBranchId);
  const accessIds = member.accessBranchIds ?? defaultAccessBranchIds(member.accessScope, member.homeBranchId, accountBranches);
  const gymIds = accountBranches.filter((branch) => branch.gymId === homeBranch?.gymId).map((branch) => branch.id);

  const accessSummary =
    accessIds.length <= 1
      ? 'Solo sede de inscripción'
      : accessIds.length === accountBranches.length
        ? 'Toda la red del propietario'
        : accessIds.length === gymIds.length && gymIds.every((id) => accessIds.includes(id))
          ? 'Todas las sedes del gimnasio'
          : accessIds.map(branchLabel).join(', ');

  return (
    <Dialog title="Boleta de membresía" wide onClose={onClose}>
      <article className="receipt tenant-theme" style={brandTheme(gym.brandColor ?? '#17677b')}>
        <header className="receipt-header">
          <div className="receipt-issuer">
            <GymBrand gym={gym} />
            {gym.taxId && <p>RUC {gym.taxId}</p>}
            {homeBranch && (
              <p>
                Sede {homeBranch.name}
                {homeBranch.address ? ` · ${homeBranch.address}` : ''}
              </p>
            )}
          </div>
          <div className="receipt-id">
            <span>BOLETA DE MEMBRESÍA</span>
            <strong>N.º {member.receiptNumber ?? '—'}</strong>
            <small>Emitida el {formatDate(member.recordedAt ?? member.start)}</small>
          </div>
        </header>

        <section className="receipt-section">
          <h4>Datos del socio</h4>
          <h3 className="receipt-name">{member.name}</h3>
          <dl className="receipt-grid">
            <div>
              <dt>Documento</dt>
              <dd>{documentLabel(member.documentType, member.dni)}</dd>
            </div>
            <div>
              <dt>Celular</dt>
              <dd>+{member.phone}</dd>
            </div>
          </dl>
        </section>

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
                  <strong>Membresía {member.plan}</strong>
                  <small>Acceso: {accessSummary}</small>
                </td>
                <td>
                  {formatDate(member.start)} al {formatDate(member.end)}
                </td>
                <td className="right">{formatCurrency(member.paid)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Total pagado · {member.method}</td>
                <td className="right">{formatCurrency(member.paid)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

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
      <div className="form-actions no-print">
        {!readOnly && (
          <Button variant="ghost" onClick={() => onEdit(member)}>
            Editar datos
          </Button>
        )}
        {!readOnly && (
          <Button variant="secondary" onClick={() => onRenew(member.id)}>
            <Icon name="renewals" size={16} /> Renovar membresía
          </Button>
        )}
        <Button onClick={() => window.print()}>
          <Icon name="print" size={16} /> Imprimir boleta
        </Button>
      </div>
    </Dialog>
  );
}
