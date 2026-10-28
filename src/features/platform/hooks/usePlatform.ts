import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api, requestPage } from '@/config/apiClient';
import type { ClientSummary, Pagination, PlatformClient, CatalogBranch } from '@/types/api.types';
import type { ClientDraft, GymDraft } from '@/features/platform/types/platform.types';

const clientsKey = ['clients'] as const;

interface ClientsPage {
  data: PlatformClient[];
  meta: Pagination;
}

/** Clients of the platform, filtered by name, gym or RUC. */
export function useClients(search: string, page: number, pageSize: number): UseQueryResult<ClientsPage> {
  return useQuery({
    queryKey: [...clientsKey, 'list', search, page, pageSize],
    queryFn: () => requestPage<PlatformClient, Pagination>('/clients', { query: { search, page, page_size: pageSize } }),
    placeholderData: keepPreviousData,
  });
}

export function useClientSummary(): UseQueryResult<ClientSummary> {
  return useQuery({ queryKey: [...clientsKey, 'summary'], queryFn: () => api.get<ClientSummary>('/clients/summary') });
}

function gymBody(gym: GymDraft): { id: string; name: string; tax_id?: string; branches: { id: string; name: string; address?: string }[] } {
  return {
    id: gym.id,
    name: gym.name.trim(),
    ...(gym.taxId.trim() ? { tax_id: gym.taxId.trim() } : {}),
    branches: gym.branches.map((branch) => ({ id: branch.id, name: branch.name.trim(), ...(branch.address.trim() ? { address: branch.address.trim() } : {}) })),
  };
}

export interface CreateClientInput {
  draft: ClientDraft;
}

export function useCreateClient(): UseMutationResult<PlatformClient, Error, CreateClientInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ draft }: CreateClientInput) =>
      api.post<PlatformClient>('/clients', {
        id: draft.id,
        owner: {
          document_number: draft.contactDni.trim(),
          first_names: draft.firstName.trim(),
          last_names: draft.lastName.trim(),
          email: draft.contactEmail.trim().toLowerCase(),
          phone: draft.contactPhone.trim(),
        },
        gyms: draft.gyms.map(gymBody),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientsKey }),
  });
}

export function useAddGym(clientId: string): UseMutationResult<unknown, Error, { gym: GymDraft }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gym }) => api.post(`/clients/${clientId}/gyms`, gymBody(gym)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientsKey }),
  });
}

export function useAddBranch(gymId: string): UseMutationResult<CatalogBranch, Error, { name: string; address: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, address }) =>
      api.post<CatalogBranch>(`/gyms/${gymId}/branches`, { name: name.trim(), ...(address.trim() ? { address: address.trim() } : {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientsKey }),
  });
}
