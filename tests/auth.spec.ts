import { test, expect } from '@playwright/test';
import { createAccount, PASSWORD, uniqueDni } from './support/api';
import { logout, navigate, signIn } from './support/ui';

test('a wrong password shows the message and nothing is kept in the browser', async ({ page }) => {
  await signIn(page, uniqueDni(), 'incorrecta123');
  await expect(page.getByRole('alert')).toHaveText('DNI o contraseña incorrectos.');
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('the first sign-in forces a new password, then asks to sign in again', async ({ page }) => {
  const account = await createAccount(['Sede Central'], false);
  await signIn(page, account.ownerDni, account.ownerDni);
  await expect(page.getByRole('heading', { name: 'Crea tu contraseña' })).toBeVisible();
  await page.getByLabel('Nueva contraseña').fill(PASSWORD);
  await page.getByLabel('Repetir contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.getByText('Contraseña actualizada. Inicia sesión con tu nueva contraseña.')).toBeVisible();
  await signIn(page, account.ownerDni, PASSWORD);
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
});

test('the session lives in memory: a reload goes back to the login', async ({ page }) => {
  const account = await createAccount();
  await signIn(page, account.ownerDni, PASSWORD);
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

test('the profile edits name and phone and changes the password', async ({ page }) => {
  const account = await createAccount();
  await signIn(page, account.ownerDni, PASSWORD);
  await page.getByRole('button', { name: 'Mi perfil' }).click();
  await page.getByLabel('Celular (+51)').fill('977666555');
  await page.getByRole('button', { name: 'Guardar datos' }).click();
  await expect(page.getByText('Datos actualizados.')).toBeVisible();
  await page.getByLabel('Contraseña actual').fill(PASSWORD);
  await page.getByLabel(/^Nueva contraseña/).fill('OtraClave2026!');
  await page.getByLabel(/^Repetir nueva contraseña/).fill('OtraClave2026!');
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await expect(page.getByText('Contraseña actualizada. Úsala la próxima vez que inicies sesión.')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await logout(page);
  await signIn(page, account.ownerDni, 'OtraClave2026!');
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
  await navigate(page, 'Miembros');
});

test('a user created by the owner can sign in only after choosing a password', async ({ page }) => {
  const account = await createAccount();
  const dni = uniqueDni();
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Usuarios');
  await page.getByRole('button', { name: 'Nuevo usuario', exact: true }).click();
  await page.getByLabel('Nombre completo').fill('Rosa de Prueba');
  await page.getByPlaceholder('8 dígitos').fill(dni);
  await page.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Guardar usuario' }).click();
  await expect(page.getByText('Usuario creado.')).toBeVisible();
  await logout(page);
  await signIn(page, dni, dni);
  await expect(page.getByRole('heading', { name: 'Crea tu contraseña' })).toBeVisible();
});
