export interface GymDraft { id: string; name: string; taxId: string; branches: { id: string; name: string; address: string }[]; }
export interface ClientDraft { contactDni: string; firstName: string; lastName: string; contactEmail: string; contactPhone: string; gyms: GymDraft[]; }
