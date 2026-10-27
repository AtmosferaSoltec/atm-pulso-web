import type { PaymentMethod } from '@/types/api.types';

export interface EnrollmentTerms {
  /** Membership length in whole months. Memberships are always sold by the month. */
  months: number;
  /** YYYY-MM-DD. */
  start: string;
  /** Total amount charged. Any discount is negotiated directly in this figure. */
  amount: number;
  method: PaymentMethod;
}
