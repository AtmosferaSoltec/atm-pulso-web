import type { Member } from '@/features/members/types/member.types';
import { branches, gyms, type Organization, type Gym, type Branch } from '@/features/organization';
export function directoryMembers(members: Member[], organization: Organization, branchId: string): Member[] {
 return members.filter(member => member.organizationId === organization.id && (organization.shareDirectory || member.homeBranchId === branchId));
}
export function hasBranchAccess(member: Member, branchId: string, organization: Organization, gymList: Gym[] = gyms, branchList: Branch[] = branches): boolean {
 const home = branchList.find(branch => branch.id === member.homeBranchId); const target = branchList.find(branch => branch.id === branchId);
 if (member.organizationId !== organization.id || !home || !target || !gymList.some(gym => gym.id === target.gymId && gym.organizationId === organization.id) || !gymList.some(gym => gym.id === home.gymId && gym.organizationId === organization.id)) return false;
 if (home.id === target.id) return true;
 if (!organization.crossBranchAccess) return false;
 return member.accessScope === 'network' || (member.accessScope === 'gym' && home.gymId === target.gymId);
}
