import type { DemoUser } from '@/features/auth/types/auth.types';
export const demoUsers: DemoUser[] = [
 { id: 'platform-admin', name: 'Equipo Atmósfera', email: 'equipo@atmosfera.example', organizationId: '', role: 'superadmin', branchIds: [] },
 { id: 'owner-atlas', name: 'Andrea Salas', email: 'dueno@atlas.example', organizationId: 'atlas', role: 'admin', branchIds: ['miraflores','barranco','norte','distrito'] },
 { id: 'staff-atlas', name: 'Luis Rojas', email: 'recepcion@atlas.example', organizationId: 'atlas', role: 'receptionist', branchIds: ['miraflores','barranco'] },
 { id: 'owner-central', name: 'Paola Vega', email: 'dueno@central.example', organizationId: 'central', role: 'admin', branchIds: ['central'] },
];
export const DEMO_PASSWORD = 'Pulso2026!';
