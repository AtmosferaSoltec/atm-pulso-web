import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import type { DayPass } from '@/types/api.types';
import type { DayPassSale } from '@/features/dayPasses/types/dayPass.types';

/**
 * Sells a pass at a branch. The price is the gym's: the server charges it and lets the person in
 * (it shows up in the access log), so nothing about the amount is sent.
 */
export function useSellDayPass(branchId: string): UseMutationResult<DayPass, Error, DayPassSale> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sale: DayPassSale) => {
      const document = sale.document.trim();
      const visitor = {
        ...(document ? { document_type: sale.documentType, document_number: document } : {}),
        ...(sale.name.trim() ? { full_name: sale.name.trim() } : {}),
        ...(sale.phone.trim() ? { phone: sale.phone.trim() } : {}),
      };
      return api.post<DayPass>('/day-passes', {
        id: crypto.randomUUID(),
        branch_id: branchId,
        method: sale.method,
        ...(Object.keys(visitor).length ? { visitor } : {}),
      });
    },
    onSuccess: async () => {
      await Promise.all(['access', 'payments', 'dashboard', 'receipts'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });
}
