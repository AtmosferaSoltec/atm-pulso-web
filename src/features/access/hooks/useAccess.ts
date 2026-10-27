import { useDemoStore } from '@/store/demoStore';
import { canOperate } from '@/features/auth';
import type { Member } from '@/features/members';
import type { Organization } from '@/features/organization';
import type { AccessEntry, AccessResult } from '@/features/access/types/access.types';
import { evaluateAccess } from '@/features/access/services/accessService';
export function useAccess(): { entries: AccessEntry[]; checkAccess: (dni: string, members: Member[], branchId: string, organization: Organization) => AccessResult } {
 const { state, setState, currentUser } = useDemoStore();
 function checkAccess(dni: string, members: Member[], branchId: string, organization: Organization): AccessResult {
  if (!canOperate(currentUser, organization.id) || (currentUser?.role === 'receptionist' && !currentUser.branchIds.includes(branchId))) return { allowed: false, reason: 'Operación no disponible.' };
  const result = evaluateAccess(dni, members, branchId, organization, state.gyms, state.branches);
  const time = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' }).format(new Date());
  setState(current => ({ ...current, entries: [{ id: crypto.randomUUID(), name: result.name ?? `DNI ${dni}`, memberId: members.find(member => member.dni === dni)?.id, branchId, time, allowed: result.allowed, reason: result.reason }, ...current.entries] }));
  return result;
 }
 return { entries: state.entries, checkAccess };
}
