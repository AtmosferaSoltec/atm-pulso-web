import { useMemo, type ReactElement, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { Button } from '@/components/ui/button';
import { branchTitle, flattenBranches } from '@/features/organization/services/catalog';
import { CatalogContext, catalogKey, type CatalogValue } from '@/features/organization/hooks/useCatalog';
import type { Catalog } from '@/types/api.types';

/** Loads the organization's gyms and branches once and shares them with the whole workspace. */
export function CatalogProvider({ children }: { children: ReactNode }): ReactElement {
  const query = useQuery({ queryKey: catalogKey, queryFn: () => api.get<Catalog>('/catalog'), staleTime: 60_000 });
  const value = useMemo<CatalogValue | null>(() => {
    if (!query.data) return null;
    const branches = flattenBranches(query.data);
    return {
      organization: query.data.organization,
      gyms: query.data.gyms,
      branches,
      branchLabel: (id) => {
        const branch = branches.find((item) => item.id === id);
        return branch ? branchTitle(branch) : 'Sede no disponible';
      },
    };
  }, [query.data]);

  if (query.isError) {
    return (
      <div className="state-block" role="alert">
        <p className="error">{describeError(query.error)}</p>
        <Button variant="secondary" onClick={() => void query.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }
  if (!value) return <div className="state-block" role="status">Cargando…</div>;
  return <CatalogContext value={value}>{children}</CatalogContext>;
}
