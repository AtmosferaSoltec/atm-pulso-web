import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
export const MAX_MONTHS = 24;
export const durationPresets = [{ months: 1, amount: 100 }, { months: 2, amount: 190 }, { months: 3, amount: 270 }, { months: 6, amount: 500 }];
/** Calendar months from the start date; a day missing in the target month clamps to its last day. */
export function enrollmentEnd(terms: EnrollmentTerms): string {
 const date = new Date(`${terms.start}T12:00:00Z`);
 if (!Number.isFinite(date.getTime()) || !Number.isInteger(terms.months) || terms.months < 1 || terms.months > MAX_MONTHS) return '';
 const day = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + terms.months);
 const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); date.setUTCDate(Math.min(day, last));
 return date.toISOString().slice(0, 10);
}
export function enrollmentLabel(terms: EnrollmentTerms): string { return `${terms.months} ${terms.months === 1 ? 'mes' : 'meses'}`; }
