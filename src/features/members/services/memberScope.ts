import type { Member } from '@/features/members/types/member.types';
import { branches, gyms, type Organization, type Gym, type Branch, type AccessScope } from '@/features/organization';
/** Branches a scope covers by default: only the home branch, its gym, or the whole account. */
export function defaultAccessBranchIds(scope: AccessScope, homeBranchId: string, accountBranches: Branch[]): string[] {
 const home = accountBranches.find(branch => branch.id === homeBranchId);
 if (scope === 'branch' || !home) return [homeBranchId];
 return accountBranches.filter(branch => scope === 'network' || branch.gymId === home.gymId).map(branch => branch.id);
}
export function hasBranchAccess(member: Member, branchId: string, organization: Organization, gymList: Gym[] = gyms, branchList: Branch[] = branches): boolean {
 const home = branchList.find(branch => branch.id === member.homeBranchId); const target = branchList.find(branch => branch.id === branchId);
 if (member.organizationId !== organization.id || !home || !target || !gymList.some(gym => gym.id === target.gymId && gym.organizationId === organization.id) || !gymList.some(gym => gym.id === home.gymId && gym.organizationId === organization.id)) return false;
 if (home.id === target.id) return true;
 const homeGym = gymList.find(gym => gym.id === home.gymId);
 if (homeGym?.branchSharing === false) return false;
 if (member.accessBranchIds) return member.accessBranchIds.includes(target.id);
 return member.accessScope === 'network' || (member.accessScope === 'gym' && home.gymId === target.gymId);
}
