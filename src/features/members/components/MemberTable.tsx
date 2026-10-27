import type { ReactElement } from 'react';
import type { Member } from '@/features/members/types/member.types';
import { memberStatus, daysRemaining, whatsappLink } from '@/features/members/services/memberData';
import { useOrganizationCatalog } from '@/features/organization';
import { IconButton } from '@/components/ui/icon-button';
import { Icon } from '@/components/ui/icon';
import { formatDate } from '@/utils/formatDate';
import { documentLabel } from '@/config/documentTypes';

export function Avatar({ name }: { name: string }): ReactElement {
  return (
    <span className={`avatar color-${name.length % 5}`}>
      {name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
    </span>
  );
}

const statusLabels = {
  active: 'Vigente',
  expiring: 'Por vencer',
  expired: 'Vencido',
  scheduled: 'Por iniciar',
} as const;

function dueNote(member: Member): string {
  const status = memberStatus(member);
  if (status === 'scheduled') return `Inicia ${formatDate(member.start)}`;
  const days = daysRemaining(member.end);
  if (days < 0) return `Venció hace ${-days} ${days === -1 ? 'día' : 'días'}`;
  if (days === 0) return 'Vence hoy';
  return `En ${days} ${days === 1 ? 'día' : 'días'}`;
}

interface MemberTableProps {
  members: Member[];
  onSelect: (member: Member) => void;
  /** Quick actions are omitted from the row when their handler is not provided. */
  onEdit?: (member: Member) => void;
  onRenew?: (member: Member) => void;
  showBranch?: boolean;
  allowReminders?: boolean;
}

export function MemberTable({
  members,
  onSelect,
  onEdit,
  onRenew,
  showBranch = false,
  allowReminders = true,
}: MemberTableProps): ReactElement {
  const { branchLabel } = useOrganizationCatalog();
  return (
    <div className="table-scroll">
      <table className="member-table">
        <thead>
          <tr>
            <th>Miembro</th>
            {showBranch && <th className="col-secondary">Sede</th>}
            <th className="col-secondary">Vence</th>
            <th className="col-status">Estado</th>
            <th className="right">
              <span className="visually-hidden">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const status = memberStatus(member);
            const needsContact = status === 'expiring' || status === 'expired';
            return (
              <tr key={member.id} className={`row-${status}`}>
                <td>
                  <div className="person">
                    <Avatar name={member.name} />
                    <div>
                      <strong>{member.name}</strong>
                      <small>
                        {member.plan} · {documentLabel(member.documentType, member.dni)}
                      </small>
                    </div>
                  </div>
                </td>
                {showBranch && <td className="col-secondary">{branchLabel(member.homeBranchId)}</td>}
                <td className="col-secondary">
                  {formatDate(member.end)}
                  <small>{dueNote(member)}</small>
                </td>
                <td className="col-status">
                  <span className={`badge ${status}`}>
                    <i />
                    {statusLabels[status]}
                  </span>
                </td>
                <td className="right">
                  <div className="row-actions">
                    <span className="action-slot">
                      {allowReminders && needsContact && (
                        <a
                          className="icon-button whatsapp"
                          href={whatsappLink(member)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Avisar a ${member.name} por WhatsApp`}
                          title="Avisar por WhatsApp"
                        >
                          <Icon name="message" size={18} />
                        </a>
                      )}
                    </span>
                    <span className="action-slot">
                      {onRenew && needsContact && (
                        <IconButton
                          icon="renewals"
                          label={`Renovar a ${member.name}`}
                          onClick={() => onRenew(member)}
                        />
                      )}
                    </span>
                    {onEdit && (
                      <span className="action-slot col-secondary">
                        <IconButton
                          icon="edit"
                          label={`Editar a ${member.name}`}
                          onClick={() => onEdit(member)}
                        />
                      </span>
                    )}
                    <span className="action-slot">
                      <IconButton
                        icon="eye"
                        label={`Ver ficha de ${member.name}`}
                        onClick={() => onSelect(member)}
                      />
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {members.length === 0 && (
        <div className="empty">
          <Icon name="search" size={24} />
          <p>No hay miembros con este filtro.</p>
        </div>
      )}
    </div>
  );
}
