import { useCatalog } from '@/features/gym/hooks/useCatalog';
import { gymHasFeature } from '@/features/gym/services/features';
import type { GymFeature } from '@/types/api.types';

/**
 * The optional modules ("products", "body_tracking", "kiosk") of the gym the person works in. The only way
 * to decide whether to show a module's screens, buttons or menu entries: Atmósfera switches them from the
 * console and the API refuses their routes (`FEATURE_DISABLED`) when they are off.
 */
export function useGymFeatures(): ReadonlySet<GymFeature> {
  const { gyms } = useCatalog();
  // The catalog holds exactly one gym: the current one.
  return new Set(gyms[0]?.features ?? []);
}

/** Whether the current gym has `feature` switched on. */
export function useHasFeature(feature: GymFeature): boolean {
  const { gyms } = useCatalog();
  return gymHasFeature(gyms[0], feature);
}
