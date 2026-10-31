import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// Live check of the body_tracking module against the LOCAL stack (nothing mocked). Needs the demo gym "Fuerza Uno" with the
// `body_tracking` module on and the member "Carlos Demo Medidas" (DNI 10000103) with three measurements and a routine.
// LIVE_API redirects the web's calls to another pulso-api instance (the web itself is the one on :5173).
const PASSWORD = process.env.LIVE_PASSWORD ?? 'Pulso-Demo-2026';
const AUTH = process.env.LIVE_AUTH ?? 'http://localhost:3130';
const API = process.env.LIVE_API ?? 'http://localhost:3001/api/v1';
const SHOTS = process.env.LIVE_SHOTS ?? 'shots';
const MEMBER = 'Carlos Demo Medidas';

async function token(request: APIRequestContext, dni: string): Promise<string> {
  const login = await request.post(`${AUTH}/v1/login`, { data: { dni, password: PASSWORD, system: 'pulso' } });
  return ((await login.json()) as { access_token: string }).access_token;
}

async function signIn(page: Page, dni: string): Promise<void> {
  if (API !== 'http://localhost:3001/api/v1') {
    await page.route('http://localhost:3001/api/v1/**', async (route) => {
      const response = await route.fetch({ url: route.request().url().replace('http://localhost:3001/api/v1', API) });
      await route.fulfill({ response });
    });
  }
  await page.goto('/');
  await page.getByLabel('DNI', { exact: true }).fill(dni);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navegación principal' }).waitFor();
}

async function openFile(page: Page): Promise<void> {
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Miembros', exact: true }).click();
  await page.getByRole('button', { name: `Ver ficha de ${MEMBER}` }).click();
  await page.getByRole('button', { name: 'Medidas y rutinas' }).click();
}

test('the member file shows the chart, the quick add and the current routine, and every read is audited', async ({ page, request }) => {
  const admin = await token(request, '10000001');
  const headers = { Authorization: `Bearer ${admin}` };
  const members = (await (await request.get(`${API}/members?q=${encodeURIComponent(MEMBER)}`, { headers })).json()) as { data: { id: string }[] };
  const memberId = members.data[0].id;
  const logBefore = ((await (await request.get(`${API}/members/${memberId}/body-access-log`, { headers })).json()) as { data: unknown[] }).data.length;

  await signIn(page, '10000001');
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Miembros', exact: true }).click();
  await page.getByRole('button', { name: `Ver ficha de ${MEMBER}` }).click();
  await expect(page.getByRole('button', { name: 'Medidas y rutinas' })).toHaveAttribute('aria-expanded', 'false');
  await page.screenshot({ path: `${SHOTS}/bt-01-ficha-plegada.png` });
  // Opening the file alone is not a read of health data.
  const logFolded = ((await (await request.get(`${API}/members/${memberId}/body-access-log`, { headers })).json()) as { data: unknown[] }).data.length;
  expect(logFolded).toBe(logBefore);

  await page.getByRole('button', { name: 'Medidas y rutinas' }).click();
  await expect(page.getByTestId('weight-dot')).toHaveCount(3);
  await expect(page.locator('.bt-chart figcaption')).toContainText("−5 kg");
  await expect(page.locator('.bt-routine.current')).toContainText('Hipertrofia 4 días');
  await page.locator('.bt-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/bt-02-seccion-abierta.png` });
  await page.locator('.bt-panel').screenshot({ path: `${SHOTS}/bt-03-seccion.png` });

  await page.locator('.bt-routine.current').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/bt-03b-rutina.png` });

  // Quick add and delete from the web (leaves the demo data as it was).
  const rows = page.getByRole('list', { name: 'Mediciones' }).getByRole('listitem');
  await expect(rows).toHaveCount(3);
  await page.getByRole('button', { name: /Más datos/ }).click();
  await page.getByRole('textbox', { name: 'Peso (kg)' }).fill('92,5');
  await page.getByLabel('Cintura (cm)').fill('96');
  await page.getByLabel('Notas').fill('Prueba en vivo');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(rows).toHaveCount(4);
  await page.locator('.bt-panel').screenshot({ path: `${SHOTS}/bt-04-despues-de-agregar.png` });
  await rows.first().getByRole('button', { name: /^Eliminar medición/ }).click();
  await rows.first().getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(rows).toHaveCount(3);

  // Every one of those actions (2 reads + create + read + delete + read) is in the log, without values.
  const log = ((await (await request.get(`${API}/members/${memberId}/body-access-log`, { headers })).json()) as { data: { action: string; resource: string; user_name: string }[] }).data;
  expect(log.length).toBeGreaterThan(logBefore + 4);
  expect(JSON.stringify(log)).not.toMatch(/92[.,]5|Prueba en vivo|Hipertrofia/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.bt-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/bt-05-movil.png` });
});

test('reception reaches the same data', async ({ page }) => {
  await signIn(page, '10000002');
  await openFile(page);
  await expect(page.getByTestId('weight-dot')).toHaveCount(3);
  await expect(page.locator('.bt-routine.current')).toContainText('Hipertrofia 4 días');
});
