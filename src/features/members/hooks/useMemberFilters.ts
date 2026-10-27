import { useState } from 'react';
import type { MemberStatus } from '@/features/members/types/member.types';

export type StatusFilter = MemberStatus | 'all';

export const statusFilters: StatusFilter[] = ['all', 'active', 'expiring', 'expired', 'scheduled'];

export interface MemberFilters {
  search: string;
  setSearch: (value: string) => void;
  filter: StatusFilter;
  setFilter: (value: StatusFilter) => void;
  page: number;
  setPage: (value: number) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
  reset: (filter?: StatusFilter) => void;
}

/** What the member list is filtered by. The server does the filtering and the counting. */
export function useMemberFilters(): MemberFilters {
  const [search, setSearchValue] = useState('');
  const [filter, setFilterValue] = useState<StatusFilter>('all');
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
