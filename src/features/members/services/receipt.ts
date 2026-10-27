import type { Member } from '@/features/members/types/member.types';

/** Receipt numbers are sequential per account: R-000001, R-000002... */
export function formatReceiptNumber(sequence: number): string {
  return `R-${String(sequence).padStart(6, '0')}`;
}

function sequenceOf(receiptNumber: string | undefined): number {
  return Number(receiptNumber?.replace(/\D/g, '')) || 0;
}

/** The next free number given the receipts already issued in the account. */
export function nextReceiptNumber(issued: Member[]): string {
  return formatReceiptNumber(Math.max(0, ...issued.map((member) => sequenceOf(member.receiptNumber))) + 1);
}

/** Numbers a list of members in order, restarting the count for each account. */
export function assignReceiptNumbers(members: Member[]): Member[] {
  const counters = new Map<string, number>();
  return members.map((member) => {
    const sequence = (counters.get(member.organizationId) ?? 0) + 1;
    counters.set(member.organizationId, sequence);
    return { ...member, receiptNumber: formatReceiptNumber(sequence) };
  });
}
