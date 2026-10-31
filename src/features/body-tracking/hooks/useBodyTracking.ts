import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/config/apiClient';
import type { BodyMeasurement, BodyMeasurementInput, BodyRoutine, BodyRoutineInput } from '@/types/api.types';

/** Health data lives under its own key so nothing else invalidates or reads it. */
const key = (memberId: string, kind: 'measurements' | 'routines'): readonly unknown[] => ['body-tracking', memberId, kind];

/** Every read is recorded by the API in the access log, so queries only run once `enabled` (the section was opened). */
export function useMeasurements(memberId: string, enabled: boolean): UseQueryResult<BodyMeasurement[]> {
  return useQuery({ queryKey: key(memberId, 'measurements'), queryFn: () => api.get<BodyMeasurement[]>(`/members/${memberId}/measurements`), enabled, staleTime: 30_000 });
}

export function useRoutines(memberId: string, enabled: boolean): UseQueryResult<BodyRoutine[]> {
  return useQuery({ queryKey: key(memberId, 'routines'), queryFn: () => api.get<BodyRoutine[]>(`/members/${memberId}/routines`), enabled, staleTime: 30_000 });
}

export interface SaveMeasurement {
  /** Present to edit; absent to create (a new client id is made once per form so a retry is idempotent). */
  recordId?: string;
  clientId?: string;
  input: BodyMeasurementInput;
}

export function useMeasurementMutations(memberId: string): {
  save: UseMutationResult<BodyMeasurement, Error, SaveMeasurement>;
  remove: UseMutationResult<void, Error, string>;
} {
  const queryClient = useQueryClient();
  const refresh = (): Promise<void> => queryClient.invalidateQueries({ queryKey: key(memberId, 'measurements') });
  return {
    save: useMutation({
      mutationFn: ({ recordId, clientId, input }: SaveMeasurement) =>
        recordId ? api.putJson<BodyMeasurement>(`/members/${memberId}/measurements/${recordId}`, input) : api.post<BodyMeasurement>(`/members/${memberId}/measurements`, { id: clientId, ...input }),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (recordId: string) => api.delete<void>(`/members/${memberId}/measurements/${recordId}`), onSuccess: refresh }),
  };
}

export interface SaveRoutine {
  recordId?: string;
  clientId?: string;
  input: BodyRoutineInput;
}

export function useRoutineMutations(memberId: string): {
  save: UseMutationResult<BodyRoutine, Error, SaveRoutine>;
  remove: UseMutationResult<void, Error, string>;
} {
  const queryClient = useQueryClient();
  const refresh = (): Promise<void> => queryClient.invalidateQueries({ queryKey: key(memberId, 'routines') });
  return {
    save: useMutation({
      mutationFn: ({ recordId, clientId, input }: SaveRoutine) =>
        recordId ? api.putJson<BodyRoutine>(`/members/${memberId}/routines/${recordId}`, input) : api.post<BodyRoutine>(`/members/${memberId}/routines`, { id: clientId, ...input }),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (recordId: string) => api.delete<void>(`/members/${memberId}/routines/${recordId}`), onSuccess: refresh }),
  };
}
