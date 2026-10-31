import { test, expect, type Page } from '@playwright/test';

// Demo data of the local stack: gym "Fuerza Uno" with the `kiosk` module on, admin 10000001, reception 10000002.
const PASSWORD = process.env.LIVE_PASSWORD ?? 'Pulso-Demo-2026';
const AUTH = process.env.LIVE_AUTH ?? 'http://localhost:3130';
const API = process.env.LIVE_API ?? 'http://localhost:3001/api/v1';
const PIN = '2468';
const stamp = String(Date.now()).slice(-8);
const VALID = `7${stamp.slice(1)}`;
const EXPIRED = `6${stamp.slice(1)}`;
const SIZES = [
  { name: 'landscape', width: 1280, height: 800 },
  { name: 'portrait', width: 800, height: 1280 },
];

async function signIn(page: Page, path: string, dni: string): Promise<void> {
  await page.goto(path);
  await page.getByLabel('DNI', { exact: true }).fill(dni);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}

async function typeDigits(page: Page, digits: string): Promise<void> {
  for (const digit of digits) await page.getByRole('main').getByRole('button', { name: digit, exact: true }).click();
}

test('kiosk against the live stack: set PIN, enrol, allowed, denied, expired, exit', async ({ page, request }) => {
  // 1. Admin sets the exit PIN from the web and enrols a test member from the web.
  await signIn(page, '/', '10000001');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Configuración', exact: true }).click();
  await nav.getByRole('button', { name: 'Quiosco', exact: true }).click();
  await page.getByLabel(/PIN \(4 a 8 números\)|Nuevo PIN/).fill(PIN);
  await page.getByRole('button', { name: 'Guardar PIN' }).click();
  await expect(page.getByText('PIN de salida guardado.')).toBeVisible();

  await nav.getByRole('button', { name: 'Miembros', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo miembro' }).click();
  await page.getByPlaceholder('Ej. Andrea García').fill('Lucía Prueba Kiosco');
  await page.getByPlaceholder('999999999').fill('987654321');
  await page.getByPlaceholder('8 dígitos').fill(VALID);
  await page.getByRole('radio', { name: 'Membresía', exact: true }).click();
  await page.getByRole('spinbutton', { name: /Importe/ }).fill('90');
  await page.getByRole('button', { name: 'Guardar y ver boleta' }).click();
  await expect(page.getByText('Lucía Prueba Kiosco').first()).toBeVisible({ timeout: 15_000 });

  // 2. An expired member cannot be made from the form (start date), so it is created with the API as the admin.
  const login = await request.post(`${AUTH}/v1/login`, { data: { dni: '10000001', password: PASSWORD, system: 'pulso' } });
  const token = ((await login.json()) as { access_token: string }).access_token;
  const catalog = (await (await request.get(`${API}/catalog`, { headers: { Authorization: `Bearer ${token}` } })).json()) as { data: { gyms: { branches: { id: string }[] }[] } };
  const branch = catalog.data.gyms[0].branches[0].id;
  const plans = (await (await request.get(`${API}/membership-plans`, { headers: { Authorization: `Bearer ${token}` } })).json()) as { data: { id: string }[] };
  // The kiosk account is a receptionist pinned to one branch: assign it (the demo receptionist has none).
  const users = (await (await request.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })).json()) as { data: { id: string; document_number: string }[] };
  const reception = users.data.find((user) => user.document_number === '10000002')!;
  const pinned = await request.patch(`${API}/users/${reception.id}`, { headers: { Authorization: `Bearer ${token}` }, data: { branch_ids: [branch] } });
  expect(pinned.status(), await pinned.text()).toBe(200);
  const started = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
  const enrol = await request.post(`${API}/members`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { branch_id: branch, plan_id: plans.data[0].id, document_type: 'dni', document_number: EXPIRED, full_name: 'Mario Vencido Prueba', phone: '987654322', months: 1, starts_on: started, amount: '50', method: 'cash' },
  });
  expect(enrol.status(), await enrol.text()).toBe(201);

  // 3. Reception opens the kiosk at tablet sizes.
  for (const size of SIZES) {
    const tablet = await page.context().browser()!.newContext({ viewport: { width: size.width, height: size.height } });
    const screen = await tablet.newPage();
    await signIn(screen, '/kiosk', '10000002');
    const branchPicker = screen.getByRole('heading', { name: '¿En qué sede está este quiosco?' });
    await expect(branchPicker.or(screen.getByTestId('kiosk-display'))).toBeVisible({ timeout: 20_000 });
    if (await branchPicker.isVisible()) await screen.locator('.kiosk-branch-list button').first().click();
    await expect(screen.getByTestId('kiosk-display')).toBeVisible();
    await screen.screenshot({ path: `shots/kiosk-${size.name}-keypad.png` });

    await typeDigits(screen, VALID);
    await screen.screenshot({ path: `shots/kiosk-${size.name}-typed.png` });
    await screen.getByRole('button', { name: 'Entrar', exact: true }).click();
    const result = screen.getByTestId('kiosk-result');
    await expect(result).toHaveAttribute('data-allowed', 'true');
    await expect(result).toContainText('Lucía');
    await expect(result).not.toContainText('Prueba');
    await expect(screen.locator('body')).not.toContainText(VALID);
    await screen.screenshot({ path: `shots/kiosk-${size.name}-allowed.png` });
    await expect(result).toHaveCount(0, { timeout: 8000 });

    await typeDigits(screen, '10203040');
    await screen.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(screen.getByTestId('kiosk-result')).toContainText('Documento no registrado');
    await screen.screenshot({ path: `shots/kiosk-${size.name}-not-registered.png` });
    await expect(screen.getByTestId('kiosk-result')).toHaveCount(0, { timeout: 8000 });

    await typeDigits(screen, EXPIRED);
    await screen.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(screen.getByTestId('kiosk-result')).toContainText('Membresía vencida');
    await screen.screenshot({ path: `shots/kiosk-${size.name}-expired.png` });
    await expect(screen.getByTestId('kiosk-result')).toHaveCount(0, { timeout: 8000 });

    // Exit with the PIN.
    await screen.getByTestId('kiosk-logo').hover();
    await screen.mouse.down();
    const dialog = screen.getByRole('dialog', { name: 'PIN de salida' });
    await expect(dialog).toBeVisible({ timeout: 6000 });
    await screen.mouse.up();
    await screen.screenshot({ path: `shots/kiosk-${size.name}-pin.png` });
    for (const digit of PIN) await dialog.getByRole('button', { name: digit, exact: true }).click();
    await dialog.getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(screen).not.toHaveURL(/kiosk/);
    await tablet.close();
  }
});
