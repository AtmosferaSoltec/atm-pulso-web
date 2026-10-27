export interface AccessEntry { id: string; name: string; memberId?: string; branchId: string; time: string; allowed: boolean; reason: string; }
export interface AccessResult { allowed: boolean; name?: string; reason: string; }
