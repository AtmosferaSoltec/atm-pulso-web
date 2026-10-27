import { useDemoStore } from '@/store/demoStore';
import { canManageAccount, type DemoUser } from '@/features/auth';
export function useTeam(organizationId: string): { users: DemoUser[]; saveUser: (user: DemoUser) => void; toggleUser: (id: string) => void } {
 const { state, setState, currentUser } = useDemoStore();
 function saveUser(user: DemoUser): void {
  if (!canManageAccount(currentUser, organizationId) || user.organizationId !== organizationId || user.role === 'superadmin' || user.id === currentUser?.id) return;
  setState(current => {
   const allowedIds = current.branches.filter(branch => current.gyms.some(gym => gym.id === branch.gymId && gym.organizationId === organizationId)).map(branch => branch.id);
   if (user.branchIds.some(id => !allowedIds.includes(id)) || (user.role === 'receptionist' && user.branchIds.length === 0) || current.users.some(item => item.id !== user.id && item.email.toLowerCase() === user.email.toLowerCase())) return current;
   return { ...current, users: current.users.some(item => item.id === user.id) ? current.users.map(item => item.id === user.id ? user : item) : [...current.users, user] };
  });
 }
 function toggleUser(id: string): void { if (!canManageAccount(currentUser, organizationId) || currentUser?.id === id) return; setState(current => ({ ...current, users: current.users.map(user => user.id === id && user.organizationId === organizationId && user.role !== 'superadmin' ? { ...user, active: user.active === false } : user) })); }
 return { users: state.users.filter(user => user.organizationId === organizationId && user.role !== 'superadmin'), saveUser, toggleUser };
}
