import type { components } from '@/types/api.generated';

/**
 * Shapes of the Pulso API. They come from `../atm-pulso-api/docs/openapi.yaml`
 * (run `pnpm api:types` after it changes); a few are written by hand because the contract
 * does not mark their fields as required.
 */
type Schemas = components['schemas'];

export type Role = 'superadmin' | 'owner' | 'admin' | 'receptionist';
export type PaymentMethod = 'yape_plin' | 'cash' | 'card' | 'transfer';
export type MemberStatus = 'active' | 'expiring' | 'expired' | 'scheduled';
export type AccessScope = 'branch' | 'gym' | 'network';
export type DocumentType = 'dni' | 'ce';

export interface Named {
  id: string;
  name: string;
}

export interface SessionBranch {
  id: string;
  name: string;
  gym_id: string;
  gym_name: string;
}

/** The signed-in user, as `GET /me` and the login answer it. */
export interface SessionUser {
  id: string;
  document_number: string;
  full_name: string;
  phone: string | null;
  role: Role;
  organization: Named | null;
  gym: Named | null;
  branches: SessionBranch[];
  must_change_password: boolean;
}

export interface Session {
  access_token: string;
  expires_in: number;
  user: SessionUser;
}

export type Catalog = Schemas['Catalog'];
export type CatalogGym = Schemas['Gym'];
export type CatalogMembershipPrice = Schemas['MembershipPrice'];
export type CatalogBranch = CatalogGym['branches'][number];
export type PlatformClient = Schemas['Client'];
export type ClientSummary = Schemas['ClientSummary'];
export type TeamUser = Schemas['TeamUser'];
export type MemberView = Schemas['MemberView'];
export type MemberCounts = Schemas['MemberCounts'];
export type MemberDetail = Schemas['MemberDetail'];
export type MembershipView = Schemas['MembershipView'];
export type Sale = Schemas['Sale'];
export type ReceiptSummary = Schemas['ReceiptSummary'];
export type ReceiptDetail = Schemas['ReceiptDetail'];
export type AccessCheck = Schemas['AccessCheck'];
export type AccessEvent = Schemas['AccessEvent'];
export type DayPass = Schemas['DayPass'];
export type PaymentRow = Schemas['PaymentRow'];
export type PaymentTotals = Schemas['PaymentTotals'];
export type Dashboard = Schemas['Dashboard'];

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

export interface Page<T, Meta = Pagination> {
  data: T[];
  meta: Meta;
}
