import type { Page } from '@/types/navigation.types';
import { pageFeatures } from '@/config/pages';
import type { GymFeature, SessionUser } from '@/types/api.types';

interface BranchRef {
  id: string;
}

/** Whether the user manages the account: the team, the gyms' prices and identity. */
export function canManageAccount(user: SessionUser | null): boolean {
  return user?.role === 'admin';
}

/** Branches the user can open: all for an admin, the assigned ones for reception. */
export function canAccessBranch(user: SessionUser, branch: BranchRef): boolean {
  if (user.role === 'admin') return true;
  return user.branches.some((assigned) => assigned.id === branch.id);
}

/** `features` are the modules the gym has switched on (`useGymFeatures`); a page of a module the gym lacks is not visitable. */
export function canVisitPage(user: SessionUser, page: Page, features: ReadonlySet<GymFeature>): boolean {
  const required = pageFeatures[page];
  if (required && !features.has(required)) return false;
  if (user.role === 'receptionist') return ['members', 'access', 'payments', 'kiosk', 'sell', 'sales'].includes(page);
  return true;
}
