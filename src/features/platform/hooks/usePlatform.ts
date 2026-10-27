import { useDemoStore } from '@/store/demoStore';
import type { ClientDraft, GymDraft } from '@/features/platform/types/platform.types';
import type { Gym, Branch } from '@/features/organization';
export function usePlatform(): { createClient: (draft: ClientDraft) => string | null; addGym: (organizationId: string, draft: GymDraft) => void; addBranch: (gymId: string, name: string, address: string) => void } {
 const { setState, currentUser } = useDemoStore();
 function createClient(draft: ClientDraft): string | null {
  if (currentUser?.role !== 'superadmin') return null;
  const id = crypto.randomUUID();
  const gyms: Gym[] = draft.gyms.map(gym => ({ id: gym.id, name: gym.name.trim(), organizationId: id, taxId: gym.taxId.trim(), brandColor: '#17677b' }));
  const branches: Branch[] = draft.gyms.flatMap(gym => gym.branches.map(branch => ({ ...branch, name: branch.name.trim(), gymId: gym.id })));
  setState(current => current.users.some(user => user.dni === draft.contactDni.trim()) ? current : ({ ...current,
   organizations: [...current.organizations, { id, name: draft.name.trim(), accountType: draft.accountType, contactName: draft.contactName.trim(), contactDni: draft.contactDni.trim(), shareDirectory: false, crossBranchAccess: false, defaultAccessScope: 'branch' }],
   gyms: [...current.gyms, ...gyms], branches: [...current.branches, ...branches],
   users: [...current.users, { id: crypto.randomUUID(), name: draft.contactName.trim(), dni: draft.contactDni.trim(), organizationId: id, role: 'admin', branchIds: branches.map(branch => branch.id), active: true }],
  }));
  return id;
 }
 function addGym(organizationId: string, draft: GymDraft): void { if (currentUser?.role !== 'superadmin') return; setState(current => !current.organizations.some(item => item.id === organizationId) ? current : ({ ...current, gyms: [...current.gyms, { id: draft.id, organizationId, name: draft.name.trim(), taxId: draft.taxId.trim(), brandColor: '#17677b' }], branches: [...current.branches, ...draft.branches.map(branch => ({ ...branch, name: branch.name.trim(), gymId: draft.id }))] })); }
 function addBranch(gymId: string, name: string, address: string): void { if (currentUser?.role !== 'superadmin' || !name.trim()) return; setState(current => !current.gyms.some(gym => gym.id === gymId) ? current : ({ ...current, branches: [...current.branches, { id: crypto.randomUUID(), gymId, name: name.trim(), address: address.trim() }] })); }
 return { createClient, addGym, addBranch };
}
