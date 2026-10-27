import type { Organization, Gym, Branch } from '@/features/organization/types/organization.types';
export const initialOrganizations: Organization[] = [
 { id: 'atlas', name: 'Grupo Atlas' },
 { id: 'central', name: 'Gimnasio Central' },
];
export const gyms: Gym[] = [
 { id: 'atlas-gym', organizationId: 'atlas', name: 'Atlas Fitness', brandColor: '#17677b', dayPassPrice: 20, taxId: 'DEMO-001' },
 { id: 'norte-gym', organizationId: 'atlas', name: 'Norte Gym', brandColor: '#356443', dayPassPrice: 15, taxId: 'DEMO-002' },
 { id: 'distrito-gym', organizationId: 'atlas', name: 'Distrito Fuerza', brandColor: '#7751a3', dayPassPrice: 15, taxId: 'DEMO-003' },
 { id: 'central-gym', organizationId: 'central', name: 'Gimnasio Central', brandColor: '#ad522a', dayPassPrice: 12, taxId: 'DEMO-004' },
];
export const branches: Branch[] = [
 { id: 'miraflores', gymId: 'atlas-gym', name: 'Miraflores', address: 'Av. de Ejemplo 101' },
 { id: 'barranco', gymId: 'atlas-gym', name: 'Barranco', address: 'Calle de Ejemplo 202' },
 { id: 'norte', gymId: 'norte-gym', name: 'Los Olivos', address: 'Av. de Ejemplo 303' },
 { id: 'distrito', gymId: 'distrito-gym', name: 'San Miguel', address: 'Calle de Ejemplo 404' },
 { id: 'central', gymId: 'central-gym', name: 'Sede principal', address: 'Av. de Ejemplo 505' },
];
export function organizationBranches(organizationId: string, gymList: Gym[] = gyms, branchList: Branch[] = branches): Branch[] { return branchList.filter(branch => gymList.some(gym => gym.id === branch.gymId && gym.organizationId === organizationId)); }
export function branchLabel(branchId: string, gymList: Gym[] = gyms, branchList: Branch[] = branches): string { const branch = branchList.find(item => item.id === branchId); const gym = gymList.find(item => item.id === branch?.gymId); return branch && gym ? `${gym.name} · ${branch.name}` : 'Sede no disponible'; }
