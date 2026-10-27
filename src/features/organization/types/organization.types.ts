export type AccessScope = 'branch' | 'gym' | 'network';
export interface Organization { accountType?: 'business' | 'individual'; contactName?: string; contactEmail?: string; id: string; name: string; shareDirectory: boolean; crossBranchAccess: boolean; defaultAccessScope: AccessScope; }
export interface Gym { id: string; organizationId: string; name: string; taxId: string; displayName?: string; brandColor?: string; logoUrl?: string; }
export interface Branch { id: string; gymId: string; name: string; address: string; }
