import { test, expect, type Page } from '@playwright/test';
async function signIn(page: Page, dni: string): Promise<void> {
 await page.getByLabel('DNI', { exact: true }).fill(dni);
 await page.locator('input[autocomplete="current-password"]').fill('Pulso2026!');
 await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}
async function start(page: Page, dni: string): Promise<void> { await page.goto('/'); await signIn(page, dni); }
async function navigate(page: Page, label: string): Promise<void> {
 const nav = page.getByRole('navigation');
 const target = nav.getByRole('button', { name: label, exact: true });
 if (!(await target.isVisible())) await nav.getByRole('button', { name: 'Configuración', exact: true }).click();
 await target.click();
}
async function logout(page: Page): Promise<void> { await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click(); }

test('superadmin consults every account without operational actions', async ({ page }) => {
 await start(page, '10000001');
 await expect(page.getByRole('heading', { name: 'Clientes y gimnasios' })).toBeVisible();
 await page.getByRole('button', { name: 'Consultar Grupo Atlas' }).click();
 await expect(page.getByRole('button', { name: 'Nuevo miembro', exact: true })).toHaveCount(0);
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(9);
 await expect(page.getByRole('link', { name: /Avisar a/ })).toHaveCount(0);
 await page.getByRole('button', { name: 'Ver ficha de Camila Torres' }).click();
 await expect(page.getByRole('button', { name: 'Renovar membresía' })).toHaveCount(0);
 await expect(page.getByRole('button', { name: 'Editar datos' })).toHaveCount(0);
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await navigate(page, 'Control de acceso');
 await expect(page.getByRole('button', { name: 'Verificar acceso', exact: true })).toHaveCount(0);
 await navigate(page, 'Gimnasios y reglas');
 await expect(page.getByLabel('Acceso entre sedes de Atlas Fitness')).toBeDisabled();
 await expect(page.getByLabel('Acceso entre sedes de Norte Gym')).toBeDisabled();
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
 await start(page, '10000001');
 await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
 await expect(page.getByRole('radio')).toHaveCount(0);
 await page.getByLabel('DNI del cliente').fill('20000001');
 await page.getByLabel('Nombres', { exact: true }).fill('Cliente');
 await page.getByLabel('Apellidos', { exact: true }).fill('Prueba');
 await page.getByLabel('Celular (+51)').fill('999111222');
 await page.getByLabel('Correo electrónico').fill('cliente@prueba.example');
 await page.getByLabel('Nombre del gimnasio 1', { exact: true }).fill('Fuerza Uno');
 await page.getByLabel('RUC del gimnasio 1', { exact: true }).fill('20123456789');
 await page.getByLabel('Sede 1 del gimnasio 1', { exact: true }).fill('Centro');
 await page.getByRole('button', { name: 'Añadir sede al gimnasio 1' }).click();
 await page.getByLabel('Sede 2 del gimnasio 1', { exact: true }).fill('Sur');
 await page.getByRole('button', { name: 'Añadir otro gimnasio' }).click();
 await page.getByLabel('Nombre del gimnasio 2', { exact: true }).fill('Fuerza Dos');
 await page.getByLabel('RUC del gimnasio 2', { exact: true }).fill('20123456789');
 await page.getByLabel('Sede 1 del gimnasio 2', { exact: true }).fill('Norte');
 // Two gyms exceed the free plan (1 gym), so the extra must be confirmed before creating.
 await expect(page.getByRole('note')).toContainText('Supera el plan gratuito: 1 gimnasio extra');
 await page.getByLabel('Ya lo acordé con el cliente').check();
 await page.getByRole('button', { name: 'Crear cliente y administrador' }).click();
 const client = page.locator('.client-card').filter({ hasText: 'Cliente Prueba' });
 await expect(client.locator('.client-heading')).not.toContainText('DNI');
 await expect(client.locator('.client-heading .badge').filter({ hasText: /Activa|Inactiva/ })).toHaveText('Activa');
 await expect(client.locator('.client-heading h2')).toHaveCount(1);
 await expect(client).toContainText('Fuerza Uno');
 await expect(client).toContainText('Fuerza Dos');
 await expect(client.getByText('RUC 20123456789')).toHaveCount(2);
 await client.getByRole('button', { name: 'Añadir gimnasio' }).click();
 await page.getByLabel('Nombre del gimnasio 1', { exact: true }).fill('Fuerza Tres');
 await page.getByLabel('RUC del gimnasio 1', { exact: true }).fill('20987654321');
 await page.getByLabel('Sede 1 del gimnasio 1', { exact: true }).fill('Oeste');
 await expect(page.getByRole('note')).toContainText('2 gimnasios extras');
 await page.getByLabel('Ya lo acordé con el cliente').check();
 await page.getByRole('button', { name: 'Guardar gimnasio', exact: true }).click();
 await expect(client.locator('.client-chips .badge').first()).toContainText('2 gimnasios extras');
 await page.getByRole('button', { name: 'Añadir sede a Fuerza Tres', exact: true }).click();
 await page.getByLabel('Nombre de la sede', { exact: true }).fill('Este');
 await page.getByRole('button', { name: 'Guardar sede', exact: true }).click();
 await logout(page);
 await signIn(page, '20000001');
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
 await start(page, '10000002');
 await navigate(page, 'Usuarios');
 await page.getByRole('button', { name: 'Nuevo usuario', exact: true }).click();
 await page.getByLabel('Nombre completo', { exact: true }).fill('Recepción Prueba');
 await page.getByLabel('DNI', { exact: true }).fill('20000002');
 await expect(page.getByRole('radio', { name: 'Superadmin' })).toHaveCount(0);
 await page.getByRole('button', { name: 'Guardar usuario' }).click();
 await expect(page.getByRole('alert')).toContainText('al menos una sede');
 await page.getByLabel('Norte Gym · Los Olivos', { exact: true }).check();
 await page.getByRole('button', { name: 'Guardar usuario' }).click();
 await logout(page);
 await signIn(page, '20000002');
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
 await signIn(page, '10000002');
 await navigate(page, 'Usuarios');
 await page.getByRole('button', { name: 'Editar a Recepción Prueba' }).click();
 await page.getByLabel('Norte Gym · Los Olivos', { exact: true }).uncheck();
 await page.getByLabel('Atlas Fitness · Barranco', { exact: true }).check();
 await page.getByRole('button', { name: 'Guardar usuario' }).click();
 await logout(page);
 await signIn(page, '20000002');
 await expect(page.locator('.location-label')).toContainText('Barranco');
 await logout(page);
 await signIn(page, '10000002');
 await navigate(page, 'Usuarios');
 await page.getByRole('button', { name: 'Desactivar a Recepción Prueba' }).click();
 await logout(page);
 await signIn(page, '20000002');
 await expect(page.getByRole('alert')).toContainText('incorrectos');
});

test('tenant branding follows the gym and survives logout within the mock session', async ({ page }) => {
 await start(page, '10000002');
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
 await signIn(page, '10000003');
 await expect(page.locator('.tenant-brand-link')).toContainText('Atlas Club');
 await expect(page.getByRole('button', { name: 'Identidad', exact: true })).toHaveCount(0);
});

test('superadmin and tenant customization screens fit mobile', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 await start(page, '10000001');
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

test('document search buttons fill mock data and validate the number', async ({ page }) => {
 await start(page, '10000001');
 await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
 await page.getByRole('button', { name: 'Buscar DNI' }).click();
 await expect(page.getByRole('alert')).toContainText('DNI de 8 dígitos');
 await page.getByLabel('DNI del cliente').fill('45678912');
 await page.getByRole('button', { name: 'Buscar DNI' }).click();
 await expect(page.getByLabel('Nombres', { exact: true })).not.toHaveValue('');
 await expect(page.getByLabel('Apellidos', { exact: true })).not.toHaveValue('');
 await expect(page.getByRole('alert')).toHaveCount(0);
 await page.getByLabel('RUC del gimnasio 1', { exact: true }).fill('123');
 await page.getByRole('button', { name: 'Buscar RUC del gimnasio 1' }).click();
 await expect(page.getByRole('alert')).toContainText('RUC de 11 dígitos');
 await page.getByLabel('RUC del gimnasio 1', { exact: true }).fill('20123456789');
 await page.getByRole('button', { name: 'Buscar RUC del gimnasio 1' }).click();
 await expect(page.getByLabel('Nombre del gimnasio 1', { exact: true })).toHaveValue(/S\.A\.C\./);
 await expect(page.getByLabel('Dirección 1 del gimnasio 1', { exact: true })).not.toHaveValue('');
});

test('gym admin works only inside their gym and manages its rules', async ({ page }) => {
 await start(page, '10000005');
 await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
 await expect(page.locator('.tenant-brand-link')).toContainText('Atlas Fitness');
 await page.getByRole('button', { name: 'Cambiar sede', exact: true }).click();
 await expect(page.getByRole('dialog').locator('.branch-option')).toHaveCount(2);
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 const nav = page.getByRole('navigation');
 await nav.getByRole('button', { name: 'Configuración', exact: true }).click();
 await expect(nav.getByRole('button', { name: 'Gimnasios y reglas', exact: true })).toBeVisible();
 await expect(nav.getByRole('button', { name: 'Usuarios', exact: true })).toBeVisible();
 await expect(nav.getByRole('button', { name: 'Identidad', exact: true })).toBeVisible();
 // The administrator sees only their own gym's rules, and can change them.
 await navigate(page, 'Gimnasios y reglas');
 await expect(page.getByRole('heading', { name: 'Gimnasios y sedes' })).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Atlas Fitness', exact: true })).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Norte Gym', exact: true })).toHaveCount(0);
 await page.getByLabel('Acceso entre sedes de Atlas Fitness').uncheck();
 await expect(page.getByRole('status')).toContainText('desactivado');
 await navigate(page, 'Usuarios');
 await expect(page.locator('tbody')).not.toContainText('Andrea Salas');
 await expect(page.locator('tbody')).toContainText('Luis Rojas');
 await page.getByRole('button', { name: 'Nuevo usuario', exact: true }).click();
 await expect(page.getByRole('dialog').locator('fieldset input[type=checkbox]')).toHaveCount(2);
 await expect(page.getByRole('radio', { name: 'Norte Gym' })).toHaveCount(0);
 // Only the owner can appoint administrators: an admin can only create reception staff.
 await expect(page.getByRole('radiogroup', { name: 'Rol' })).toHaveCount(0);
 await expect(page.getByRole('radio', { name: 'Administrador' })).toHaveCount(0);
 await expect(page.getByRole('dialog')).toContainText('Puede consultar miembros, inscribir, renovar');
 await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
 // Other administrators of the gym are not listed, and none can be edited from here.
 await expect(page.getByRole('button', { name: /^Editar a Carlos/ })).toHaveCount(0);
 await expect(page.locator('tbody')).toContainText('Tu cuenta');
});

test('owner creates a gym administrator who only sees that gym', async ({ page }) => {
 await start(page, '10000002');
 await navigate(page, 'Usuarios');
 await expect(page.locator('tbody')).toContainText('Carlos Medina');
 await page.getByRole('button', { name: 'Nuevo usuario', exact: true }).click();
 await page.getByLabel('Nombre completo', { exact: true }).fill('Admin Norte');
 await page.getByLabel('DNI', { exact: true }).fill('30000001');
 await page.getByRole('radio', { name: 'Administrador', exact: true }).click();
 await page.getByRole('radio', { name: 'Norte Gym', exact: true }).click();
 await page.getByRole('button', { name: 'Guardar usuario' }).click();
 await expect(page.locator('tbody')).toContainText('Norte Gym · todas las sedes');
 await logout(page);
 await signIn(page, '30000001');
 await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
 await expect(page.locator('.tenant-brand-link')).toContainText('Norte Gym');
 await expect(page.getByRole('button', { name: 'Información de sede', exact: true })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Cambiar sede', exact: true })).toHaveCount(0);
});

test('day pass prices: admin edits their gym, reception only charges, superadmin only reads', async ({ page }) => {
 await start(page, '10000005');
 await navigate(page, 'Tarifas');
 await page.getByLabel('Pase del día (S/)').fill('18.50');
 await page.getByRole('button', { name: 'Guardar tarifas' }).click();
 await navigate(page, 'Control de acceso');
 await expect(page.getByRole('button', { name: /Pase del día/ })).toContainText('18.50');
 await logout(page);
 await signIn(page, '10000003');
 await expect(page.getByRole('heading', { name: 'Control de acceso', exact: true })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Configuración', exact: true })).toHaveCount(0);
 await page.goto('/#pricing');
 await expect(page.getByRole('heading', { name: 'Control de acceso', exact: true })).toBeVisible();
 await expect(page.getByRole('button', { name: /Pase del día/ })).toContainText('18.50');
 await logout(page);
 await signIn(page, '10000001');
 await page.getByRole('button', { name: 'Consultar Grupo Atlas' }).click();
 await navigate(page, 'Tarifas');
 await expect(page.getByLabel('Pase del día (S/)')).toBeDisabled();
 await expect(page.getByRole('button', { name: 'Guardar tarifas' })).toHaveCount(0);
 await navigate(page, 'Control de acceso');
 await expect(page.getByRole('button', { name: /Pase del día/ })).toHaveCount(0);
});

test('custom brand color: pick on the color area or type a hexadecimal', async ({ page }) => {
 await start(page, '10000002');
 await navigate(page, 'Identidad');
 const trigger = page.getByRole('button', { name: /^Color personalizado/ });
 await trigger.click();
 const panel = page.getByRole('dialog', { name: 'Color personalizado' });
 const before = await trigger.innerText();
 const area = panel.locator('.react-colorful__saturation');
 const box = (await area.boundingBox())!;
 await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
 await expect(trigger).not.toContainText(before);
 await panel.getByLabel('Código hexadecimal').fill('e91e63');
 await expect(trigger).toContainText('#E91E63');
 await panel.getByLabel('Código hexadecimal').fill('0af');
 await expect(trigger).toContainText('#00AAFF');
 await page.keyboard.press('Escape');
 await expect(panel).toHaveCount(0);
 await expect(page.getByRole('heading', { name: /^Identidad de Atlas/ })).toBeVisible();
 expect(await page.locator('.brand-preview').evaluate((element) => getComputedStyle(element).getPropertyValue('--tenant-primary'))).toBe('#00aaff');
 await page.getByRole('button', { name: 'Guardar identidad' }).click();
 expect(await page.locator('.app-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--tenant-primary'))).toBe('#00aaff');
});

test('every user can see their profile, edit non-sensitive data and change their password', async ({ page }) => {
 await start(page, '10000003');
 await page.getByRole('button', { name: 'Mi perfil', exact: true }).click();
 const dialog = page.getByRole('dialog', { name: 'Mi perfil' });
 await expect(dialog).toContainText('10000003');
 await expect(dialog).toContainText('Recepción');
 await expect(dialog).toContainText('Atlas Fitness · Miraflores');
 await expect(dialog.getByRole('textbox', { name: 'DNI' })).toHaveCount(0);
 await dialog.getByLabel('Nombre completo').fill('Luis Rojas Actualizado');
 await dialog.getByLabel('Celular (+51)').fill('987654321');
 await dialog.getByRole('button', { name: 'Guardar datos' }).click();
 await expect(dialog.getByRole('status')).toContainText('Datos actualizados');
 await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await expect(page.getByRole('button', { name: 'Mi perfil', exact: true })).toContainText('Luis Rojas Actualizado');
 await page.getByRole('button', { name: 'Mi perfil', exact: true }).click();
 await expect(dialog.getByLabel('Celular (+51)')).toHaveValue('987654321');
 const change = async (current: string, next: string, confirm: string): Promise<void> => {
  await dialog.getByLabel('Contraseña actual').fill(current);
  await dialog.getByLabel(/^Nueva contraseña/).fill(next);
  await dialog.getByLabel('Repetir nueva contraseña').fill(confirm);
  await dialog.getByRole('button', { name: 'Cambiar contraseña' }).click();
 };
 await change('equivocada', 'NuevaClave123', 'NuevaClave123');
 await expect(dialog.getByRole('alert')).toContainText('actual no es correcta');
 await change('Pulso2026!', 'corta', 'corta');
 await expect(dialog.getByRole('alert')).toContainText('al menos 8');
 await change('Pulso2026!', 'Pulso2026!', 'Pulso2026!');
 await expect(dialog.getByRole('alert')).toContainText('distinta de la actual');
 await change('Pulso2026!', 'NuevaClave123', 'OtraDistinta1');
 await expect(dialog.getByRole('alert')).toContainText('no coinciden');
 await change('Pulso2026!', 'NuevaClave123', 'NuevaClave123');
 await expect(dialog.getByRole('status').filter({ hasText: 'Contraseña actualizada' })).toBeVisible();
 await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await logout(page);
 await signIn(page, '10000003');
 await expect(page.getByRole('alert')).toContainText('incorrectos');
 await page.locator('input[autocomplete="current-password"]').fill('NuevaClave123');
 await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
 await expect(page.getByRole('heading', { name: 'Control de acceso', exact: true })).toBeVisible();
});

test('the superadmin also has a profile', async ({ page }) => {
 await start(page, '10000001');
 await page.getByRole('button', { name: 'Mi perfil', exact: true }).click();
 const dialog = page.getByRole('dialog', { name: 'Mi perfil' });
 await expect(dialog).toContainText('Superadmin');
 await expect(dialog).toContainText('Todas las cuentas de clientes');
 await dialog.getByLabel('Nombre completo').fill('Equipo Atmósfera Soporte');
 await dialog.getByRole('button', { name: 'Guardar datos' }).click();
 await expect(dialog.getByRole('status')).toContainText('Datos actualizados');
});

test('the free plan is noted for the team and extras need an explicit agreement', async ({ page }) => {
 await start(page, '10000001');
 // The business rule is written on the superadmin screen.
 await expect(page.locator('.plan-note')).toContainText('Pulso es gratis');
 await expect(page.locator('.plan-note')).toContainText('1 gimnasio y hasta 3 sedes por gimnasio');
 // Each client shows whether it is inside the plan: Atlas has 3 gyms, Central has 1 gym with 1 branch.
 const atlas = page.locator('.client-card').filter({ hasText: 'Grupo Atlas' });
 const central = page.locator('.client-card').filter({ hasText: 'Gimnasio Central' }).first();
 await expect(atlas.locator('.client-chips .badge').first()).toContainText('2 gimnasios extras');
 await expect(central.locator('.client-chips .badge').first()).toContainText('Plan gratuito');
 // Branches 2 and 3 are free; the 4th needs the confirmation.
 const addBranch = async (name: string): Promise<void> => {
  await central.getByRole('button', { name: 'Añadir sede a Gimnasio Central' }).click();
  await page.getByLabel('Nombre de la sede', { exact: true }).fill(name);
 };
 for (const name of ['Sede 2', 'Sede 3']) {
  await addBranch(name);
  await expect(page.getByRole('note')).toHaveCount(0);
  await page.getByRole('button', { name: 'Guardar sede', exact: true }).click();
 }
 await expect(central.locator('.client-chips .badge').first()).toContainText('Plan gratuito');
 await addBranch('Sede 4');
 await expect(page.getByRole('note')).toContainText('Supera el plan gratuito: 1 sede extra');
 await page.getByLabel('Ya lo acordé con el cliente').check();
 await page.getByRole('button', { name: 'Guardar sede', exact: true }).click();
 await expect(central.locator('.client-chips .badge').first()).toContainText('1 sede extra');
 // Owners and admins are told where the limit comes from, and cannot add gyms or branches themselves.
 await logout(page);
 await signIn(page, '10000004');
 await navigate(page, 'Gimnasios y reglas');
 await expect(page.locator('.footnote')).toContainText('Plan gratuito: 1 gimnasio y hasta 3 sedes por gimnasio');
 await expect(page.getByRole('button', { name: /Añadir (gimnasio|sede)/ })).toHaveCount(0);
});
