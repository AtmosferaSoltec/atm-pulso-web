import { test, expect, type Page, type Route } from '@playwright/test';
import { BRANCH_ID, mockBackends } from './support/mocks';
import { navigate, signIn } from './support/ui';

const API = 'http://api.test';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = (route: Route, status: number, body: unknown): Promise<void> =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

const lima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
const day = (offset: number): string => lima.format(new Date(Date.now() + offset * 86_400_000));

const MEMBER_ID = '00000000-0000-4000-8000-0000000000c1';
const memberView = {
  id: MEMBER_ID,
  document_type: 'dni',
  document_number: '45678912',
  full_name: 'Ana Quispe',
  phone: '999111222',
  home_branch: { id: BRANCH_ID, name: 'Sede Central', gym_name: 'Atlas Fitness' },
  status: 'active',
  days_remaining: 20,
  plan_label: '1 mes',
  plan_names: ['Baile'],
  starts_on: day(-10),
  ends_on: day(20),
  last_receipt: 'R-000002',
};
const period = {
  id: 'ms-current',
  plan_id: 'plan-baile',
  plan_name: 'Baile',
  months: 1,
  plan_label: '1 mes',
  starts_on: day(-10),
  ends_on: day(20),
  amount: '90.00',
  access_scope: 'branch',
  access_branches: [],
  receipt: { id: 'rc-2', number: 'R-000002' },
  amended_at: null,
};
const ended = { ...period, id: 'ms-ended', starts_on: day(-70), ends_on: day(-40), receipt: { id: 'rc-1', number: 'R-000001' } };
const receipt = {
  id: 'rc-2',
  number: 'R-000002',
  kind: 'membership',
  issued_on: day(-10),
  gym: { name: 'Atlas Fitness', tax_id: null, brand_color: '#17677b', logo_url: null },
  branch: { name: 'Sede Central', address: null },
  member: { full_name: 'Ana Quispe', document_type: 'dni', document_number: '45678912', phone: '999111222' },
  membership: { plan_name: 'Baile', months: 1, plan_label: '1 mes', starts_on: day(-10), ends_on: day(20), access_branches: [] },
  payment: { amount: '90.00', method: 'yape_plin' },
};

/** Records every request that reaches pulso-api, "METHOD path". */
async function mockMember(page: Page): Promise<string[]> {
  const calls: string[] = [];
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.push(`${request.method()} ${path}`);
    if (path === '/members') {
      return json(route, 200, { data: [memberView], meta: { page: 1, page_size: 25, total: 1, counts: { all: 1, active: 1, expiring: 0, expired: 0, scheduled: 0 } } });
    }
    if (path === `/members/${MEMBER_ID}`) return json(route, 200, { data: { ...memberView, memberships: [period, ended] } });
    if (path.startsWith('/members/') && path.split('/').length === 3) return json(route, 404, { error: { code: 'NOT_FOUND', message: 'x' } });
    if (path === '/receipts/rc-2') return json(route, 200, { data: receipt });
    if (path.endsWith('/measurements') || path.endsWith('/routines')) return json(route, 200, { data: [] });
    return route.fallback();
  });
  return calls;
}

async function openFromList(page: Page): Promise<void> {
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Ver ficha de Ana Quispe' }).click();
}

test('a member opens in its own page with the memberships visible and the receipts folded', async ({ page }) => {
  await mockBackends(page, { features: ['body_tracking'] });
  const calls = await mockMember(page);
  await openFromList(page);
  await expect(page).toHaveURL(new RegExp(`#members/${MEMBER_ID}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Ana Quispe' })).toBeVisible();
  await expect(page.getByText('DNI 45678912', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Renovar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar', exact: true })).toBeVisible();
  await expect(page.getByLabel('Membresías del miembro')).toContainText('Baile');

  await expect(page.getByRole('button', { name: /^Membresías/ })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: /^Boletas/ })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Medidas y rutinas' })).toHaveAttribute('aria-expanded', 'false');
  // The tab keeps Pulso's identity, not the gym's.
  await expect(page).toHaveTitle('Pulso · Miembros');
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute('href', '/favicon.svg');

  // Nothing about receipts or health was requested yet.
  await page.waitForTimeout(300);
  expect(calls.filter((call) => /receipts|measurements|routines/.test(call))).toEqual([]);
});

test('receipts are one row each; only the opened one loads, with a download button', async ({ page }) => {
  await mockBackends(page);
  const calls = await mockMember(page);
  await openFromList(page);
  await page.getByRole('button', { name: /^Boletas/ }).click();
  const rows = page.getByLabel('Boletas del miembro').getByRole('listitem');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('R-000002');
  await expect(rows.first()).toContainText('S/ 90.00');
  await expect(page.getByText('BOLETA DE MEMBRESÍA')).toHaveCount(0);
  expect(calls.filter((call) => call.includes('/receipts/'))).toEqual([]);

  await page.getByRole('button', { name: 'Ver boleta R-000002' }).click();
  await expect(page.getByText('BOLETA DE MEMBRESÍA')).toBeVisible();
  await expect(page.getByText('N.º R-000002')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Descargar boleta' })).toBeEnabled();
  expect(calls.filter((call) => call.includes('/receipts/'))).toEqual(['GET /receipts/rc-2']);
});

test('body tracking is not requested until the section is expanded', async ({ page }) => {
  await mockBackends(page, { features: ['body_tracking'] });
  const calls = await mockMember(page);
  await openFromList(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Ana Quispe' })).toBeVisible();
  await page.waitForTimeout(400);
  expect(calls.some((call) => call.includes('/measurements'))).toBe(false);
  await page.getByRole('button', { name: 'Medidas y rutinas' }).click();
  await expect(page.getByText('Aún no hay mediciones')).toBeVisible();
  expect(calls.filter((call) => call.includes('/measurements'))).toEqual([`GET /members/${MEMBER_ID}/measurements`]);
});

test('the page survives a reload (deep link) and the browser back returns to the list', async ({ page }) => {
  await mockBackends(page);
  await mockMember(page);
  await openFromList(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Ana Quispe' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Ana Quispe' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Miembros' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Ana Quispe' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a miembros' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Miembros' })).toBeVisible();
});

test('an unknown member shows a friendly state with a way back', async ({ page }) => {
  await mockBackends(page);
  await mockMember(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');
  await page.evaluate(() => {
    window.location.hash = 'members/00000000-0000-4000-8000-00000000ffff';
  });
  await expect(page.getByRole('heading', { name: 'No encontramos a este miembro' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a miembros' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Miembros' })).toBeVisible();
});
