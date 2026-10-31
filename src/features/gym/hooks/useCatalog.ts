import { createContext, useContext } from 'react';
import type { BranchOption } from '@/features/gym/types/gym.types';
import type { CatalogGym } from '@/types/api.types';

export interface CatalogValue {
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
