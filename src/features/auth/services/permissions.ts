import type { DemoUser } from '@/features/auth/types/auth.types';
import type { Page } from '@/types/navigation.types';

interface BranchRef { id: string; gymId: string }

export function canOperate(user: DemoUser | null, organizationId: string): boolean {
  return !!user && user.active !== false && user.role !== 'superadmin' && user.organizationId === organizationId;
}

export function canManageTeam(user: DemoUser | null, organizationId: string): boolean {
  return canOperate(user, organizationId) && (user?.role === 'owner' || user?.role === 'admin');
}

/** Whether the user may manage the team and identity of a gym. */
export function canManageGym(user: DemoUser | null, gymId: string): boolean {
  if (!user || user.active === false) return false;
  return user.role === 'owner' || (user.role === 'admin' && user.gymId === gymId);
}

/** Branches the user can open: all for owners, the gym's for admins, the assigned ones for reception. */
export function canAccessBranch(user: DemoUser, branch: BranchRef): boolean {
  if (user.role === 'superadmin' || user.role === 'owner') return true;
  if (user.role === 'admin') return branch.gymId === user.gymId;
  return user.branchIds.includes(branch.id);
}

export function canWorkInBranch(user: DemoUser | null, branchId: string, branches: BranchRef[]): boolean {
  const branch = branches.find((item) => item.id === branchId);
  return !!user && !!branch && canAccessBranch(user, branch);
}

export function canVisitPage(user: DemoUser, page: Page): boolean {
  if (user.role === 'receptionist') return ['members', 'access', 'payments'].includes(page);
  return true;
}
