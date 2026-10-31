import { createContext, useContext } from 'react';
import type { BranchOption } from '@/features/organization/types/organization.types';
import type { CatalogGym, Named } from '@/types/api.types';

export interface CatalogValue {
  organization: Named;
  gyms: CatalogGym[];
  branches: BranchOption[];
  branchLabel: (id: string) => string;
}

export const CatalogContext = createContext<CatalogValue | null>(null);

export const catalogKey = ['catalog'] as const;

export function useCatalog(): CatalogValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('CatalogProvider is required');
  return context;
}
