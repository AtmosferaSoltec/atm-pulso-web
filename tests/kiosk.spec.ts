import { test, expect, type Locator, type Page, type Route } from '@playwright/test';
import { BRANCH_ID, GYM_ID, mockBackends } from './support/mocks';

const API = 'http://api.test';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = (route: Route, status: number, body: unknown, headers: Record<string, string> = {}): Promise<void> =>
  route.fulfill({ status, contentType: 'application/json', headers: { ...CORS, ...headers }, body: JSON.stringify(body) });

const FULL_DOCUMENT = '74455518';
const SURNAME = 'Quispe Lozano';

const lima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
/** A Lima calendar date `offset` days from today. */
const day = (offset: number): string => lima.format(new Date(Date.now() + offset * 86_400_000));

function check(overrides: Record<string, unknown>): unknown {
  return {
    data: {
      event_id: '00000000-0000-4000-8000-0000000000aa',
      allowed: true,
      reason: 'MEMBERSHIP_VALID',
      expiring_in_days: null,
      ends_on: day(23),
      member: { id: 'm1', full_name: `MARÍA ${SURNAME}`, document_number: FULL_DOCUMENT },
      checked_at: new Date().toISOString(),
      ...overrides,
    },
  };
}

interface KioskMock {
  checks: { branch_id: string; document_number: string }[];
  exits: string[];
}

interface KioskOptions {
  pinSet?: boolean;
  /** Answers of /access/checks by document number; anything else is "not registered". */
  answers?: Record<string, (route: Route) => Promise<void>>;
  extraBranch?: boolean;
  pin?: string;
  delayMs?: number;
}

async function mockKiosk(page: Page, options: KioskOptions = {}): Promise<KioskMock> {
  const state: KioskMock = { checks: [], exits: [] };
  const pin = options.pin ?? '2468';
  let wrong = 0;
  await mockBackends(page, { features: ['kiosk'] });
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');
    if (request.method() === 'OPTIONS') return route.fallback();
    if (path === '/kiosk/settings') return json(route, 200, { data: { pin_set: options.pinSet ?? true } });
    if (path === '/kiosk/pin') return json(route, 200, { data: { pin_set: true } });
    if (path === '/kiosk/exit') {
      const body = request.postDataJSON() as { pin: string };
      state.exits.push(body.pin);
      if (wrong >= 5) return json(route, 429, { error: { code: 'KIOSK_PIN_LOCKED', message: 'x' } });
      if (body.pin === pin) return json(route, 200, { data: { ok: true } });
      wrong += 1;
      return json(route, 403, { error: { code: 'KIOSK_PIN_INVALID', message: 'x' } });
    }
    if (path === '/access/checks') {
      const body = request.postDataJSON() as { branch_id: string; document_number: string };
      state.checks.push(body);
      if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
      const answer = options.answers?.[body.document_number];
      if (answer) return answer(route);
      return json(route, 200, check({ allowed: false, reason: 'NOT_REGISTERED', ends_on: null, member: null }));
    }
    if (path === '/catalog' && options.extraBranch) {
      const gym = {
        id: GYM_ID, name: 'Atlas Fitness', display_name: null, brand_color: '#17677b', logo_url: null, tax_id: null, day_pass_price: '15.00',
        day_pass_price_is_default: true, branch_sharing: true, features: ['kiosk'],
        branches: [
          { id: BRANCH_ID, name: 'Sede Central', address: null, accessible: true },
          { id: '00000000-0000-4000-8000-000000000003', name: 'Sede Norte', address: null, accessible: true },
        ],
      };
      return json(route, 200, { data: { gyms: [gym] } });
    }
    return route.fallback();
  });
  return state;
}

async function openKiosk(page: Page): Promise<void> {
  await page.goto('/kiosk');
  await page.getByLabel('DNI', { exact: true }).fill('74455518');
  await page.locator('input[autocomplete="current-password"]').fill('Clave12345');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}

async function type(page: Page | Locator, digits: string): Promise<void> {
  for (const digit of digits) await page.getByRole('button', { name: digit, exact: true }).click();
}

const enter = (page: Page) => page.getByRole('button', { name: 'Entrar', exact: true });

test('without the kiosk module the route says so and the sidebar has no entry', async ({ page }) => {
  await mockBackends(page, { features: [] });
  await page.goto('/kiosk');
  await page.getByLabel('DNI', { exact: true }).fill('74455518');
  await page.locator('input[autocomplete="current-password"]').fill('Clave12345');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quiosco no disponible' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al sistema' }).click();
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Configuración' }).click();
  await expect(page.getByRole('button', { name: 'Quiosco', exact: true })).toHaveCount(0);
});

test('the kiosk refuses to start until the admin has set an exit PIN', async ({ page }) => {
  await mockKiosk(page, { pinSet: false });
  await openKiosk(page);
  await expect(page.getByRole('heading', { name: 'Falta el PIN de salida' })).toBeVisible();
  await expect(page.getByRole('button', { name: '1', exact: true })).toHaveCount(0);
});

test('an active member is let in: first name and days left only, document masked, back to the keypad after 5 s', async ({ page }) => {
  const mock = await mockKiosk(page, { answers: { [FULL_DOCUMENT]: (route) => json(route, 200, check({})) } });
  await openKiosk(page);
  await expect(enter(page)).toBeDisabled();
  await type(page, FULL_DOCUMENT);
  await expect(page.getByTestId('kiosk-display')).toHaveText('•••••••8');
  await expect(page.locator('body')).not.toContainText(FULL_DOCUMENT);
  await enter(page).click();
  const result = page.getByTestId('kiosk-result');
  await expect(result).toHaveAttribute('data-allowed', 'true');
  await expect(result).toContainText('¡Hola, María!');
  await expect(result).toContainText('Te quedan 23 días de membresía');
  const text = await page.locator('body').innerText();
  expect(text).not.toContain(FULL_DOCUMENT);
  expect(text).not.toContain('Quispe');
  expect(text).not.toContain('Lozano');
  expect(mock.checks).toEqual([{ branch_id: BRANCH_ID, document_number: FULL_DOCUMENT, id: expect.any(String) }]);
  await expect(page.getByTestId('kiosk-result')).toHaveCount(0, { timeout: 7000 });
  await expect(page.getByTestId('kiosk-display')).toContainText('Escribe tu número');
});

test('each refusal shows a plain reason in red', async ({ page }) => {
  await mockKiosk(page, {
    answers: {
      '11111111': (route) => json(route, 200, check({ allowed: false, reason: 'MEMBERSHIP_EXPIRED', ends_on: day(-10) })),
      '22222222': (route) => json(route, 200, check({ allowed: false, reason: 'MEMBERSHIP_NOT_STARTED', ends_on: day(5) })),
      '33333333': (route) => json(route, 200, check({ allowed: false, reason: 'BRANCH_NOT_ALLOWED', ends_on: null })),
    },
  });
  await openKiosk(page);
  const cases: [string, string][] = [
    ['99999999', 'Documento no registrado'],
    ['11111111', 'Membresía vencida'],
    ['22222222', 'Aún no empieza'],
    ['33333333', 'Sede no permitida'],
  ];
  for (const [document, headline] of cases) {
    await type(page, document);
    await enter(page).click();
    const result = page.getByTestId('kiosk-result');
    await expect(result).toHaveAttribute('data-allowed', 'false');
    await expect(result).toContainText(headline);
    await expect(result).not.toContainText('Hola');
    await expect(result).toHaveCSS('background-color', 'rgb(179, 38, 30)');
    await expect(result).toHaveCount(0, { timeout: 7000 });
  }
});

test('a network failure, a server error and the rate limit never look like "allowed"', async ({ page }) => {
  await mockKiosk(page, {
    answers: {
      '11111111': (route) => route.abort('connectionrefused'),
      '22222222': (route) => json(route, 500, { error: { code: 'INTERNAL_ERROR', message: 'x' } }),
      '33333333': (route) => json(route, 429, { error: { code: 'TOO_MANY_REQUESTS', message: 'x' } }, { 'retry-after': '30' }),
    },
  });
  await openKiosk(page);
  const cases: [string, string, string][] = [
    ['11111111', 'offline', 'Sin conexión'],
    ['22222222', 'server', 'No se pudo verificar'],
    ['33333333', 'rate_limited', 'Demasiados intentos'],
  ];
  for (const [document, kind, headline] of cases) {
    await type(page, document);
    await enter(page).click();
    const error = page.getByTestId('kiosk-error');
    await expect(error).toHaveAttribute('data-kind', kind);
    await expect(error).toContainText(headline);
    await expect(page.getByTestId('kiosk-result')).toHaveCount(0);
    await expect(error).toHaveCount(0, { timeout: 7000 });
  }
});

test('tapping Entrar twice sends a single check', async ({ page }) => {
  const mock = await mockKiosk(page, { delayMs: 600, answers: { [FULL_DOCUMENT]: (route) => json(route, 200, check({})) } });
  await openKiosk(page);
  await type(page, FULL_DOCUMENT);
  await enter(page).dblclick();
  await expect(page.getByTestId('kiosk-result')).toBeVisible();
  expect(mock.checks).toHaveLength(1);
});

test('a half-typed document can be corrected, and nothing past 12 digits is accepted', async ({ page }) => {
  await mockKiosk(page);
  await openKiosk(page);
  await type(page, '1234');
  await page.getByRole('button', { name: 'Borrar el último número' }).click();
  await expect(page.getByTestId('kiosk-display')).toHaveText('••3');
  await type(page, '4567890123456');
  await expect(page.getByTestId('kiosk-display')).toHaveText('•'.repeat(11) + '2');
});

test('the exit needs a 3 s press on the logo and the right PIN', async ({ page }) => {
  const mock = await mockKiosk(page);
  await openKiosk(page);
  const logo = page.getByTestId('kiosk-logo');
  await expect(logo).toBeVisible();
  // A short press does nothing.
  await logo.hover();
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await page.mouse.up();
  await expect(page.getByRole('dialog', { name: 'PIN de salida' })).toHaveCount(0);
  // Three seconds open the PIN dialog.
  await page.mouse.down();
  await expect(page.getByRole('dialog', { name: 'PIN de salida' })).toBeVisible({ timeout: 5000 });
  await page.mouse.up();
  const dialog = page.getByRole('dialog', { name: 'PIN de salida' });
  await type(dialog, '1111');
  await expect(page.getByTestId('kiosk-pin-display')).toHaveText('••••');
  await dialog.getByRole('button', { name: 'Salir', exact: true }).click();
  await expect(dialog).toContainText('PIN incorrecto.');
  await expect(page).toHaveURL(/\/kiosk/);
  await type(dialog, '2468');
  await dialog.getByRole('button', { name: 'Salir', exact: true }).click();
  await expect(page).not.toHaveURL(/kiosk/);
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  expect(mock.exits).toEqual(['1111', '2468']);
});

test('repeated wrong PINs end with the lock message', async ({ page }) => {
  await mockKiosk(page);
  await openKiosk(page);
  await page.getByTestId('kiosk-logo').hover();
  await page.mouse.down();
  const dialog = page.getByRole('dialog', { name: 'PIN de salida' });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await page.mouse.up();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await type(dialog, '0000');
    await dialog.getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(dialog.getByRole('alert')).not.toBeEmpty();
  }
  await expect(dialog).toContainText('Demasiados intentos');
});

test('with several branches the kiosk asks which one only once', async ({ page }) => {
  const mock = await mockKiosk(page, { extraBranch: true });
  await openKiosk(page);
  await expect(page.getByRole('heading', { name: '¿En qué sede está este quiosco?' })).toBeVisible();
  await page.getByRole('button', { name: 'Sede Norte' }).click();
  await expect(page.getByTestId('kiosk-display')).toBeVisible();
  await expect(page.locator('.kiosk-branch')).toHaveText('Sede Norte');
  await page.reload();
  await expect(page.getByTestId('kiosk-display')).toBeVisible();
  await type(page, '99999999');
  await enter(page).click();
  await expect(page.getByTestId('kiosk-result')).toBeVisible();
  expect(mock.checks[0].branch_id).toBe('00000000-0000-4000-8000-000000000003');
});

test('the admin sets the exit PIN from the Quiosco page and opens the kiosk', async ({ page }) => {
  await mockKiosk(page, { pinSet: false });
  await page.goto('/');
  await page.getByLabel('DNI', { exact: true }).fill('74455518');
  await page.locator('input[autocomplete="current-password"]').fill('Clave12345');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Configuración', exact: true }).click();
  await nav.getByRole('button', { name: 'Quiosco', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abrir quiosco' })).toBeDisabled();
  await page.getByLabel(/PIN \(4 a 8 números\)/).fill('2468');
  await page.getByRole('button', { name: 'Guardar PIN' }).click();
  await expect(page.getByText('PIN de salida guardado.')).toBeVisible();
});
