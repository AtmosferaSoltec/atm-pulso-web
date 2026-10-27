import { type Member, hasBranchAccess, memberStatus, DEMO_DATE } from '@/features/members';
import type { Organization, Gym, Branch } from '@/features/organization';
import type { AccessResult, DemoScenario, ScenarioId } from '@/features/access/types/access.types';
import { formatDate } from '@/utils/formatDate';
export function evaluateAccess(dni: string, members: Member[], branchId: string, organization: Organization, gyms?: Gym[], branches?: Branch[]): AccessResult {
 const member = members.find(item => item.organizationId === organization.id && item.dni === dni);
 if (!member) return { allowed: false, reason: 'Documento no registrado en esta cuenta.' };
 if (!hasBranchAccess(member, branchId, organization, gyms, branches)) return { allowed: false, name: member.name, reason: 'La membresía no permite ingresar a esta sede.' };
 const periods = member.periods ?? [{ start: member.start, end: member.end }];
 const activePeriod = periods.find(period => period.start <= DEMO_DATE && period.end >= DEMO_DATE);
 if (!activePeriod) return { allowed: false, name: member.name, reason: periods.some(period => period.start > DEMO_DATE) ? 'La membresía todavía no está vigente. Revisa la fecha de inicio.' : `La membresía venció el ${formatDate(member.end)}.` };
 return { allowed: true, name: member.name, reason: `Membresía vigente hasta el ${formatDate(activePeriod.end)}.` };
}

const scenarioLabels: Record<ScenarioId, string> = {
 valid: 'Vigente',
 expiring: 'Por vencer',
 expired: 'Vencido',
 scheduled: 'Por iniciar',
 branch: 'Otra sede',
 unknown: 'No registrado',
};
const scenarioOrder: ScenarioId[] = ['valid', 'expiring', 'expired', 'scheduled', 'branch', 'unknown'];
const UNKNOWN_DNI = '00000000';
/** Picks, from the account's real members, one DNI for each kind of outcome available at this branch. */
export function demoScenarios(members: Member[], branchId: string, organization: Organization, gyms?: Gym[], branches?: Branch[]): DemoScenario[] {
 const statusScenario = { active: 'valid', expiring: 'expiring', expired: 'expired', scheduled: 'scheduled' } as const;
 const found: Partial<Record<ScenarioId, Member>> = {};
 for (const member of members.filter(item => item.organizationId === organization.id)) {
  const id: ScenarioId = hasBranchAccess(member, branchId, organization, gyms, branches) ? statusScenario[memberStatus(member)] : 'branch';
  found[id] ??= member;
 }
 return scenarioOrder.flatMap((id): DemoScenario[] => {
  if (id === 'unknown') return [{ id, label: scenarioLabels[id], dni: UNKNOWN_DNI, hint: 'Documento que no existe en la cuenta' }];
  const member = found[id];
  return member ? [{ id, label: scenarioLabels[id], dni: member.dni, hint: member.name }] : [];
 });
}
