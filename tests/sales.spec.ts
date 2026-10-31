import { test, expect, type Page, type Route } from '@playwright/test';
import { BRANCH_ID, mockBackends } from './support/mocks';
import { navigate, signIn } from './support/ui';

const API = 'http://api.test';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = (route: Route, status: number, body: unknown): Promise<void> =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

const lima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
const day = (offset: number): string => lima.format(new Date(Date.now() + offset * 86_400_000));

const MEMBER_ID = '00000000-0000-4000-8000-0000000000a1';
const batido = { id: 'p1', name: 'Batido', price: '8.50', is_active: true, position: 0 };
const agua = { id: 'p2', name: 'Agua', price: '2.00', is_active: true, position: 1 };
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
const periodCurrent = {
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
const periodEnded = {
  ...periodCurrent,
  id: 'ms-ended',
  starts_on: day(-70),
  ends_on: day(-40),
  receipt: { id: 'rc-1', number: 'R-000001' },
};
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

interface Mock {
  sales: Record<string, unknown>[];
  collections: Record<string, unknown>[];
  products: Record<string, unknown>[];
  amendments: Record<string, unknown>[];
  /** Overrides what PATCH of a period answers. */
  amendError?: { status: number; code: string };
}

async function mockProducts(page: Page, options: { owed?: boolean } = {}): Promise<Mock> {
  const state: Mock = { sales: [], collections: [], products: [], amendments: [] };
  const pendingSale = {
    id: 'sale-1',
    branch: { id: BRANCH_ID, name: 'Sede Central' },
    status: 'pending',
    was_pending: true,
    method: null,
    total: '12.50',
    units: 2,
    sold_at: new Date().toISOString(),
    sold_on: day(-1),
    sold_by: { id: 'u1', full_name: 'Ana Admin' },
    member: { id: MEMBER_ID, full_name: 'Ana Quispe', document_number: '45678912' },
    collection_id: null,
    collected_at: null,
    items: [{ product_id: 'p1', name: 'Batido', quantity: 1, unit_price: '8.50', line_total: '8.50' }, { product_id: 'p2', name: 'Agua', quantity: 2, unit_price: '2.00', line_total: '4.00' }],
  };
  let owing = options.owed ?? true;
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = request.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (path === '/products' && method === 'GET') return json(route, 200, { data: [batido, agua, ...state.products] });
    if (path === '/products' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.products.push({ ...body, position: 2, is_active: body.is_active ?? true });
      return json(route, 201, { data: { ...body, position: 2 } });
    }
    if (path === '/sales' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.sales.push(body);
      return json(route, 201, { data: { ...pendingSale, id: body.id, status: body.status } });
    }
    if (path === '/sales/pending') {
      return json(route, 200, { data: owing ? [{ member: pendingSale.member, balance: '12.50', pending_count: 1, oldest_sold_on: day(-1) }] : [] });
    }
    if (path === '/sales/report') {
      return json(route, 200, {
        data: {
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
          group_by: url.searchParams.get('group_by') ?? 'day',
          branch_id: null,
          totals: { sales_count: 4, units: 9, total_sold: '63.00', collected_total: '50.50', pending_total: '12.50' },
          by_product: [{ product_id: 'p1', name: 'Batido', units: 6, total: '51.00' }, { product_id: 'p2', name: 'Agua', units: 3, total: '6.00' }],
          by_period: [{ period: day(0), sales_count: 4, units: 9, total: '63.00' }],
        },
      });
    }
    if (path === '/sales/collections' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.collections.push(body);
      owing = false;
      return json(route, 201, { data: { id: body.id, member: pendingSale.member, branch: pendingSale.branch, method: body.method, amount: '12.50', collected_at: new Date().toISOString(), collectd_by: pendingSale.sold_by, sale_ids: body.sale_ids, remaining_balance: '0.00' } });
    }
    if (path === `/members/${MEMBER_ID}/sales`) {
      return json(route, 200, { data: [pendingSale, { ...pendingSale, id: 'sale-0', status: 'paid', method: 'cash', total: '2.00', items: [pendingSale.items[1]] }], meta: { page: 1, page_size: 10, total: 2 } });
    }
    if (path === `/members/${MEMBER_ID}/pending-sales`) {
      return json(route, 200, { data: { member_id: MEMBER_ID, balance: owing ? '12.50' : '0.00', pending_count: owing ? 1 : 0, sales: owing ? [pendingSale] : [] } });
    }
    if (path === '/members' && method === 'GET') {
      const q = url.searchParams.get('q') ?? '';
      const matches = q === '' || 'ana quispe 45678912'.includes(q.toLowerCase());
      return json(route, 200, { data: matches ? [memberView] : [], meta: { page: 1, page_size: 25, total: matches ? 1 : 0, counts: { all: 1, active: 1, expiring: 0, expired: 0, scheduled: 0 } } });
    }
    if (path === `/members/${MEMBER_ID}` && method === 'GET') return json(route, 200, { data: { ...memberView, memberships: [periodCurrent, periodEnded] } });
    if (path === '/receipts/rc-2' || path === '/receipts/rc-1') return json(route, 200, { data: receipt });
    if (path === `/members/${MEMBER_ID}/memberships/ms-current` && method === 'PATCH') {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.amendments.push(body);
      if (options && state.amendError) return json(route, state.amendError.status, { error: { code: state.amendError.code, message: 'x' } });
      return json(route, 200, { data: { member: memberView, membership: { ...periodCurrent, amended_at: new Date().toISOString() }, receipt: periodCurrent.receipt } });
    }
    return route.fallback();
  });
  return state;
}

/** The big product button (the cart has its own buttons that mention the same name). */
const product = (page: Page, name: string) => page.locator('.qs-product', { hasText: name });

async function signedIn(page: Page, features: string[] | undefined = ['sales']): Promise<void> {
  await mockBackends(page, { features, plans: [{ id: 'plan-baile', name: 'Baile', prices: [{ months: 1, amount: '90.00' }] }] });
}

test('without the sales module the sales screens do not exist', async ({ page }) => {
  await signedIn(page, []);
  await mockProducts(page);
  await signIn(page, '74455518', 'Clave12345');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.waitFor();
  await expect(nav.getByRole('button', { name: 'Vender', exact: true })).toHaveCount(0);
  await expect(nav.getByRole('button', { name: 'Ventas', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();
  await expect(nav.getByRole('button', { name: 'Productos', exact: true })).toHaveCount(0);
  await page.goto('/#sell');
  await expect(page.getByRole('heading', { name: 'Venta rápida' })).toHaveCount(0);
});

test('quick sale: tap products, adjust, search a member and collect', async ({ page }) => {
  await signedIn(page);
  const mock = await mockProducts(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Vender');
  await expect(page.getByRole('heading', { name: 'Venta rápida' })).toBeVisible();

  const cobrar = page.getByRole('button', { name: /^Cobrar/ });
  await expect(cobrar).toBeDisabled();
  await product(page, 'Batido').click();
  await product(page, 'Batido').click();
  await product(page, 'Agua').click();
  await expect(cobrar).toContainText('S/ 19.00');
  await page.getByRole('button', { name: 'Agregar uno de Agua' }).click();
  await expect(cobrar).toContainText('S/ 21.00');
  await page.getByRole('button', { name: 'Quitar uno de Agua' }).click();
  await page.getByRole('button', { name: 'Quitar uno de Agua' }).click();
  await expect(cobrar).toContainText('S/ 17.00');

  // A pending sale needs a member.
  const pendingButton = page.getByRole('button', { name: /^Dejar pendiente/ });
  await expect(pendingButton).toBeDisabled();
  await page.getByLabel('Miembro (opcional)').fill('ana');
  await page.getByRole('button', { name: /Ana Quispe/ }).click();
  await expect(page.getByText('pendiente de cobro S/ 12.50')).toBeVisible();
  await expect(pendingButton).toBeEnabled();

  await page.getByRole('radio', { name: 'Yape/Plin' }).click();
  await cobrar.click();
  await expect(page.getByText('Venta cobrada: S/ 17.00.')).toBeVisible();
  expect(mock.sales).toHaveLength(1);
  expect(mock.sales[0]).toMatchObject({
    status: 'paid',
    method: 'yape_plin',
    member_id: MEMBER_ID,
    branch_id: BRANCH_ID,
    items: [{ product_id: 'p1', quantity: 2 }],
  });
  expect(typeof mock.sales[0].id).toBe('string');
  expect(JSON.stringify(mock.sales[0])).not.toContain('price');
  // The cart is clean for the next customer.
  await expect(cobrar).toBeDisabled();
});

test('quick sale: charging to a member registers a pending sale', async ({ page }) => {
  await signedIn(page);
  const mock = await mockProducts(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Vender');
  await product(page, 'Agua').click();
  await page.getByLabel('Miembro (opcional)').fill('45678912');
  await page.getByRole('button', { name: /Ana Quispe/ }).click();
  await page.getByRole('button', { name: /^Dejar pendiente/ }).click();
  await expect(page.getByText('Venta pendiente de S/ 2.00 anotada a Ana Quispe.')).toBeVisible();
  expect(mock.sales[0]).toMatchObject({ status: 'pending', member_id: MEMBER_ID, items: [{ product_id: 'p2', quantity: 1 }] });
  expect(mock.sales[0]).not.toHaveProperty('method');
});

test('sales: the report totals and the pending sales of each member, with Cobrar', async ({ page }) => {
  await signedIn(page);
  const mock = await mockProducts(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Ventas');
  await expect(page.getByRole('heading', { name: 'Ventas', exact: true })).toBeVisible();
  const totals = page.getByLabel('Totales de ventas');
  await expect(totals).toContainText('S/ 63.00');
  await expect(totals).toContainText('S/ 12.50');
  await expect(page.getByRole('table', { name: 'Ventas por producto' })).toContainText('Batido');
  await expect(page.getByRole('table', { name: 'Ventas por producto' })).toContainText('51.00');

  const pendingTable = page.getByRole('table', { name: 'Pendientes por miembro' });
  await expect(pendingTable).toContainText('Ana Quispe');
  await pendingTable.getByRole('button', { name: 'Cobrar' }).click();
  await expect(page.getByRole('heading', { name: 'Cobrar a Ana Quispe' })).toBeVisible();
  await page.getByRole('radio', { name: 'Efectivo' }).click();
  await page.getByRole('button', { name: /^Cobrar S\/ 12\.50/ }).click();
  await expect(page.getByText('Ana Quispe pagó S/ 12.50.')).toBeVisible();
  expect(mock.collections[0]).toMatchObject({ member_id: MEMBER_ID, branch_id: BRANCH_ID, method: 'cash', sale_ids: ['sale-1'] });
  await expect(page.getByText('No hay ventas pendientes de cobro.')).toBeVisible();
});

test('reception sees the pending sales and sells, but has no report and no catalog', async ({ page }) => {
  await signedIn(page);
  await mockProducts(page);
  // The session of the mocks is an admin: answer /me as a receptionist of the branch.
  await page.route(`${API}/**`, async (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/me')) {
      return json(route, 200, {
        data: {
          id: '00000000-0000-4000-8000-000000000009',
          document_number: '74455518',
          full_name: 'Rosa Recepción',
          phone: null,
          role: 'receptionist',
          gym: { id: '00000000-0000-4000-8000-000000000001', name: 'Atlas Fitness', brand_color: '#17677b', logo_url: null, features: ['sales'] },
          branches: [{ id: BRANCH_ID, name: 'Sede Central', gym_id: '00000000-0000-4000-8000-000000000001', gym_name: 'Atlas Fitness' }],
        },
      });
    }
    return route.fallback();
  });
  await signIn(page, '74455518', 'Clave12345');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.waitFor();
  await expect(nav.getByRole('button', { name: 'Vender', exact: true })).toBeVisible();
  await nav.getByRole('button', { name: 'Ventas', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Pendientes por miembro' })).toBeVisible();
  await expect(page.getByLabel('Totales de ventas')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ventas de productos' })).toHaveCount(0);
  // Configuration (with the catalog) is for the admin: reception has no such entry at all.
  await expect(nav.getByRole('button', { name: 'Configuración', exact: true })).toHaveCount(0);
  await expect(nav.getByRole('button', { name: 'Productos', exact: true })).toHaveCount(0);
});

test('products: the admin adds a product to the catalog', async ({ page }) => {
  await signedIn(page);
  const mock = await mockProducts(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Productos');
  await expect(page.getByRole('heading', { name: 'Productos a la venta' })).toBeVisible();
  await expect(page.getByText('Batido', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo producto' }).click();
  await page.getByLabel('Nombre').fill('Gaseosa');
  await page.getByLabel('Precio (S/)').fill('3.5');
  await page.getByRole('button', { name: 'Guardar' }).click();
  expect(mock.products[0]).toMatchObject({ name: 'Gaseosa', price: '3.50', is_active: true });
});

test('the member file shows what is pending, the purchases, lists the periods and corrects one', async ({ page }) => {
  await signedIn(page);
  const mock = await mockProducts(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Ver ficha de Ana Quispe' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Pendiente de cobro: S/ 12.50' })).toBeVisible();
  await expect(page.getByLabel('Ventas pendientes')).toContainText('1 Batido, 2 Agua');
  await page.getByText('Compras del miembro (2)').click();
  await expect(page.getByLabel('Historial de compras')).toContainText('Cobrada');
  const periods = page.getByLabel('Membresías del miembro');
  await expect(periods.getByText('Vigente')).toBeVisible();
  await expect(periods.getByText('Terminó')).toBeVisible();
  // An ended period cannot be edited; the current one can.
  await expect(periods.getByRole('button', { name: 'Modificar Baile' })).toHaveCount(1);
  await periods.getByRole('button', { name: 'Modificar Baile' }).click();
  await expect(page.getByRole('heading', { name: 'Modificar membresía' })).toBeVisible();
  await page.getByLabel('Duración (meses)').fill('3');
  await page.getByLabel('Importe (S/)').fill('250');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Membresía corregida. La boleta muestra los nuevos datos.')).toBeVisible();
  expect(mock.amendments[0]).toMatchObject({ months: 3, amount: '250.00', method: 'yape_plin' });
  expect(mock.amendments[0]).not.toHaveProperty('ends_on');
});

test('correcting a period into another of the same plan shows the overlap message', async ({ page }) => {
  await signedIn(page);
  const mock = await mockProducts(page);
  mock.amendError = { status: 409, code: 'MEMBERSHIP_OVERLAP' };
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Ver ficha de Ana Quispe' }).click();
  await page.getByLabel('Membresías del miembro').getByRole('button', { name: 'Modificar Baile' }).click();
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('alert')).toContainText('Ya tiene este plan en esas fechas');
});

test('renewing a plan that is current starts where it ends', async ({ page }) => {
  await signedIn(page);
  await mockProducts(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Ver ficha de Ana Quispe' }).click();
  await page.getByLabel('Membresías del miembro').getByRole('button', { name: 'Renovar Baile' }).first().click();
  await expect(page.getByRole('heading', { name: 'Renovar membresía' })).toBeVisible();
  await expect(page.getByText('cuando termina el periodo actual')).toBeVisible();
});
