import { useDemoStore } from '@/store/demoStore';
import { canManageGym, canManageTeam, type DemoUser } from '@/features/auth';
import type { DemoState } from '@/types/demo.types';

/** Roles an owner or admin can hand out. Owners are created by Atmósfera only. */
const assignableRoles: DemoUser['role'][] = ['admin', 'receptionist'];

/**
 * Whether `actor` may manage `target`. Owners manage admins and receptionists of any gym; admins only
 * manage receptionists of their own gym, never other admins.
 */
function inScope(state: DemoState, actor: DemoUser | null, organizationId: string, target: DemoUser): boolean {
  if (!assignableRoles.includes(target.role) || target.organizationId !== organizationId) return false;
  if (target.role === 'admin' && actor?.role !== 'owner') return false;
  const gymIds = state.gyms.filter((gym) => gym.organizationId === organizationId).map((gym) => gym.id);
  const controls = (gymId: string | undefined): boolean => !!gymId && gymIds.includes(gymId) && canManageGym(actor, gymId);
  if (target.role === 'admin') return controls(target.gymId);
  return (
    target.branchIds.length > 0 &&
    target.branchIds.every((id) => controls(state.branches.find((branch) => branch.id === id)?.gymId))
  );
}

interface TeamApi {
  users: DemoUser[];
  saveUser: (user: DemoUser) => void;
  toggleUser: (id: string) => void;
}

export function useTeam(organizationId: string): TeamApi {
  const { state, setState, currentUser } = useDemoStore();

  function saveUser(user: DemoUser): void {
    if (!canManageTeam(currentUser, organizationId) || user.id === currentUser?.id) return;
    setState((current) => {
      const existing = current.users.find((item) => item.id === user.id);
      const clean: DemoUser = user.role === 'admin' ? { ...user, branchIds: [] } : { ...user, gymId: undefined };
      const duplicate = current.users.some((item) => item.id !== user.id && item.dni === user.dni);
      if (duplicate || !inScope(current, currentUser, organizationId, clean) || (existing && !inScope(current, currentUser, organizationId, existing))) {
        return current;
      }
      return {
        ...current,
        users: existing ? current.users.map((item) => (item.id === user.id ? clean : item)) : [...current.users, clean],
      };
    });
  }

  function toggleUser(id: string): void {
    if (!canManageTeam(currentUser, organizationId) || currentUser?.id === id) return;
    setState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === id && inScope(current, currentUser, organizationId, user) ? { ...user, active: user.active === false } : user,
      ),
    }));
  }

  const visible = state.users.filter(
    (user) =>
      user.organizationId === organizationId &&
      user.role !== 'superadmin' &&
      (currentUser?.role !== 'admin' || user.id === currentUser.id || inScope(state, currentUser, organizationId, user)),
  );
  return { users: visible, saveUser, toggleUser };
}
