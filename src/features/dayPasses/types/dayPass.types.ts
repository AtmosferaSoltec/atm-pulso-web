import type { DocumentType } from '@/config/documentTypes';
import type { PaymentMethod } from '@/types/api.types';

/** What reception can capture when selling a pass. Everything but the payment method is optional. */
export interface DayPassSale {
  method: PaymentMethod;
  documentType: DocumentType;
  document: string;
  name: string;
  phone: string;
}
