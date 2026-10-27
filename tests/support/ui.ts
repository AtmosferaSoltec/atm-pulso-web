import { expect, type Page } from '@playwright/test';

export async function signIn(page: Page, dni: string, password: string): Promise<void> {
  await page.goto('/');
  await page.getByLabel('DNI', { exact: true }).fill(dni);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}

/** Opens a section of the sidebar, expanding "Configuración" when it lives there. */
export async function navigate(page: Page, label: string): Promise<void> {
  const nav = page.getByRole('navigation');
  // The sidebar renders once the catalog has loaded.
  await nav.waitFor();
  const target = nav.getByRole('button', { name: label, exact: true });
  if (!(await target.isVisible())) await nav.getByRole('button', { name: 'Configuración', exact: true }).click();
  await target.click();
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
}
