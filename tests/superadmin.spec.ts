import { test, expect } from '@playwright/test';
import { createAccount, enrollMember, uniqueDni } from './support/api';
import { navigate, signIn } from './support/ui';

const superadmin = { dni: process.env.E2E_SUPERADMIN_DNI ?? '', password: process.env.E2E_SUPERADMIN_PASSWORD ?? '' };

test('the superadmin creates a client from the screen and finds it by name', async ({ page }) => {
  const dni = uniqueDni();
  await signIn(page, superadmin.dni, superadmin.password);
  await expect(page.getByRole('heading', { name: 'Clientes y gimnasios' })).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo cliente' }).click();
  await page.getByLabel('DNI del cliente').fill(dni);
  await page.getByLabel('Celular (+51)').fill('999000111');
  await page.getByLabel('Nombres', { exact: true }).fill('Carla');
  await page.getByLabel('Apellidos').fill(`Prueba ${dni}`);
  await page.getByLabel('Correo electrónico').fill('carla@example.com');
  await page.getByLabel('Nombre del gimnasio 1').fill(`Gym ${dni}`);
  await page.getByLabel('Sede 1 del gimnasio 1').fill('Sede Unica');
  await page.getByRole('button', { name: 'Crear cliente' }).click();
  await expect(page.getByText(`Cliente creado. Ingresa con el DNI ${dni}`)).toBeVisible();

  await page.getByLabel('Buscar cliente, gimnasio o RUC').fill(`Prueba ${dni}`);
  const card = page.locator('article.client-card', { hasText: `Carla Prueba ${dni}` });
  await expect(card).toHaveCount(1);
  await expect(card.getByText('Plan gratuito')).toBeVisible();
});

test('going beyond the free plan needs the agreement and is flagged as extra', async ({ page }) => {
  const dni = uniqueDni();
  await signIn(page, superadmin.dni, superadmin.password);
  await page.getByRole('button', { name: 'Nuevo cliente' }).click();
  await page.getByLabel('DNI del cliente').fill(dni);
  await page.getByLabel('Celular (+51)').fill('999000222');
  await page.getByLabel('Nombres', { exact: true }).fill('Diego');
  await page.getByLabel('Apellidos').fill(`Extra ${dni}`);
  await page.getByLabel('Correo electrónico').fill('diego@example.com');
  await page.getByLabel('Nombre del gimnasio 1').fill(`Gym ${dni}`);
  await page.getByLabel('Sede 1 del gimnasio 1').fill('Norte');
  await page.getByRole('button', { name: 'Añadir sede al gimnasio 1' }).click();
  await page.getByRole('textbox', { name: 'Sede 2 del gimnasio 1' }).fill('Sur');
  await expect(page.getByText('Supera el plan gratuito')).toBeVisible();
  await page.getByLabel('Ya lo acordé con el cliente').check();
  await page.getByRole('button', { name: 'Crear cliente' }).click();
  await expect(page.getByText(`Cliente creado. Ingresa con el DNI ${dni}`)).toBeVisible();
  await page.getByLabel('Buscar cliente, gimnasio o RUC').fill(`Extra ${dni}`);
  await expect(page.locator('article.client-card', { hasText: `Diego Extra ${dni}` }).getByText('1 sede extra')).toBeVisible();
});

test('the superadmin consults a client without any operational action', async ({ page }) => {
  const account = await createAccount(['Sede Central']);
  const member = await enrollMember(account.ownerToken, account.branches[0].id, { months: 1, startsOn: '2026-01-01' });
  await signIn(page, superadmin.dni, superadmin.password);
  await page.getByLabel('Buscar cliente, gimnasio o RUC').fill(account.ownerName);
  await page.getByRole('button', { name: `Consultar ${account.ownerName}` }).click();

  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo miembro', exact: true })).toHaveCount(0);
  await navigate(page, 'Miembros');
  await expect(page.getByText(member.name)).toBeVisible();
  await expect(page.getByRole('link', { name: /Avisar a/ })).toHaveCount(0);
  await page.getByRole('button', { name: `Ver ficha de ${member.name}` }).click();
  await expect(page.getByRole('heading', { name: 'Boleta de membresía' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Renovar membresía' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Editar datos' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await navigate(page, 'Control de acceso');
  await expect(page.getByLabel('Documento del miembro')).toHaveCount(0);
  await navigate(page, 'Usuarios');
  await expect(page.getByRole('button', { name: 'Nuevo usuario', exact: true })).toHaveCount(0);
  await navigate(page, 'Identidad');
  await expect(page.getByRole('button', { name: 'Guardar identidad' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Volver a clientes' }).click();
  await expect(page.getByRole('heading', { name: 'Clientes y gimnasios' })).toBeVisible();
});
