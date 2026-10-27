/**
 * superadmin    Atmósfera staff: creates owners, can only inspect accounts.
 * owner         Account holder: sees and manages every gym and branch of the account.
 * admin         Manages one gym (`gymId`): its branches, team and identity.
 * receptionist  Works the branches listed in `branchIds`.
 */
export type UserRole = 'superadmin' | 'owner' | 'admin' | 'receptionist';
export interface DemoUser {
  id: string;
  name: string;
  dni: string;
  organizationId: string;
  role: UserRole;
  /** Gym an `admin` manages. Unused by the other roles. */
  gymId?: string;
  /** Branches a `receptionist` works in. Unused by the other roles. */
  branchIds: string[];
  active?: boolean;
  /** Optional contact number the user can keep up to date from their profile. */
  phone?: string;
  /** MOCKUP ONLY: set when the user changes it; otherwise the shared demo password applies. A real backend never keeps this in the client. */
  password?: string;
}
