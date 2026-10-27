import type { Page } from '@/types/navigation.types';
import type { SessionUser } from '@/types/api.types';

interface BranchRef {
  id: string;
  gymId: string;
}

/** Whether the user may change data. The superadmin only consults. */
export function canOperate(user: SessionUser | null): boolean {
  return !!user && user.role !== 'superadmin';
}

export function canManageTeam(user: SessionUser | null): boolean {
  return !!user && (user.role === 'owner' || user.role === 'admin');
}

/** Whether the user may manage the team and identity of a gym. */
export function canManageGym(user: SessionUser | null, gymId: string): boolean {
  if (!user) return false;
  return user.role === 'owner' || (user.role === 'admin' && user.gym?.id === gymId);
}

/** Branches the user can open: all for owners, the gym's for admins, the assigned ones for reception. */
export function canAccessBranch(user: SessionUser, branch: BranchRef): boolean {
  if (user.role === 'superadmin' || user.role === 'owner') return true;
  if (user.role === 'admin') return branch.gymId === user.gym?.id;
  return user.branches.some((assigned) => assigned.id === branch.id);
}

export function canVisitPage(user: SessionUser, page: Page): boolean {
  if (user.role === 'receptionist') return ['members', 'access', 'payments'].includes(page);
  return true;
}
