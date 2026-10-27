import { useDemoStore } from '@/store/demoStore';
import { branchLabel as formatBranchLabel, organizationBranches as selectBranches } from '@/features/organization/services/organizationData';
import type { Branch, Gym, Organization } from '@/features/organization/types/organization.types';
export function useOrganizationCatalog(): { organizations: Organization[]; gyms: Gym[]; branches: Branch[]; branchLabel: (id: string) => string; organizationBranches: (id: string) => Branch[] } {
 const { state } = useDemoStore();
 return { organizations: state.organizations, gyms: state.gyms, branches: state.branches, branchLabel: id => formatBranchLabel(id, state.gyms, state.branches), organizationBranches: id => selectBranches(id, state.gyms, state.branches) };
}
