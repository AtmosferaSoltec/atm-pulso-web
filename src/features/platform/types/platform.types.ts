export interface GymDraft { id: string; name: string; taxId: string; branches: { id: string; name: string; address: string }[]; }
export interface ClientDraft { name: string; accountType: 'business' | 'individual'; contactName: string; contactEmail: string; gyms: GymDraft[]; }
