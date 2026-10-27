/**
 * Creates the data each e2e test needs through the real API, as production does: no seed, no
 * shortcuts. The only manual step is the first superadmin (see tests/README.md).
 */
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:3091/api/v1';

export const PASSWORD = 'ClaveE2E2026!';

interface ApiAnswer<T> {
  data: T;
}

async function call<T>(method: string, path: string, token: string | null, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${text}`);
  return (JSON.parse(text) as ApiAnswer<T>).data;
}

let counter = Math.floor(Math.random() * 1_000_000);

/** A fresh 8-digit document number, unique across runs. */
export function uniqueDni(): string {
  counter += 1;
  return String(70_000_000 + ((counter + Date.now()) % 29_999_999));
}

export async function login(dni: string, password: string): Promise<string> {
  return (await call<{ access_token: string }>('POST', '/auth/login', null, { document_number: dni, password })).access_token;
}

/** First sign-in of a user created with the DNI as temporary password: sets a real one. */
export async function firstLogin(dni: string, password = PASSWORD): Promise<string> {
  const temporary = await login(dni, dni);
  await call('POST', '/me/password', temporary, { current_password: dni, new_password: password });
  return login(dni, password);
}

export async function superadminToken(): Promise<string> {
  const dni = process.env.E2E_SUPERADMIN_DNI;
  const password = process.env.E2E_SUPERADMIN_PASSWORD;
  if (!dni || !password) throw new Error('Set E2E_SUPERADMIN_DNI and E2E_SUPERADMIN_PASSWORD (see tests/README.md)');
  return login(dni, password);
}

export interface Branch {
  id: string;
  name: string;
}

export interface Account {
  organizationId: string;
  ownerDni: string;
  ownerName: string;
  ownerToken: string;
  gymName: string;
  branches: Branch[];
}

interface ClientAnswer {
  id: string;
  gyms: { name: string; branches: Branch[] }[];
}

/** A client with one gym and the given branches (extras are agreed, since the free plan has one branch). */
export async function createAccount(branchNames: string[] = ['Sede Central'], activateOwner = true): Promise<Account> {
  const token = await superadminToken();
  const ownerDni = uniqueDni();
  const gymName = `Gym ${ownerDni}`;
  const client = await call<ClientAnswer>('POST', '/clients', token, {
    id: crypto.randomUUID(),
    agreed_extra: true,
    owner: { document_number: ownerDni, first_names: 'Olga', last_names: `Dueña ${ownerDni}`, email: 'owner@example.com', phone: '999111222' },
    gyms: [{ name: gymName, tax_id: '20123456789', branches: branchNames.map((name) => ({ name, address: `Av. ${name} 100` })) }],
  });
  return {
    organizationId: client.id,
    ownerDni,
    ownerName: `Olga Dueña ${ownerDni}`,
    ownerToken: activateOwner ? await firstLogin(ownerDni) : '',
    gymName,
    branches: client.gyms[0].branches,
  };
}

export interface Staff {
  dni: string;
  name: string;
  token: string;
}

/** A receptionist (assigned to the branches) or admin of the account, already past the first-login password change. */
export async function createStaff(account: Account, role: 'receptionist' | 'admin', branchIds: string[] = [], gymId?: string): Promise<Staff> {
  const dni = uniqueDni();
  const name = role === 'admin' ? `Ana Admin ${dni}` : `Rosa Recepción ${dni}`;
  await call('POST', '/users', account.ownerToken, {
    id: crypto.randomUUID(),
    full_name: name,
    document_number: dni,
    role,
    ...(role === 'admin' ? { gym_id: gymId } : { branch_ids: branchIds }),
  });
  return { dni, name, token: await firstLogin(dni) };
}

export async function gymId(account: Account): Promise<string> {
  const catalog = await call<{ gyms: { id: string }[] }>('GET', '/catalog', account.ownerToken);
  return catalog.gyms[0].id;
}

export interface EnrollOptions {
  name?: string;
  months?: number;
  startsOn?: string;
  amount?: string;
  method?: string;
}

/** Enrolls a member through the API; returns the document and name used. */
export async function enrollMember(token: string, branchId: string, options: EnrollOptions = {}): Promise<{ dni: string; name: string; receipt: string }> {
  const dni = uniqueDni();
  const name = options.name ?? `Miembro ${dni}`;
  const sale = await call<{ receipt: { number: string } }>('POST', '/members', token, {
    id: crypto.randomUUID(),
    branch_id: branchId,
    document_type: 'dni',
    document_number: dni,
    full_name: name,
    phone: '988777666',
    months: options.months ?? 1,
    ...(options.startsOn ? { starts_on: options.startsOn } : {}),
    amount: options.amount ?? '100.00',
    method: options.method ?? 'cash',
  });
  return { dni, name, receipt: sale.receipt.number };
}

/** Sets the gym's base price per membership length, as its administrator does in Tarifas. */
export async function setMembershipPrices(account: Account, prices: { months: number; amount: string }[]): Promise<void> {
  await call('PATCH', `/gyms/${await gymId(account)}`, account.ownerToken, { membership_prices: prices });
}

export async function catalogOf(token: string): Promise<{
  gyms: { id: string; day_pass_price: string; brand_color: string; display_name: string | null; branch_sharing: boolean; membership_prices: { months: number; amount: string }[] }[];
}> {
  return call('GET', '/catalog', token);
}

export function isoDaysFromToday(days: number): string {
  const lima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  const date = new Date(`${lima}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
