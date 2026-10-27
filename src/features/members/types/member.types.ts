import type { AccessScope } from '@/features/organization';
export interface Member {
 id: string; name: string; dni: string; phone: string; email: string;
 plan: string; start: string; end: string; paid: number; method: string;
 agreedAmount?: number; discount?: number;
 organizationId: string; homeBranchId: string; accessScope: AccessScope;
 paymentBranchId?: string; recordedAt?: string;
 periods?: { start: string; end: string }[];
}
export type MemberStatus = 'active' | 'expiring' | 'expired' | 'scheduled';
