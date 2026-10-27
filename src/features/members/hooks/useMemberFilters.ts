import { useState } from 'react';
import type { Member, MemberStatus } from '@/features/members/types/member.types';
import { memberStatus } from '@/features/members/services/memberData';

export type StatusFilter = MemberStatus | 'all';

export const statusFilters: StatusFilter[] = ['all', 'active', 'expiring', 'expired', 'scheduled'];

export interface MemberFilters {
  search: string;
  setSearch: (value: string) => void;
  filter: StatusFilter;
  setFilter: (value: StatusFilter) => void;
  reset: (filter?: StatusFilter) => void;
  visible: Member[];
  counts: Record<StatusFilter, number>;
}

/** Search text and status filter over a list of members, with per-status counts. */
export function useMemberFilters(members: Member[]): MemberFilters {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const needle = search.toLocaleLowerCase('es');
  const visible = members.filter(
    (member) =>
      (filter === 'all' || memberStatus(member) === filter) &&
      `${member.name} ${member.dni}`.toLocaleLowerCase('es').includes(needle),
  );
  const counts: Record<StatusFilter, number> = {
    all: members.length,
    active: 0,
    expiring: 0,
    expired: 0,
    scheduled: 0,
  };
  for (const member of members) counts[memberStatus(member)] += 1;

  function reset(next: StatusFilter = 'all'): void {
    setSearch('');
    setFilter(next);
  }

  return { search, setSearch, filter, setFilter, reset, visible, counts };
}
