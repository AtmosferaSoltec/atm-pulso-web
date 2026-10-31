import type { components } from '@/types/api.generated';

/**
 * Shapes of the Pulso API. They come from `../atm-pulso-api/docs/openapi.yaml`
 * (run `pnpm api:types` after it changes); a few are written by hand because the contract
 * does not mark their fields as required.
 */
type Schemas = components['schemas'];

export type Role = 'admin' | 'receptionist';
export type PaymentMethod = 'yape_plin' | 'cash' | 'card' | 'transfer';
export type MemberStatus = 'active' | 'expiring' | 'expired' | 'scheduled';
export type AccessScope = 'branch' | 'gym';
export type DocumentType = 'dni' | 'ce';

export interface Named {
  id: string;
  name: string;
}

/** An optional module of a gym, switched on by Atmósfera from the console. */
export type GymFeature = Schemas['Features'][number];

export interface SessionGym extends Named {
  brand_color: string;
  logo_url: string | null;
  features: GymFeature[];
}

export interface SessionBranch {
  id: string;
  name: string;
  gym_id: string;
  gym_name: string;
}

/** The signed-in user, as `GET /me` answers it. */
export interface SessionUser {
  id: string;
  document_number: string;
  full_name: string;
  phone: string | null;
  role: Role;
  /** The gym (auth company) the session works in. */
  gym: SessionGym;
  /** The branches a receptionist works in; empty for an admin. */
  branches: SessionBranch[];
}

export type Catalog = Schemas['Catalog'];
export type CatalogGym = Schemas['Gym'];
export type CatalogMembershipPrice = Schemas['MembershipPrice'];
export type MembershipPlan = Schemas['MembershipPlan'];
export type CatalogBranch = CatalogGym['branches'][number];
export interface TeamUser {
  id: string;
  full_name: string;
  document_number: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  is_self: boolean;
  branches: { id: string; name: string; gym_id: string }[];
}
export type MemberView = Schemas['MemberView'];
export type MemberCounts = Schemas['MemberCounts'];
export type MemberDetail = Schemas['MemberDetail'];
export type MembershipView = Schemas['MembershipView'];
export type Sale = Schemas['Sale'];
export type Voucher = Schemas['Voucher'];
export type ReceiptSummary = Schemas['ReceiptSummary'];
export type ReceiptDetail = Schemas['ReceiptDetail'];
export type AccessCheck = Schemas['AccessCheck'];
export type AccessEvent = Schemas['AccessEvent'];
export type DayPass = Schemas['DayPass'];
export type PaymentRow = Schemas['PaymentRow'];
export type PaymentTotals = Schemas['PaymentTotals'];
export type Dashboard = Schemas['Dashboard'];
export type MembershipAmendment = Schemas['MembershipAmendment'];
export type Product = Schemas['Product'];
export type ProductSale = Schemas['ProductSale'];
export type PendingBalance = Schemas['PendingBalance'];
export type MemberPending = Schemas['MemberPending'];
export type Collection = Schemas['Collection'];
export type ProductsReport = Schemas['ProductsReport'];

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

export interface Page<T, Meta = Pagination> {
  data: T[];
  meta: Meta;
}

/** Body tracking (module `body_tracking`): sensitive health data. */
export type BodyMeasurement = Schemas['BodyMeasurement'];
export type BodyMeasurementInput = Schemas['BodyMeasurementInput'];
export type BodyRoutine = Schemas['BodyRoutine'];
export type BodyRoutineInput = Schemas['BodyRoutineInput'];
