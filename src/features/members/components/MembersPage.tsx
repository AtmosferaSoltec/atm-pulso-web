import { useState, type ReactElement } from 'react';
import { download } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { DownloadMenu } from '@/components/common/DownloadMenu';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { MemberTable } from '@/features/members/components/MemberTable';
import { StatusFilterBar } from '@/features/members/components/StatusFilterBar';
import { useMemberList } from '@/features/members/hooks/useMembers';
import type { MemberFilters, StatusFilter } from '@/features/members/hooks/useMemberFilters';
import type { Member } from '@/features/members/types/member.types';
import type { MemberCounts } from '@/types/api.types';
import { downloadFileName, type DownloadFormat } from '@/utils/downloadFile';
import { todayInLima } from '@/utils/limaDate';

const PAGE_SIZES = [10, 25, 50];
const emptyCounts: MemberCounts = { all: 0, active: 0, expiring: 0, expired: 0, scheduled: 0 };

interface MembersPageProps {
  filters: MemberFilters;
  showBranch: boolean;
  /** The download is for the admin only (the API refuses reception). */
  canDownload?: boolean;
  onSelect: (member: Member) => void;
  onEdit: (member: Member) => void;
  onRenew: (member: Member) => void;
}

export function MembersPage({ filters, showBranch, canDownload = false, onSelect, onEdit, onRenew }: MembersPageProps): ReactElement {
  const search = useDebouncedValue(filters.search.trim());
  const list = useMemberList({
    search,
    status: filters.filter,
    page: filters.page,
    pageSize: filters.pageSize,
  });
  const counts: Record<StatusFilter, number> = list.data?.meta.counts ?? emptyCounts;
  const [downloadError, setDownloadError] = useState('');

  /** The same filters as the list on screen (search and status), every page. */
  async function downloadMembers(format: DownloadFormat): Promise<void> {
    setDownloadError('');
    try {
      await download('/members/export', downloadFileName('miembros', todayInLima(), format), {
        q: search,
        status: filters.filter === 'all' ? '' : filters.filter,
        format,
      });
    } catch (failure) {
      setDownloadError(describeError(failure));
    }
  }

  return (
    <section className="card members-card">
      <div className="members-toolbar">
        <div className="search-field">
          <Icon name="search" size={18} />
          <Input
            aria-label="Buscar miembro por nombre o documento"
            placeholder="Nombre o documento"
            value={filters.search}
            onChange={(event) => filters.setSearch(event.target.value)}
          />
        </div>
        <StatusFilterBar value={filters.filter} counts={counts} onChange={filters.setFilter} />
        {canDownload && <DownloadMenu title="Descargar los miembros filtrados" onDownload={downloadMembers} />}
      </div>
      {downloadError && (
        <p className="error" role="alert">
          {downloadError}
        </p>
      )}
      {list.isError && (
        <p className="error" role="alert">
          {describeError(list.error)}
        </p>
      )}
      <MemberTable
        members={list.data?.data ?? []}
        loading={list.isPending}
        onSelect={onSelect}
        onEdit={onEdit}
        onRenew={onRenew}
        showBranch={showBranch}
      />
      {list.data && list.data.meta.total > PAGE_SIZES[0] && (
        <Pagination
          page={filters.page}
          pageSize={filters.pageSize}
          total={list.data.meta.total}
          pageSizes={PAGE_SIZES}
          onPageChange={filters.setPage}
          onPageSizeChange={filters.setPageSize}
        />
      )}
    </section>
  );
}
