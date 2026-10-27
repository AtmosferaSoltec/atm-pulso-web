import { useDemoStore } from '@/store/demoStore';
import { canOperate, canWorkInBranch } from '@/features/auth';
import type { Member } from '@/features/members';
import type { Organization } from '@/features/organization';
import type { AccessEntry, AccessResult, DemoScenario } from '@/features/access/types/access.types';
import { demoScenarios, evaluateAccess } from '@/features/access/services/accessService';
export function useAccess(): { entries: AccessEntry[]; checkAccess: (dni: string, members: Member[], branchId: string, organization: Organization) => AccessResult; scenarios: (members: Member[], branchId: string, organization: Organization) => DemoScenario[] } {
 const { state, setState, currentUser } = useDemoStore();
 function checkAccess(dni: string, members: Member[], branchId: string, organization: Organization): AccessResult {
  if (!canOperate(currentUser, organization.id) || !canWorkInBranch(currentUser, branchId, state.branches)) return { allowed: false, reason: 'Operación no disponible.' };
  const result = evaluateAccess(dni, members, branchId, organization, state.gyms, state.branches);
  const time = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' }).format(new Date());
  setState(current => ({ ...current, entries: [{ id: crypto.randomUUID(), name: result.name ?? `Documento ${dni}`, memberId: members.find(member => member.dni === dni)?.id, branchId, time, allowed: result.allowed, reason: result.reason }, ...current.entries] }));
  return result;
 }
 const scenarios = (members: Member[], branchId: string, organization: Organization): DemoScenario[] => demoScenarios(members, branchId, organization, state.gyms, state.branches);
 return { entries: state.entries, checkAccess, scenarios };
}
