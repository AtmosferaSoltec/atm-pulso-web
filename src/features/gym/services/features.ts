import type { CatalogGym, GymFeature } from '@/types/api.types';

/** Whether a gym has an optional module switched on. The API answers the list in `features`. */
export function gymHasFeature(gym: Pick<CatalogGym, 'features'> | undefined, feature: GymFeature): boolean {
  return gym?.features.includes(feature) ?? false;
}
