import type { DocumentType } from '@/config/documentTypes';

/** A single-entry sale: no membership, no member record. Customer data is optional. */
export interface DayPass {
  id: string;
  organizationId: string;
  branchId: string;
  /** Sequential per account: D-000001, D-000002... */
  receiptNumber: string;
  /** ISO date of the sale and of the only day the pass is valid. */
  date: string;
  amount: number;
  method: string;
  documentType?: DocumentType;
  document?: string;
  name?: string;
  phone?: string;
}

/** What reception can capture when selling a pass. Everything but the payment method is optional. */
export interface DayPassSale {
  method: string;
  documentType: DocumentType;
  document: string;
  name: string;
  phone: string;
}
