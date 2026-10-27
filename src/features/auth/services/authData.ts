import type { DemoUser } from '@/features/auth/types/auth.types';
export const demoUsers: DemoUser[] = [
 { id: 'platform-admin', name: 'Equipo Atmósfera', dni: '10000001', organizationId: '', role: 'superadmin', branchIds: [] },
 { id: 'owner-atlas', name: 'Andrea Salas', dni: '10000002', organizationId: 'atlas', role: 'admin', branchIds: ['miraflores','barranco','norte','distrito'] },
 { id: 'staff-atlas', name: 'Luis Rojas', dni: '10000003', organizationId: 'atlas', role: 'receptionist', branchIds: ['miraflores','barranco'] },
 { id: 'owner-central', name: 'Paola Vega', dni: '10000004', organizationId: 'central', role: 'admin', branchIds: ['central'] },
];
export const DEMO_PASSWORD = 'Pulso2026!';
