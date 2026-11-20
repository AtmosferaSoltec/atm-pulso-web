import { useState } from 'react';
import type { MemberStatus } from '@/features/members/types/member.types';

export type StatusFilter = MemberStatus | 'all';

export const statusFilters: StatusFilter[] = ['all', 'active', 'expiring', 'expired', 'scheduled'];

/** What the list shows: a membership status, or "debtors" (members who owe pending sales; only with the sales module). */
export type MemberListFilter = StatusFilter | 'debtors';

export interface MemberFilters {
  search: string;
  setSearch: (value: string) => void;
  filter: MemberListFilter;
  setFilter: (value: MemberListFilter) => void;
  page: number;
  setPage: (value: number) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
  reset: (filter?: MemberListFilter) => void;
}

/** What the member list is filtered by. The server does the filtering and the counting. */
export function useMemberFilters(): MemberFilters {
  const [search, setSearchValue] = useState('');
  const [filter, setFilterValue] = useState<MemberListFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = useState(25);

  return {
    search,
    setSearch: (value) => {
      setSearchValue(value);
      setPage(1);
    },
    filter,
    setFilter: (value) => {
      setFilterValue(value);
      setPage(1);
    },
    page,
    setPage,
    pageSize,
    setPageSize: (value) => {
      setPageSizeValue(value);
      setPage(1);
    },
    reset: (next = 'all') => {
      setSearchValue('');
      setFilterValue(next);
      setPage(1);
    },
  };
}
