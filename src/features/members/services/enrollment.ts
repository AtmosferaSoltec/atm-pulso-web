import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';

export const MAX_MONTHS = 24;
/** Quick prices offered in the form. They are suggestions only: the amount typed is what is charged. */
export const durationPresets = [
  { months: 1, amount: 100 },
  { months: 2, amount: 190 },
  { months: 3, amount: 270 },
  { months: 6, amount: 500 },
];

/**
 * Preview of the end date shown while typing: calendar months from the start, clamping a day missing in
 * the target month. The server computes the real one and the form shows what it answers.
 */
export function enrollmentEnd(terms: Pick<EnrollmentTerms, 'start' | 'months'>): string {
  const date = new Date(`${terms.start}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || !Number.isInteger(terms.months) || terms.months < 1 || terms.months > MAX_MONTHS) return '';
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + terms.months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}
