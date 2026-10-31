import type { AccessScope as ApiAccessScope, CatalogGym } from '@/types/api.types';

export type AccessScope = ApiAccessScope;

/** A branch with the data of its gym, flattened for pickers and labels. */
export interface BranchOption {
  id: string;
  name: string;
  address: string | null;
  /** Whether the signed-in user may work in it. */
  accessible: boolean;
  gymId: string;
  gymName: string;
  taxId: string | null;
  brandColor: string;
  branchSharing: boolean;
  dayPassPrice: string;
}

export type Gym = CatalogGym;
