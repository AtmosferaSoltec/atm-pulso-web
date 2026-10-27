import { test, expect, type Page } from '@playwright/test';
async function login(page: Page, profile = 'Propietario · Red de gimnasios'): Promise<void> {
 await page.goto('/');
 await page.getByRole('button', { name: new RegExp(profile.replaceAll('·', '·')) }).click();
 await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
 await expect(page.getByRole('heading', { name: profile.startsWith('Recepción') ? 'Control de acceso' : 'Resumen del gimnasio', exact: true })).toBeVisible();
}
async function navigate(page: Page, name: string): Promise<void> {
 const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
 if (await menu.isVisible()) await menu.click();
 const nav = page.getByRole('navigation');
 const target = nav.getByRole('button', { name, exact: true });
 if (!(await target.isVisible())) await nav.getByRole('button', { name: 'Configuración', exact: true }).click();
 await target.click();
}
async function branch(page: Page, name: string): Promise<void> {
 await page.getByRole('button', { name: 'Cambiar sede', exact: true }).click();
 await page.getByRole('dialog').getByRole('button', { name: new RegExp(name) }).click();
}
async function access(page: Page, dni: string, allowed: boolean): Promise<void> {
 await page.getByRole('textbox', { name: 'DNI del miembro' }).fill(dni);
 await page.getByRole('button', { name: 'Verificar acceso', exact: true }).click();
 await expect(page.getByRole('heading', { name: allowed ? 'Acceso permitido' : 'Acceso no permitido', exact: true })).toBeVisible();
}
test('login validation, password visibility, recovery, and logout', async ({ page }) => {
 await page.goto('/#members');
 await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
 await page.getByLabel('DNI', { exact: true }).fill('10000002');
 await page.locator('input[autocomplete="current-password"]').fill('invalid');
 await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
 await expect(page.getByRole('alert')).toContainText('incorrectos');
 await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
 await expect(page.locator('input[autocomplete="current-password"]')).toHaveAttribute('type', 'text');
 await page.getByRole('button', { name: /Propietario · Red/ }).click();
 await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
 await page.getByRole('button', { name: 'Cerrar sesión' }).click();
 await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});
test('network, same gym, branch-only, expired, and unknown access', async ({ page }) => {
 await login(page);
 await navigate(page, 'Control de acceso');
 await access(page, '76381249', true);
 await access(page, '75819362', false);
 await expect(page.getByRole('status')).toContainText('no permite ingresar a esta sede');
 await branch(page, 'Atlas Fitness · Barranco');
 await access(page, '72941856', true);
 await branch(page, 'Norte Gym · Los Olivos');
 await access(page, '76381249', true);
 await access(page, '72941856', false);
 await access(page, '75819362', true);
 await access(page, '70294618', false);
 await expect(page.locator('.access-result')).toContainText('venció');
 await access(page, '80123456', false);
 await expect(page.locator('.access-result')).toContainText('DNI no registrado');
 await branch(page, 'Atlas Fitness · Miraflores');
 await expect(page.locator('.log-entry')).toHaveCount(2);
});
test('directory visibility and training access are independent owner rules', async ({ page }) => {
 await login(page);
 await navigate(page, 'Gimnasios y reglas');
 await page.getByLabel('Compartir directorio de miembros', { exact: false }).uncheck();
 await page.getByRole('button', { name: 'Guardar reglas' }).click();
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(3);
 await branch(page, 'Norte Gym · Los Olivos');
 await expect(page.locator('tbody tr')).toHaveCount(2);
 await navigate(page, 'Control de acceso');
 await access(page, '76381249', true);
 await navigate(page, 'Gimnasios y reglas');
 await page.getByLabel('Permitir acceso entre sedes', { exact: false }).uncheck();
 await page.getByRole('button', { name: 'Guardar reglas' }).click();
 await navigate(page, 'Control de acceso');
 await access(page, '76381249', false);
 await navigate(page, 'Gimnasios y reglas');
 await page.getByLabel('Compartir directorio de miembros', { exact: false }).check();
 await page.getByRole('button', { name: 'Guardar reglas' }).click();
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(8);
 await navigate(page, 'Control de acceso');
 await access(page, '76381249', false);
});
test('single-site owner stays isolated from the network', async ({ page }) => {
 await login(page, 'Propietario · Una sola sede');
 await expect(page.getByRole('button', { name: 'Cambiar sede', exact: true })).toHaveCount(0);
 await page.getByRole('button', { name: 'Información de sede', exact: true }).click();
 await expect(page.getByRole('dialog')).toContainText('única sede');
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(2);
 await expect(page.locator('tbody')).not.toContainText('Camila');
 await navigate(page, 'Control de acceso');
 await access(page, '80123456', true);
 await access(page, '76381249', false);
 await navigate(page, 'Gimnasios y reglas');
 await expect(page.getByRole('heading', { name: 'Operación de una sola sede' })).toBeVisible();
});
test('staff can switch assigned locations but cannot edit account rules', async ({ page }) => {
 await login(page, 'Recepción · 2 sedes asignadas');
 await expect(page.getByRole('button', { name: 'Gimnasios y reglas', exact: true })).toHaveCount(0);
 await page.getByRole('button', { name: 'Cambiar sede', exact: true }).click();
 await expect(page.getByRole('dialog').locator('.branch-option')).toHaveCount(2);
 await page.getByRole('dialog').getByRole('button', { name: /Atlas Fitness · Barranco/ }).click();
 await page.goto('/#organization');
 await expect(page.getByRole('heading', { name: 'Control de acceso', exact: true })).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Reglas de la cuenta' })).toHaveCount(0);
});
test('custom enrollment, discount, editable renewal, and collection branch', async ({ page }, testInfo) => {
 await login(page);
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 await page.getByLabel('Nombre completo').fill('Andrea Prueba');
 await page.getByLabel('DNI', { exact: true }).fill('12345678');
 await page.getByLabel('Celular (+51)', { exact: true }).fill('999222333');
 await page.getByLabel('Duración', { exact: true }).fill('4');
 await page.getByLabel('Importe acordado (S/)', { exact: false }).fill('320');
 await page.getByLabel('Descuento (%)', { exact: false }).fill('10');
 await expect(page.locator('.enrollment-total strong')).toContainText('288.00');
 await expect(page.getByLabel('Fecha de vencimiento')).toHaveValue('26 feb. 2027');
 await page.getByRole('button', { name: 'Guardar y ver ficha' }).click();
 await expect(page.getByRole('dialog')).toContainText('4 meses');
 await expect(page.getByRole('dialog')).toContainText('288.00');
 await expect(page.getByRole('dialog')).toContainText('10%');
 await page.emulateMedia({ media: 'print' });
 await expect(page.locator('.no-print')).not.toBeVisible();
 await page.pdf({ path: testInfo.outputPath('membership.pdf'), format: 'A4' });
 await page.emulateMedia({ media: 'screen' });
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await branch(page, 'Norte Gym · Los Olivos');
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Ver ficha de Andrea Prueba' }).click();
 await page.getByRole('button', { name: 'Renovar membresía' }).click();
 await page.getByRole('button', { name: /2 meses/ }).click();
 await page.getByLabel('Importe acordado (S/)', { exact: false }).fill('150');
 await expect(page.getByLabel('Descuento (%)', { exact: false })).toHaveValue('0');
 await page.getByRole('button', { name: 'Registrar renovación' }).click();
 await expect(page.getByRole('dialog')).toContainText('150.00');
 await expect(page.getByRole('dialog')).toContainText('26 abr. 2027');
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await navigate(page, 'Pagos e ingresos');
 const collectedRow = page.locator('tbody tr').filter({ hasText: 'Andrea Prueba' });
 await expect(collectedRow).toHaveCount(1);
 await expect(collectedRow).toContainText('150.00');
 await branch(page, 'Atlas Fitness · Miraflores');
 await expect(page.locator('tbody tr').filter({ hasText: 'Andrea Prueba' })).toContainText('288.00');
 await navigate(page, 'Control de acceso');
 await access(page, '12345678', true);
});
test('member filters, contact edits, duplicate DNI and payment export', async ({ page }) => {
 await login(page);
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: /^Vencidos/ }).click();
 await expect(page.locator('tbody tr')).toHaveCount(1);
 await expect(page.getByRole('link', { name: /Avisar a Mateo/ })).toHaveAttribute('href', /^https:\/\/wa.me\//);
 await page.getByRole('button', { name: 'Ver ficha de Mateo Ramírez' }).click();
 await page.getByRole('button', { name: 'Editar datos' }).click();
 await page.getByLabel('Nombre completo').fill('Mateo Actualizado');
 await page.getByRole('button', { name: 'Guardar datos' }).click();
 await expect(page.getByRole('heading', { name: 'Mateo Actualizado' })).toBeVisible();
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await page.getByRole('button', { name: /^Todos/ }).click();
 await page.getByRole('textbox', { name: 'Buscar miembro por nombre o DNI' }).fill('70294618');
 await expect(page.locator('tbody tr')).toHaveCount(1);
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 await page.getByLabel('Nombre completo').fill('Duplicado Prueba');
 await page.getByLabel('DNI', { exact: true }).fill('70294618');
 await page.getByLabel('Celular (+51)', { exact: true }).fill('999222333');
 await page.getByRole('button', { name: 'Guardar y ver ficha' }).click();
 await expect(page.getByRole('alert')).toContainText('ya está registrado');
 await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await navigate(page, 'Pagos e ingresos');
 const download = page.waitForEvent('download');
 await page.getByRole('button', { name: 'Exportar CSV' }).click();
 expect((await download).suggestedFilename()).toBe('pagos.csv');
 await page.getByRole('radiogroup', { name: 'Filtrar por medio de pago' }).getByRole('radio', { name: 'Plin' }).click();
 await expect(page.locator('tbody tr')).toHaveCount(0);
 await expect(page.getByText('No hay pagos con este filtro en la sede seleccionada.')).toBeVisible();
});
test('mobile login, navigation, dialogs and all screens fit the viewport', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 await login(page);
 for (const name of ['Miembros', 'Control de acceso', 'Pagos e ingresos', 'Gimnasios y reglas', 'Resumen']) {
  await navigate(page, name);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 }
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 expect(await page.getByRole('dialog').evaluate(element => element.getBoundingClientRect().width <= innerWidth)).toBe(true);
 await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await page.getByRole('button', { name: 'Abrir menú' }).click();
 await branch(page, 'Norte Gym · Los Olivos');
 await expect(page.locator('.location-label')).toHaveText('Norte Gym · Los Olivos');
});

test('future enrollment remains scheduled and does not grant premature access', async ({ page }) => {
 await login(page, 'Propietario · Una sola sede');
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 await page.getByLabel('Nombre completo').fill('Miembro Futuro');
 await page.getByLabel('DNI', { exact: true }).fill('12349876');
 await page.getByLabel('Celular (+51)', { exact: true }).fill('999333444');
 await page.getByRole('button', { name: /^Fecha de inicio/ }).click();
 await page.getByRole('button', { name: 'Ir al mes siguiente' }).click();
 await page.getByRole('button', { name: /15 de noviembre/ }).click();
 await expect(page.getByRole('button', { name: /^Fecha de inicio/ })).toContainText('15 nov. 2026');
 await page.getByRole('radio', { name: 'Días' }).click();
 await page.getByLabel('Duración', { exact: true }).fill('45');
 await expect(page.getByLabel('Acceso de la membresía')).toBeDisabled();
 await page.getByRole('button', { name: 'Guardar y ver ficha' }).click();
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: /^Por iniciar/ }).click();
 await expect(page.locator('tbody tr')).toHaveCount(1);
 await expect(page.locator('tbody')).toContainText('Miembro Futuro');
 await navigate(page, 'Control de acceso');
 await access(page, '12349876', false);
 await expect(page.locator('.access-result')).toContainText('todavía no está vigente');
});

test('reception can verify several DNIs using only the numeric keypad', async ({ page }) => {
 await login(page, 'Recepción · 2 sedes asignadas');
 const dni = page.getByRole('textbox', { name: 'DNI del miembro' });
 await expect(dni).toBeFocused();
 await page.keyboard.type('76381249');
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading', { name: 'Acceso permitido', exact: true })).toBeVisible();
 await expect(dni).toHaveValue('');
 await expect(dni).toBeFocused();
 await page.keyboard.type('70294618');
 await expect(page.getByRole('heading', { name: 'Acceso permitido', exact: true })).toHaveCount(0);
 await page.keyboard.press('Enter');
 await expect(page.locator('.access-result')).toContainText('venció');
 await expect(page.locator('.log-entry')).toHaveCount(2);
});

test('date picker closes with Escape without closing the form and can pick today', async ({ page }) => {
 await login(page);
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 const trigger = page.getByRole('button', { name: /^Fecha de inicio/ });
 await trigger.click();
 await expect(page.getByRole('dialog', { name: 'Fecha de inicio' })).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog', { name: 'Fecha de inicio' })).toHaveCount(0);
 await expect(page.getByRole('dialog', { name: 'Registrar miembro' })).toBeVisible();
 await trigger.click();
 await page.getByRole('button', { name: 'Hoy', exact: true }).click();
 await expect(trigger).toContainText('26 oct. 2026');
 await page.getByRole('radio', { name: 'Efectivo' }).click();
 await expect(page.getByRole('radio', { name: 'Efectivo' })).toHaveAttribute('aria-checked', 'true');
});
