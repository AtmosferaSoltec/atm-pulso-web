import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
export const durationPresets = [{ months: 1, amount: 100 }, { months: 2, amount: 190 }, { months: 3, amount: 270 }, { months: 6, amount: 500 }];
export function enrollmentEnd(terms: EnrollmentTerms): string {
 const date = new Date(`${terms.start}T12:00:00Z`);
 if (!Number.isFinite(date.getTime()) || !Number.isInteger(terms.quantity) || terms.quantity < 1 || terms.quantity > 730) return '';
 if (terms.unit === 'days') date.setUTCDate(date.getUTCDate() + terms.quantity);
 else { const day = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + terms.quantity); const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); date.setUTCDate(Math.min(day, last)); }
 return date.toISOString().slice(0, 10);
}
export function enrollmentTotal(terms: EnrollmentTerms): number { return Math.round(terms.amount * (1 - terms.discount / 100) * 100) / 100; }
export function enrollmentLabel(terms: EnrollmentTerms): string { return `${terms.quantity} ${terms.unit === 'months' ? terms.quantity === 1 ? 'mes' : 'meses' : terms.quantity === 1 ? 'día' : 'días'}`; }
