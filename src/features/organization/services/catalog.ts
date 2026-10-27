import type { Catalog, CatalogGym } from '@/types/api.types';
import type { BranchOption } from '@/features/organization/types/organization.types';

/** What the screens call a gym: its display name when it has one. */
export function gymTitle(gym: Pick<CatalogGym, 'name' | 'display_name'>): string {
  return gym.display_name?.trim() || gym.name;
}

/** Every branch of the organization, with the data of its gym. */
export function flattenBranches(catalog: Catalog): BranchOption[] {
  return catalog.gyms.flatMap((gym) =>
    gym.branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      accessible: branch.accessible,
      gymId: gym.id,
      gymName: gymTitle(gym),
      taxId: gym.tax_id,
      brandColor: gym.brand_color,
      branchSharing: gym.branch_sharing,
      dayPassPrice: gym.day_pass_price,
    })),
  );
}

/** "Atlas Fitness · Miraflores". */
export function branchTitle(branch: Pick<BranchOption, 'gymName' | 'name'>): string {
  return `${branch.gymName} · ${branch.name}`;
}
