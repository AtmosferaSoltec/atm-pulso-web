import { test, expect } from '@playwright/test';
import { mockBackends } from './support/mocks';
import { logout, signIn } from './support/ui';

test('a wrong password shows the message and nothing is kept in the browser', async ({ page }) => {
  await mockBackends(page);
  await signIn(page, '74455518', 'incorrecta123');
  await expect(page.getByRole('alert')).toHaveText('DNI o contraseña incorrectos.');
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('the first sign-in asks for a new password, then enters', async ({ page }) => {
  await mockBackends(page, { firstLogin: true });
  await signIn(page, '74455518', '74455518');
  await expect(page.getByRole('heading', { name: 'Crea tu contraseña' })).toBeVisible();
  await page.getByLabel('Nueva contraseña').fill('NuevaClave123');
  await page.getByLabel('Repetir contraseña').fill('NuevaClave123');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
});

test('a reload keeps the session through the refresh token, and signing out clears it', async ({ page }) => {
  const { calls } = await mockBackends(page);
  await signIn(page, '74455518', 'Clave12345');
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
  expect(calls).toContain('POST /v1/refresh');
  await logout(page);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  expect(calls).toContain('POST /v1/logout');
});

test('with a single gym there is no gym selector', async ({ page }) => {
  await mockBackends(page);
  await signIn(page, '74455518', 'Clave12345');
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cambiar de gimnasio' })).toHaveCount(0);
});

test('with several gyms the selector switches the session through a refresh', async ({ page }) => {
  const { calls } = await mockBackends(page, { gyms: 2 });
  await signIn(page, '74455518', 'Clave12345');
  await page.getByRole('button', { name: 'Cambiar de gimnasio' }).click();
  await page.getByRole('button', { name: /Gimnasio 2/ }).click();
  await expect.poll(() => calls.filter((call) => call === 'POST /v1/refresh').length).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
});
