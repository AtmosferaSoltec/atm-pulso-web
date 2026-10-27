import { test, expect, type Page } from '@playwright/test';
async function signIn(page: Page, email: string): Promise<void> {
 await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
 await page.locator('input[autocomplete="current-password"]').fill('Pulso2026!');
 await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}
async function start(page: Page, email: string): Promise<void> { await page.goto('/'); await signIn(page, email); }
async function navigate(page: Page, label: string): Promise<void> {
 const nav = page.getByRole('navigation');
 const target = nav.getByRole('button', { name: label, exact: true });
 if (!(await target.isVisible())) await nav.getByRole('button', { name: 'Configuración', exact: true }).click();
 await target.click();
}
async function logout(page: Page): Promise<void> { await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click(); }

test('superadmin consults every account without operational actions', async ({ page }) => {
 await start(page, 'equipo@atmosfera.example');
 await expect(page.getByRole('heading', { name: 'Clientes y gimnasios' })).toBeVisible();
 await page.getByRole('button', { name: 'Consultar Grupo Atlas' }).click();
 await expect(page.getByRole('button', { name: 'Nuevo miembro', exact: true })).toHaveCount(0);
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(8);
 await expect(page.getByRole('link', { name: /Avisar a/ })).toHaveCount(0);
 await page.getByRole('button', { name: 'Ver ficha de Camila Torres' }).click();
 await expect(page.getByRole('button', { name: 'Renovar membresía' })).toHaveCount(0);
 await expect(page.getByRole('button', { name: 'Editar datos' })).toHaveCount(0);
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await navigate(page, 'Control de acceso');
 await expect(page.getByRole('button', { name: 'Verificar acceso', exact: true })).toHaveCount(0);
 await navigate(page, 'Gimnasios y reglas');
 await expect(page.getByLabel('Compartir directorio de miembros', { exact: false })).toBeDisabled();
 await expect(page.getByRole('button', { name: 'Guardar reglas' })).toHaveCount(0);
 await navigate(page, 'Usuarios');
 await expect(page.getByRole('button', { name: 'Nuevo usuario', exact: true })).toHaveCount(0);
 await navigate(page, 'Identidad');
 await expect(page.getByRole('button', { name: 'Guardar identidad' })).toHaveCount(0);
 await page.getByRole('button', { name: 'Volver a clientes' }).click();
 await page.getByRole('button', { name: 'Consultar Gimnasio Central' }).click();
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(2);
 await expect(page.locator('tbody')).not.toContainText('Camila');
});

test('platform creates multiple gyms with a repeated RUC and a working administrator login', async ({ page }) => {
 await start(page, 'equipo@atmosfera.example');
 await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
 await page.getByLabel('Nombre del cliente o grupo').fill('Grupo Prueba');
 await page.getByLabel('Tipo de cliente').selectOption('individual');
 await page.getByLabel('Nombre del administrador').fill('Administrador Prueba');
 await page.getByLabel('Correo del administrador').fill('admin@prueba.example');
 await page.getByLabel('Nombre del gimnasio 1', { exact: true }).fill('Fuerza Uno');
 await page.getByLabel('RUC del gimnasio 1', { exact: true }).fill('DEMO-REPETIDO');
 await page.getByLabel('Sede 1 del gimnasio 1', { exact: true }).fill('Centro');
 await page.getByRole('button', { name: 'Añadir sede al gimnasio 1' }).click();
 await page.getByLabel('Sede 2 del gimnasio 1', { exact: true }).fill('Sur');
 await page.getByRole('button', { name: 'Añadir otro gimnasio' }).click();
 await page.getByLabel('Nombre del gimnasio 2', { exact: true }).fill('Fuerza Dos');
 await page.getByLabel('RUC del gimnasio 2', { exact: true }).fill('DEMO-REPETIDO');
 await page.getByLabel('Sede 1 del gimnasio 2', { exact: true }).fill('Norte');
 await page.getByRole('button', { name: 'Crear cliente y administrador' }).click();
 const client = page.locator('.client-card').filter({ hasText: 'Grupo Prueba' });
 await expect(client).toContainText('Fuerza Uno');
 await expect(client).toContainText('Fuerza Dos');
 await expect(client.getByText('RUC DEMO-REPETIDO')).toHaveCount(2);
 await client.getByRole('button', { name: 'Añadir gimnasio' }).click();
 await page.getByLabel('Nombre del gimnasio 1', { exact: true }).fill('Fuerza Tres');
 await page.getByLabel('RUC del gimnasio 1', { exact: true }).fill('DEMO-OTRO');
 await page.getByLabel('Sede 1 del gimnasio 1', { exact: true }).fill('Oeste');
 await page.getByRole('button', { name: 'Guardar gimnasio', exact: true }).click();
 await page.getByRole('button', { name: 'Añadir sede a Fuerza Tres', exact: true }).click();
 await page.getByLabel('Nombre de la sede', { exact: true }).fill('Este');
 await page.getByRole('button', { name: 'Guardar sede', exact: true }).click();
 await logout(page);
 await signIn(page, 'admin@prueba.example');
 await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
 await expect(page.locator('.tenant-brand-link')).toContainText('Fuerza Uno');
 await page.getByRole('button', { name: 'Cambiar sede', exact: true }).click();
 await expect(page.getByRole('dialog').locator('.branch-option')).toHaveCount(5);
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await navigate(page, 'Gimnasios y reglas');
 await expect(page.getByRole('heading', { name: 'Fuerza Tres' })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Añadir gimnasio', exact: true })).toHaveCount(0);
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(0);
});

test('administrator creates, reassigns, and deactivates reception users within the account', async ({ page }) => {
 await start(page, 'dueno@atlas.example');
 await navigate(page, 'Usuarios');
 await page.getByRole('button', { name: 'Nuevo usuario', exact: true }).click();
 await page.getByLabel('Nombre completo', { exact: true }).fill('Recepción Prueba');
 await page.getByLabel('Correo electrónico', { exact: true }).fill('nuevo@atlas.example');
 await expect(page.getByRole('option', { name: 'Superadmin' })).toHaveCount(0);
 await page.getByRole('button', { name: 'Guardar usuario' }).click();
 await expect(page.getByRole('alert')).toContainText('al menos una sede');
 await page.getByLabel('Norte Gym · Los Olivos', { exact: true }).check();
 await page.getByRole('button', { name: 'Guardar usuario' }).click();
 await logout(page);
 await signIn(page, 'nuevo@atlas.example');
 await expect(page.getByRole('heading', { name: 'Control de acceso', exact: true })).toBeVisible();
 await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(3);
 await expect(page.getByRole('button', { name: 'Resumen', exact: true })).toHaveCount(0);
 await expect(page.locator('.tenant-brand-link')).toContainText('Norte Gym');
 for (const hash of ['organization','team','branding','dashboard']) {
  await page.goto(`/#${hash}`);
  await expect(page.getByRole('heading', { name: 'Control de acceso', exact: true })).toBeVisible();
 }
 await navigate(page, 'Pagos');
 await expect(page.locator('.payment-metrics')).toHaveCount(0);
 await logout(page);
 await signIn(page, 'dueno@atlas.example');
 await navigate(page, 'Usuarios');
 await page.getByRole('button', { name: 'Editar a Recepción Prueba' }).click();
 await page.getByLabel('Norte Gym · Los Olivos', { exact: true }).uncheck();
 await page.getByLabel('Atlas Fitness · Barranco', { exact: true }).check();
 await page.getByRole('button', { name: 'Guardar usuario' }).click();
 await logout(page);
 await signIn(page, 'nuevo@atlas.example');
 await expect(page.locator('.location-label')).toContainText('Barranco');
 await logout(page);
 await signIn(page, 'dueno@atlas.example');
 await navigate(page, 'Usuarios');
 await page.getByRole('button', { name: 'Desactivar a Recepción Prueba' }).click();
 await logout(page);
 await signIn(page, 'nuevo@atlas.example');
 await expect(page.getByRole('alert')).toContainText('incorrectos');
});

test('tenant branding follows the gym and survives logout within the mock session', async ({ page }) => {
 await start(page, 'dueno@atlas.example');
 await navigate(page, 'Identidad');
 await page.getByLabel('Nombre visible', { exact: true }).fill('Atlas Club');
 await page.getByRole('button', { name: 'Violeta', exact: true }).click();
 const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aA1kAAAAASUVORK5CYII=', 'base64');
 await page.getByLabel('Logo del gimnasio', { exact: false }).setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
 await expect(page.getByRole('button', { name: 'Guardar identidad' })).toBeEnabled();
 await page.getByRole('button', { name: 'Guardar identidad' }).click();
 await expect(page.locator('.tenant-brand-link')).toContainText('Atlas Club');
 await expect(page.locator('.tenant-brand-link img')).toHaveAttribute('src', /^data:image\/png/);
 expect(await page.locator('.app-shell').evaluate(element => getComputedStyle(element).getPropertyValue('--tenant-primary'))).toBe('#7751a3');
 await expect(page).toHaveTitle('Atlas Club · Identidad');
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Ver ficha de Camila Torres' }).click();
 await expect(page.getByRole('dialog').locator('.gym-brand')).toContainText('Atlas Club');
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await page.getByRole('button', { name: 'Cambiar sede', exact: true }).click();
 await page.getByRole('dialog').getByRole('button', { name: /Norte Gym · Los Olivos/ }).click();
 await expect(page.locator('.tenant-brand-link')).toContainText('Norte Gym');
 expect(await page.locator('.app-shell').evaluate(element => getComputedStyle(element).getPropertyValue('--tenant-primary'))).toBe('#356443');
 await logout(page);
 await signIn(page, 'recepcion@atlas.example');
 await expect(page.locator('.tenant-brand-link')).toContainText('Atlas Club');
 await expect(page.getByRole('button', { name: 'Identidad', exact: true })).toHaveCount(0);
});

test('superadmin and tenant customization screens fit mobile', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 await start(page, 'equipo@atmosfera.example');
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
 expect(await page.getByRole('dialog').evaluate(element => element.getBoundingClientRect().width <= innerWidth)).toBe(true);
 await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await page.getByRole('button', { name: 'Consultar Grupo Atlas' }).click();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.getByRole('button', { name: 'Abrir menú' }).click();
 await navigate(page, 'Identidad');
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
