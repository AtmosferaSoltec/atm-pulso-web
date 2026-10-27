import type { AccessScope } from '@/features/organization';
import type { DocumentType } from '@/config/documentTypes';
export interface Member {
 id: string; name: string;
 /** Document number: a DNI, or a carné de extranjería when `documentType` is "ce". */
 dni: string; documentType?: DocumentType; phone: string;
 plan: string; start: string; end: string; paid: number; method: string;
 organizationId: string; homeBranchId: string; accessScope: AccessScope;
 /** Branches the membership opens, always including `homeBranchId`. When missing, `accessScope` decides. */
 accessBranchIds?: string[];
 /** Sequential number of the latest registration or renewal receipt, e.g. R-000012. */
 receiptNumber?: string;
 paymentBranchId?: string; recordedAt?: string;
 periods?: { start: string; end: string }[];
}
export type MemberStatus = 'active' | 'expiring' | 'expired' | 'scheduled';
