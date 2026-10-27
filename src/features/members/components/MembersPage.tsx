import type { ReactElement } from 'react';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { MemberTable } from '@/features/members/components/MemberTable';
import { StatusFilterBar } from '@/features/members/components/StatusFilterBar';
import type { MemberFilters } from '@/features/members/hooks/useMemberFilters';
import type { Member } from '@/features/members/types/member.types';

interface MembersPageProps {
  filters: MemberFilters;
  showBranch: boolean;
  readOnly: boolean;
  /** Present only when the directory is shared between branches. */
  localOnly?: { active: boolean; branchName: string; onToggle: () => void };
  onSelect: (member: Member) => void;
  onEdit: (member: Member) => void;
  onRenew: (member: Member) => void;
}

export function MembersPage({
  filters,
  showBranch,
  readOnly,
  localOnly,
  onSelect,
  onEdit,
  onRenew,
}: MembersPageProps): ReactElement {
  return (
    <section className="card members-card">
      <div className="members-toolbar">
        <div className="search-field">
          <Icon name="search" size={18} />
          <Input
            aria-label="Buscar miembro por nombre o DNI"
            placeholder="Nombre o DNI"
            value={filters.search}
            onChange={(event) => filters.setSearch(event.target.value)}
          />
        </div>
        <StatusFilterBar value={filters.filter} counts={filters.counts} onChange={filters.setFilter} />
        {localOnly && (
          <IconButton
            icon="pin"
            className="scope-toggle"
            label={`Solo inscritos en ${localOnly.branchName}`}
            aria-pressed={localOnly.active}
            onClick={localOnly.onToggle}
          />
        )}
      </div>
      <MemberTable
        members={filters.visible}
        onSelect={onSelect}
        onEdit={readOnly ? undefined : onEdit}
        onRenew={readOnly ? undefined : onRenew}
        showBranch={showBranch}
        allowReminders={!readOnly}
      />
    </section>
  );
}
