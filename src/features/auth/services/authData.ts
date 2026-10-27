import type { DemoUser } from '@/features/auth/types/auth.types';
export const demoUsers: DemoUser[] = [
 { id: 'platform-admin', name: 'Equipo Atmósfera', dni: '10000001', organizationId: '', role: 'superadmin', branchIds: [] },
 { id: 'owner-atlas', name: 'Andrea Salas', dni: '10000002', organizationId: 'atlas', role: 'owner', branchIds: [] },
 { id: 'admin-atlas', name: 'Carlos Medina', dni: '10000005', organizationId: 'atlas', role: 'admin', gymId: 'atlas-gym', branchIds: [] },
 { id: 'staff-atlas', name: 'Luis Rojas', dni: '10000003', organizationId: 'atlas', role: 'receptionist', branchIds: ['miraflores','barranco'] },
 { id: 'owner-central', name: 'Paola Vega', dni: '10000004', organizationId: 'central', role: 'owner', branchIds: [] },
];
export const DEMO_PASSWORD = 'Pulso2026!';
