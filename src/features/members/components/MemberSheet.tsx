import { useOrganizationCatalog } from '@/features/organization';
import { GymBrand, brandTheme } from '@/features/branding';
import type { Gym } from '@/features/organization';
import type { ReactElement } from "react";
import type { Member } from "@/features/members/types/member.types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
export function MemberSheet({
  member,
  gym,
  readOnly = false,
  onClose,
  onRenew,
  onEdit,
}: {
  member: Member;
  gym: Gym;
  readOnly?: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void; onRenew: (id: string) => void;
}): ReactElement {
  const { branchLabel } = useOrganizationCatalog();
  return (
    <Dialog title="Ficha de fidelización" onClose={onClose}>
      <article className="member-sheet tenant-theme" style={brandTheme(gym.brandColor ?? '#17677b')}>
        <div className="sheet-brand">
          <GymBrand gym={gym} />
        </div>
        <p className="eyebrow">REGISTRO DE MEMBRESÍA</p>
        <h2>{member.name}</h2>
        <p className="muted">
          DNI {member.dni} · +{member.phone}
        </p>
        <div className="sheet-details"><div className="full"><small>Sede de inscripción</small><strong>{branchLabel(member.homeBranchId)}</strong></div><div className="full"><small>Alcance contratado</small><strong>{member.accessScope === 'network' ? 'Toda la red del propietario' : member.accessScope === 'gym' ? 'Sedes del mismo gimnasio' : 'Solo sede de inscripción'}</strong></div>
          <div>
            <small>Membresía</small>
            <strong>{member.plan}</strong>
          </div>
          <div>
            <small>Importe pagado</small>
            <strong>{formatCurrency(member.paid)}</strong>
          </div>
          <div>
            <small>Inicio</small>
            <strong>{formatDate(member.start)}</strong>
          </div>
          <div>
            <small>Vencimiento</small>
            <strong>{formatDate(member.end)}</strong>
          </div>
          <div>
            <small>Duración</small>
            <strong>
              {Math.round(
                (Date.parse(member.end) - Date.parse(member.start)) / 86400000,
              )}{" "}
              días
            </strong>
          </div>
          <div>
            <small>Medio de pago</small>
            <strong>{member.method}</strong>
          </div>
          {member.discount !== undefined && member.discount > 0 && <><div><small>Importe acordado</small><strong>{formatCurrency(member.agreedAmount ?? member.paid)}</strong></div><div><small>Descuento</small><strong>{member.discount}%</strong></div></>}
        </div>
        <p className="notice">
          Acceso mediante DNI durante el período indicado, sujeto a las reglas de la sede.
        </p>
        <div className="signature">Firma del miembro</div>
        <small>Esta ficha no sustituye un comprobante de pago.</small>
      </article>
      <div className="form-actions no-print">{!readOnly && <Button variant="ghost" onClick={() => onEdit(member)}>Editar datos</Button>}
        {!readOnly && <Button variant="secondary" onClick={() => onRenew(member.id)}>
          <Icon name="renewals" size={16} /> Renovar membresía
        </Button>}
        <Button onClick={() => window.print()}>
          <Icon name="print" size={16} /> Imprimir ficha
        </Button>
      </div>
    </Dialog>
  );
}
