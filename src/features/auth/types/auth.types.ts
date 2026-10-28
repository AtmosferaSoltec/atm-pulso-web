import type { Role } from '@/types/api.types';

/**
 * superadmin    Atmósfera staff: creates owners, can only inspect accounts.
 * owner         Account holder: sees and manages every gym and branch of the account.
 * admin         Manages the gyms the owner assigned (one or several): its branches, team and identity.
 * receptionist  Works the branches assigned to them.
 */
export type UserRole = Role;
