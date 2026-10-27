export type UserRole = 'superadmin' | 'admin' | 'receptionist';
export interface DemoUser { id: string; name: string; dni: string; organizationId: string; role: UserRole; branchIds: string[]; active?: boolean; }
