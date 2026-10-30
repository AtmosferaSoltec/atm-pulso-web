import type { Page } from '@/types/navigation.types';
import type { SessionUser } from '@/types/api.types';

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

export function canVisitPage(user: SessionUser, page: Page): boolean {
  if (user.role === 'receptionist') return ['members', 'access', 'payments'].includes(page);
  return true;
}
