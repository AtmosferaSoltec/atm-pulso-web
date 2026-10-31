import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { request } from '@/config/apiClient';

export interface KioskSettings {
  pin_set: boolean;
}

const settingsKey = ['kiosk', 'settings'] as const;

/** Whether the gym already has an exit PIN (the PIN itself is never returned). */
export function useKioskSettings(enabled: boolean): UseQueryResult<KioskSettings> {
  return useQuery({ queryKey: settingsKey, queryFn: () => request<KioskSettings>('GET', '/kiosk/settings'), enabled, staleTime: 0 });
}

/** Admin only: sets or replaces the exit PIN. */
export function useSetKioskPin(): UseMutationResult<KioskSettings, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pin: string) => request<KioskSettings>('PUT', '/kiosk/pin', { body: { pin } }),
    onSuccess: (settings) => queryClient.setQueryData(settingsKey, settings),
  });
}

/** Asks the API to check the exit PIN; resolves when it matches. */
export function verifyKioskPin(pin: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('POST', '/kiosk/exit', { body: { pin } });
}
