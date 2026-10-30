import type { Page, Route } from '@playwright/test';

const AUTH = 'http://auth.test';
const API = 'http://api.test';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

export const GYM_ID = '00000000-0000-4000-8000-000000000001';
export const BRANCH_ID = '00000000-0000-4000-8000-000000000002';

const json = (route: Route, status: number, body: unknown): Promise<void> =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

const tokens = { access_token: 'access-1', refresh_token: 'refresh-1', expires_in: 600, session_mode: 'persistent' };

const gym = { id: GYM_ID, name: 'Atlas Fitness', brand_color: '#17677b', logo_url: null };
const me = {
  id: '00000000-0000-4000-8000-000000000009',
  document_number: '74455518',
  full_name: 'Ana Admin',
  phone: null,
  role: 'admin',
  organization: { id: '00000000-0000-4000-8000-0000000000aa', name: 'Atlas' },
  gym,
  branches: [],
};
const catalog = {
  organization: me.organization,
  gyms: [
    {
      ...gym,
      display_name: null,
      tax_id: null,
      day_pass_price: '15.00',
      day_pass_price_is_default: true,
      branch_sharing: true,
      membership_prices: [],
      branches: [{ id: BRANCH_ID, name: 'Sede Central', address: null, accessible: true }],
    },
  ],
};

interface MockOptions {
  /** Answer the login with `password_change_required`, as atm-auth-api does for a first sign-in. */
  firstLogin?: boolean;
  /** More than one gym, so the selector shows. */
  gyms?: number;
}

/** Stands in for atm-auth-api and pulso-api. Returns the calls made, so a test can assert on them. */
export async function mockBackends(page: Page, options: MockOptions = {}): Promise<{ calls: string[] }> {
  const calls: string[] = [];
  const count = options.gyms ?? 1;
  let current = 0;
  let passwordChanged = false;

  await page.route(`${AUTH}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    calls.push(`${request.method()} ${path}`);
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (path === '/v1/login') {
      const body = request.postDataJSON() as { password: string };
      if (body.password === 'incorrecta123') return json(route, 401, { error: { code: 'invalid_credentials', message: 'x' } });
      if (options.firstLogin && !passwordChanged) return json(route, 403, { error: { code: 'password_change_required', message: 'x' } });
      return json(route, 200, tokens);
    }
    if (path === '/v1/password/change') {
      passwordChanged = true;
      return route.fulfill({ status: 204, headers: CORS });
    }
    if (path === '/v1/refresh') {
      const body = request.postDataJSON() as { tenant_id?: string };
      if (body.tenant_id) current = Number(body.tenant_id.slice(-1)) - 1;
      return json(route, 200, { ...tokens, refresh_token: 'refresh-2' });
    }
    if (path === '/v1/session/tenants') {
      return json(route, 200, {
        items: Array.from({ length: count }, (_, index) => ({ tenant_id: `t-${index + 1}`, ruc: `2000000000${index}`, name: `Gimnasio ${index + 1}`, role: 'admin', current: index === current })),
      });
    }
    if (path === '/v1/logout') return route.fulfill({ status: 204, headers: CORS });
    return json(route, 404, { error: { code: 'not_found', message: 'x' } });
  });

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');
    calls.push(`${request.method()} ${path}`);
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (path === '/me') return json(route, 200, { data: me });
    if (path === '/catalog') return json(route, 200, { data: catalog });
    if (path === '/dashboard') {
      return json(route, 200, {
        data: {
          date: '2026-10-30',
          members: { active: 0, expiring: 0, expired: 0, scheduled: 0 },
          income: { today: '0.00', month: '0.00' },
          access: { allowed_today: 0, denied_today: 0 },
          expiring_soon: [],
        },
      });
    }
    return json(route, 200, { data: [], meta: { page: 1, page_size: 20, total: 0 } });
  });

  return { calls };
}
