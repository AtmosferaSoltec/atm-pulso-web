export type AccessScope = 'branch' | 'gym' | 'network';
export interface Organization { contactName?: string; contactDni?: string; contactEmail?: string; contactPhone?: string; id: string; name: string; }
export interface Gym { id: string; organizationId: string; name: string; taxId: string; displayName?: string; brandColor?: string; /** Price of a single-entry pass, set by the gym's administrator in "Tarifas". */ dayPassPrice?: number; /** Whether members of this gym may enter its other branches. Allowed unless set to false by the gym's administrator. */ branchSharing?: boolean; logoUrl?: string; }
export interface Branch { id: string; gymId: string; name: string; address: string; }
