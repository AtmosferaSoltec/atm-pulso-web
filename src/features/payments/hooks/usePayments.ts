import { DEMO_DATE, type Member } from '@/features/members';
import { useDemoStore } from '@/store/demoStore';
import { canOperate } from '@/features/auth';
export function usePayments(organizationId: string): { paymentRecords: Member[]; recordPayment: (member: Member, branchId: string) => void } {
 const { state, setState, currentUser } = useDemoStore();
 function recordPayment(member: Member, branchId: string): void {
  if (!canOperate(currentUser, organizationId) || member.organizationId !== organizationId || (currentUser?.role === 'receptionist' && !currentUser.branchIds.includes(branchId))) return;
  setState(current => ({ ...current, payments: [{ ...member, id: crypto.randomUUID(), paymentBranchId: branchId, recordedAt: DEMO_DATE }, ...current.payments] }));
 }
 return { paymentRecords: state.payments.filter(member => member.organizationId === organizationId), recordPayment };
}
