import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// Live checks of the products module and the membership rules against the LOCAL stack (nothing mocked).
// Needs the demo gym "Fuerza Uno" with the `products` module on; admin 10000001, reception 10000002.
const PASSWORD = process.env.LIVE_PASSWORD ?? 'Pulso-Demo-2026';
const AUTH = process.env.LIVE_AUTH ?? 'http://localhost:3130';
const API = process.env.LIVE_API ?? 'http://localhost:3001/api/v1';
const SHOTS = process.env.LIVE_SHOTS ?? 'shots';
const stamp = String(Date.now()).slice(-8);
const DOCUMENT = `8${stamp.slice(1)}`;
const NAME = `Marco Pendiente ${stamp.slice(2)}`;

async function token(request: APIRequestContext, dni: string): Promise<string> {
  const login = await request.post(`${AUTH}/v1/login`, { data: { dni, password: PASSWORD, system: 'pulso' } });
  return ((await login.json()) as { access_token: string }).access_token;
}

async function call<T>(request: APIRequestContext, jwt: string, method: 'get' | 'post' | 'patch', path: string, data?: unknown): Promise<{ status: number; body: { data: T; error?: { code: string } } }> {
  const response = await request[method](`${API}${path}`, { headers: { Authorization: `Bearer ${jwt}` }, data });
  return { status: response.status(), body: (await response.json()) as { data: T; error?: { code: string } } };
}

async function signIn(page: Page, dni: string): Promise<void> {
  await page.goto('/');
  await page.getByLabel('DNI', { exact: true }).fill(dni);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navegación principal' }).waitFor();
}

test('sales, pending sales and the membership rules against the live stack', async ({ page, request }) => {
  const admin = await token(request, '10000001');
  const reception = await token(request, '10000002');
  const catalog = await call<{ gyms: { branches: { id: string }[] }[] }>(request, admin, 'get', '/catalog');
  const branch = catalog.body.data.gyms[0].branches[0].id;

  // 1. The admin builds the catalog from the web (skipping what already exists).
  await signIn(page, '10000001');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Configuración', exact: true }).click();
  await nav.getByRole('button', { name: 'Productos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Productos a la venta' })).toBeVisible();
  const existing = (await call<{ name: string }[]>(request, admin, 'get', '/products?include_inactive=true')).body.data.map((p) => p.name);
  for (const [name, price] of [['Batido', '8.50'], ['Agua', '2.50'], ['Gaseosa', '3.00']]) {
    if (existing.includes(name)) continue;
    await page.getByRole('button', { name: 'Nuevo producto' }).click();
    await page.getByLabel('Nombre').fill(name);
    await page.getByLabel('Precio (S/)').fill(price);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
  await page.screenshot({ path: `${SHOTS}/01-productos.png` });

  // 2. A member with a plan (API), then quick sales from the web: two paid and two pending sales.
  const plans = (await call<{ id: string; name: string; is_active: boolean }[]>(request, admin, 'get', '/membership-plans')).body.data.filter((p) => p.is_active);
  const planId = plans[0].id;
  const enrolled = await call<{ member: { id: string } }>(request, admin, 'post', '/members', {
    branch_id: branch, document_type: 'dni', document_number: DOCUMENT, full_name: NAME, phone: '987654321',
    ...(plans.length > 1 ? { plan_id: planId } : {}), months: 1, amount: '90.00', method: 'cash',
  });
  expect(enrolled.status).toBe(201);
  const memberId = enrolled.body.data.member.id;

  await nav.getByRole('button', { name: 'Vender', exact: true }).click();
  const product = (name: string) => page.locator('.qs-product', { hasText: name });
  await product('Batido').click();
  await product('Batido').click();
  await product('Agua').click();
  await page.screenshot({ path: `${SHOTS}/02-vender-carrito.png` });
  await page.getByRole('button', { name: /^Cobrar/ }).click();
  await expect(page.getByText('Venta cobrada: S/ 19.50.')).toBeVisible();

  await product('Gaseosa').click();
  await page.getByRole('radio', { name: 'Yape/Plin' }).click();
  await page.getByRole('button', { name: /^Cobrar/ }).click();
  await expect(page.getByText('Venta cobrada: S/ 3.00.')).toBeVisible();

  for (const [name, times, amount] of [['Gaseosa', 2, '6.00'], ['Batido', 1, '8.50']] as const) {
    for (let i = 0; i < times; i += 1) await product(name).click();
    await page.getByLabel('Miembro (opcional)').fill(DOCUMENT);
    await page.getByRole('button', { name: new RegExp(NAME) }).click();
    await page.screenshot({ path: `${SHOTS}/03-vender-pendiente-${name}.png` });
    await page.getByRole('button', { name: /^Dejar pendiente/ }).click();
    await expect(page.getByText(new RegExp(`Venta pendiente de S/\\s${amount} anotada a ${NAME}`))).toBeVisible();
  }
  const owed = await call<{ balance: string; pending_count: number }>(request, admin, 'get', `/members/${memberId}/pending-sales`);
  expect(owed.body.data.balance).toBe('14.50');
  expect(owed.body.data.pending_count).toBe(2);

  // 3. Ventas: report + pending; the member file shows the debt; collect ONE sale from the file.
  await nav.getByRole('button', { name: 'Ventas', exact: true }).click();
  await expect(page.getByLabel('Totales de ventas')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Pendientes por miembro' })).toContainText(NAME);
  await page.screenshot({ path: `${SHOTS}/04-ventas.png`, fullPage: true });

  await nav.getByRole('button', { name: 'Miembros', exact: true }).click();
  await page.getByLabel('Buscar miembro por nombre o documento').fill(DOCUMENT);
  await page.getByRole('button', { name: `Ver ficha de ${NAME}` }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Pendiente de cobro: S/ 14.50' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/05-ficha-pendiente.png` });
  await page.getByRole('button', { name: 'Cobrar' }).click();
  const checks = page.getByRole('list', { name: 'Ventas pendientes' }).getByRole('checkbox');
  await expect(checks).toHaveCount(2);
  await checks.nth(1).uncheck();
  await page.screenshot({ path: `${SHOTS}/06-cobrar.png` });
  await page.getByRole('button', { name: /^Cobrar S\/\s/ }).click();
  await expect(page.getByText(new RegExp(`${NAME} pagó S/\\s.*Aún debe`))).toBeVisible();
  const left = await call<{ balance: string; pending_count: number }>(request, admin, 'get', `/members/${memberId}/pending-sales`);
  expect(left.body.data.pending_count).toBe(1);

  // 4. Reception sells and collects too; the report is the admin's.
  expect((await call(request, reception, 'get', '/sales/report')).status).toBe(403);
  const collectRest = await call<{ remaining_balance: string }>(request, reception, 'post', '/sales/collections', { member_id: memberId, branch_id: branch, method: 'cash' });
  expect(collectRest.status).toBe(201);
  expect(collectRest.body.data.remaining_balance).toBe('0.00');

  // 5. Membership rules: renewing the same plan continues it, an earlier explicit start is refused, a period can be corrected.
  const detail = await call<{ memberships: { id: string; ends_on: string; starts_on: string }[] }>(request, admin, 'get', `/members/${memberId}`);
  const firstEnd = detail.body.data.memberships[0].ends_on;
  const renewal = await call<{ membership: { starts_on: string } }>(request, admin, 'post', `/members/${memberId}/renewals`, { branch_id: branch, ...(plans.length > 1 ? { plan_id: planId } : {}), months: 1, amount: '90.00', method: 'cash' });
  expect(renewal.status).toBe(201);
  expect(renewal.body.data.membership.starts_on).toBe(firstEnd);
  const clash = await call(request, admin, 'post', `/members/${memberId}/renewals`, { branch_id: branch, ...(plans.length > 1 ? { plan_id: planId } : {}), months: 1, amount: '90.00', method: 'cash', starts_on: firstEnd.slice(0, 8) + '01' });
  expect(clash.status).toBe(409);
  expect(clash.body.error?.code).toBe('MEMBERSHIP_OVERLAP');

  // The renewal was made through the API: reload so the file shows it.
  await page.reload();
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Miembros', exact: true }).click();
  await page.getByLabel('Buscar miembro por nombre o documento').fill(DOCUMENT);
  await page.getByRole('button', { name: `Ver ficha de ${NAME}` }).click();
  const periods = page.getByLabel('Membresías del miembro');
  await expect(periods.getByText('Programada')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/07-ficha-periodos.png` });
  await periods.getByRole('button', { name: /^Modificar / }).first().click();
  await expect(page.getByRole('heading', { name: 'Modificar membresía' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/08-modificar-periodo.png` });
  await page.getByLabel('Importe (S/)').fill('95');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Membresía corregida. La boleta muestra los nuevos datos.')).toBeVisible();
  await expect(periods.getByText('Corregida').first()).toBeVisible();
  const history = await call<{ changed_by: { full_name: string }; before: { amount: string }; after: { amount: string } }[]>(
    request, admin, 'get', `/members/${memberId}/memberships/${(await call<{ memberships: { id: string; amended_at: string | null }[] }>(request, admin, 'get', `/members/${memberId}`)).body.data.memberships.find((m) => m.amended_at)!.id}/amendments`);
  expect(history.body.data[0].after.amount).toBe('95.00');
  expect(history.body.data[0].changed_by.full_name).toBeTruthy();

  // 6. Mobile layout of the quick sale.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#sell');
  await page.getByRole('heading', { name: 'Venta rápida' }).waitFor();
  await page.locator('.qs-product', { hasText: 'Agua' }).click({ force: true });
  await page.screenshot({ path: `${SHOTS}/09-vender-movil.png`, fullPage: true });
});
