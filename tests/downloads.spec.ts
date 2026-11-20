import { test, expect, type Page, type Route } from '@playwright/test';
import { BRANCH_ID, mockBackends } from './support/mocks';
import { navigate, signIn } from './support/ui';

const API = 'http://api.test';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
const lima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
const today = lima.format(new Date());

const MEMBER_ID = '00000000-0000-4000-8000-0000000000b1';
const memberView = {
  id: MEMBER_ID,
  document_type: 'dni',
  document_number: '45678912',
  full_name: 'José Ñañez Peña',
  phone: '999111222',
  home_branch: { id: BRANCH_ID, name: 'Sede Central', gym_name: 'Atlas Fitness' },
  status: 'active',
  days_remaining: 20,
  plan_label: '1 mes',
  plan_names: ['Baile'],
  starts_on: today,
  ends_on: today,
  last_receipt: null,
};

/** Answers every download with a tiny file and records the query it was asked with. */
async function mockDownloads(page: Page): Promise<URL[]> {
  const asked: URL[] = [];
  await page.route(`${API}/**`, async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1', '');
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (path === '/members') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({ data: [memberView], meta: { page: 1, page_size: 25, total: 1, counts: { all: 1, active: 1, expiring: 0, expired: 0, scheduled: 0 } } }),
      });
    }
    if (path === `/members/${MEMBER_ID}`) {
      return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ data: { ...memberView, memberships: [] } }) });
    }
    if (path === `/members/${MEMBER_ID}/measurements`) {
      const row = { id: 'm1', member_id: MEMBER_ID, measured_on: today, weight_kg: 80, height_cm: null, body_fat_pct: null, waist_cm: null, chest_cm: null, hip_cm: null, notes: '' };
      return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ data: [row] }) });
    }
    if (path === `/members/${MEMBER_ID}/routines`) {
      return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ data: [] }) });
    }
    if (!path.endsWith('/export') && !path.endsWith('/measurements/pdf')) return route.fallback();
    asked.push(url);
    return route.fulfill({ status: 200, contentType: 'application/octet-stream', headers: CORS, body: 'file' });
  });
  return asked;
}

const shots = process.env.DOWNLOAD_SHOTS_DIR;

test('payments: one "Descargar" opens Excel, CSV and PDF and sends the screen filters', async ({ page }) => {
  await mockBackends(page);
  const asked = await mockDownloads(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Pagos e ingresos');

  const trigger = page.getByRole('button', { name: 'Descargar', exact: true });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await trigger.click();
  const menu = page.getByRole('menu', { name: 'Formato de descarga' });
  await expect(menu.getByRole('menuitem')).toHaveText([/Excel/, /CSV/, /PDF/]);
  if (shots) await page.screenshot({ path: `${shots}/menu-payments.png`, clip: { x: 300, y: 0, width: 1140, height: 520 } });

  const saved = page.waitForEvent('download');
  await menu.getByRole('menuitem', { name: /Excel/ }).click();
  expect((await saved).suggestedFilename()).toBe(`pagos-${today}.xlsx`);
  await expect(menu).toHaveCount(0);
  expect(asked[0].pathname).toBe('/api/v1/payments/export');
  expect(asked[0].searchParams.get('format')).toBe('xlsx');
  expect(asked[0].searchParams.get('from')).toBe(today);
  expect(asked[0].searchParams.get('branch_id')).toBe(BRANCH_ID);
});

test('the menu works with the keyboard', async ({ page }) => {
  await mockBackends(page);
  const asked = await mockDownloads(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');

  const trigger = page.getByRole('button', { name: 'Descargar', exact: true });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /Excel/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /PDF/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /Excel/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.keyboard.press('Enter');
  await page.keyboard.press('End');
  const saved = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  expect((await saved).suggestedFilename()).toBe(`miembros-${today}.pdf`);
  expect(asked[0].pathname).toBe('/api/v1/members/export');
  expect(asked[0].searchParams.get('format')).toBe('pdf');
});

test('the member file offers only a PDF of the measurements', async ({ page }) => {
  await mockBackends(page, { features: ['body_tracking'] });
  const asked = await mockDownloads(page);
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: `Ver ficha de ${memberView.full_name}` }).click();
  await page.getByRole('button', { name: 'Medidas y rutinas' }).click();
  const button = page.getByRole('button', { name: 'Descargar PDF' });
  await expect(button).toBeVisible();
  if (shots) await page.locator('.bt-panel').screenshot({ path: `${shots}/body-pdf-button.png` });
  const saved = page.waitForEvent('download');
  await button.click();
  expect((await saved).suggestedFilename()).toBe(`medidas-jose-nanez-pena-${today}.pdf`);
  expect(asked.map((url) => url.pathname)).toEqual([`/api/v1/members/${MEMBER_ID}/measurements/pdf`]);
});
