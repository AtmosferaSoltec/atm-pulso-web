import { useDemoStore } from '@/store/demoStore';
import { canOperate, canWorkInBranch } from '@/features/auth';
import { DEMO_DATE } from '@/features/members';
import type { DayPass, DayPassSale } from '@/features/dayPasses/types/dayPass.types';
import { nextDayPassNumber } from '@/features/dayPasses/services/dayPass';

interface DayPassesApi {
  dayPasses: DayPass[];
  /** Charges a pass, lets the person in (it shows up in the access log) and returns it. */
  sellDayPass: (branchId: string, amount: number, sale: DayPassSale) => DayPass | null;
}

export function useDayPasses(organizationId: string): DayPassesApi {
  const { state, setState, currentUser } = useDemoStore();
  const dayPasses = state.dayPasses.filter((pass) => pass.organizationId === organizationId);

  function sellDayPass(branchId: string, amount: number, sale: DayPassSale): DayPass | null {
    if (!canOperate(currentUser, organizationId) || !canWorkInBranch(currentUser, branchId, state.branches) || !Number.isFinite(amount) || amount < 0) return null;
    const document = sale.document.trim();
    const pass: DayPass = {
      id: crypto.randomUUID(),
      organizationId,
      branchId,
      receiptNumber: nextDayPassNumber(dayPasses),
      date: DEMO_DATE,
      amount,
      method: sale.method,
      documentType: document ? sale.documentType : undefined,
      document: document || undefined,
      name: sale.name.trim() || undefined,
      phone: sale.phone.trim() || undefined,
    };
    const time = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' }).format(new Date());
    setState((current) => ({
      ...current,
      dayPasses: [pass, ...current.dayPasses],
      entries: [{ id: crypto.randomUUID(), name: pass.name ?? 'Pase del día', branchId, time, allowed: true, reason: `Pase del día ${pass.receiptNumber}` }, ...current.entries],
    }));
    return pass;
  }

  return { dayPasses, sellDayPass };
}
