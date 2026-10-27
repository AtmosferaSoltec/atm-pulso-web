export interface GymDraft {
  id: string;
  name: string;
  taxId: string;
  branches: { id: string; name: string; address: string }[];
}

export interface ClientDraft {
  /** Sent as the client's id, so repeating the request never creates it twice. */
  id: string;
  contactDni: string;
  firstName: string;
  lastName: string;
  contactEmail: string;
  contactPhone: string;
  gyms: GymDraft[];
}
