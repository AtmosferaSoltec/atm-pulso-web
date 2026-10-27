import { type Member, hasBranchAccess, DEMO_DATE } from '@/features/members';
import type { Organization, Gym, Branch } from '@/features/organization';
import type { AccessResult } from '@/features/access/types/access.types';
import { formatDate } from '@/utils/formatDate';
export function evaluateAccess(dni: string, members: Member[], branchId: string, organization: Organization, gyms?: Gym[], branches?: Branch[]): AccessResult {
 const member = members.find(item => item.organizationId === organization.id && item.dni === dni);
 if (!member) return { allowed: false, reason: 'DNI no registrado en esta cuenta.' };
 if (!hasBranchAccess(member, branchId, organization, gyms, branches)) return { allowed: false, name: member.name, reason: 'La membresía no permite ingresar a esta sede.' };
 const periods = member.periods ?? [{ start: member.start, end: member.end }];
 const activePeriod = periods.find(period => period.start <= DEMO_DATE && period.end >= DEMO_DATE);
 if (!activePeriod) return { allowed: false, name: member.name, reason: periods.some(period => period.start > DEMO_DATE) ? 'La membresía todavía no está vigente. Revisa la fecha de inicio.' : `La membresía venció el ${formatDate(member.end)}.` };
 return { allowed: true, name: member.name, reason: `Membresía vigente hasta el ${formatDate(activePeriod.end)}.` };
}
