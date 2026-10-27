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
 await page.getByRole('textbox', { name: 'Documento del miembro' }).fill(dni);
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
 await expect(page.locator('.access-result')).toContainText('Documento no registrado');
 await branch(page, 'Atlas Fitness · Miraflores');
 await expect(page.locator('.log-entry')).toHaveCount(2);
});
test('the member directory is always shared; the gym administrator decides if its members roam between branches', async ({ page }) => {
 await login(page);
 // Directory: every member of the account shows up at any branch, with no setting to turn that off.
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(9);
 await branch(page, 'Norte Gym · Los Olivos');
 await expect(page.locator('tbody tr')).toHaveCount(9);
 await page.getByRole('button', { name: 'Solo inscritos en Los Olivos' }).click();
 await expect(page.locator('tbody tr')).toHaveCount(2);
 // Roaming: with the rule on, a network member enters other gyms; switching it off keeps them at home.
 await navigate(page, 'Control de acceso');
 await access(page, '76381249', true);
 await navigate(page, 'Gimnasios y reglas');
 await expect(page.getByLabel('Compartir directorio')).toHaveCount(0);
 await expect(page.getByText('Alcance sugerido')).toHaveCount(0);
 await page.getByLabel('Acceso entre sedes de Atlas Fitness').uncheck();
 await expect(page.getByRole('status').filter({ hasText: 'desactivado en Atlas Fitness' })).toBeVisible();
 await navigate(page, 'Control de acceso');
 await access(page, '76381249', false);
 await expect(page.locator('.access-result')).toContainText('no permite ingresar a esta sede');
 // The directory stays shared even then.
 await navigate(page, 'Miembros');
 await expect(page.locator('tbody tr')).toHaveCount(2);
 await page.getByRole('button', { name: 'Solo inscritos en Los Olivos' }).click();
 await expect(page.locator('tbody tr')).toHaveCount(9);
 await navigate(page, 'Gimnasios y reglas');
 await page.getByLabel('Acceso entre sedes de Atlas Fitness').check();
 await navigate(page, 'Control de acceso');
 await access(page, '76381249', true);
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
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 await page.getByLabel('Nombre completo').fill('Andrea Prueba');
 await page.getByLabel('DNI', { exact: true }).fill('12345678');
 await page.getByLabel('Celular (+51)', { exact: true }).fill('999222333');
 await expect(page.getByRole('radiogroup', { name: 'Unidad' })).toHaveCount(0);
 await expect(page.getByLabel('Descuento')).toHaveCount(0);
 await expect(page.getByLabel('Importe acordado')).toHaveCount(0);
 await page.getByLabel('Duración (meses)', { exact: true }).fill('4');
 await page.getByLabel('Importe (S/)', { exact: true }).fill('288');
 await expect(page.locator('.enrollment-total strong')).toContainText('288.00');
 await expect(page.getByLabel('Fecha de vencimiento')).toHaveValue('26 feb. 2027');
 await page.getByRole('button', { name: 'Guardar y ver ficha' }).click();
 await expect(page.getByRole('dialog')).toContainText('4 meses');
 await expect(page.getByRole('dialog')).toContainText('288.00');
 await expect(page.getByRole('dialog')).not.toContainText('Descuento');
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
 await page.getByLabel('Importe (S/)', { exact: true }).fill('150');
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
 await page.getByRole('textbox', { name: 'Buscar miembro por nombre o documento' }).fill('70294618');
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
 await page.getByRole('button', { name: 'Descargar' }).click();
 expect((await download).suggestedFilename()).toBe('pagos.csv');
 await page.getByRole('radiogroup', { name: 'Filtrar por medio de pago' }).getByRole('radio', { name: 'Transferencia' }).click();
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
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 expect(await page.getByRole('dialog').evaluate(element => element.getBoundingClientRect().width <= innerWidth)).toBe(true);
 await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await page.getByRole('button', { name: 'Abrir menú' }).click();
 await branch(page, 'Norte Gym · Los Olivos');
 await expect(page.locator('.location-label')).toHaveText('Norte Gym · Los Olivos');
});

test('future enrollment remains scheduled and does not grant premature access', async ({ page }) => {
 await login(page, 'Propietario · Una sola sede');
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 await page.getByLabel('Nombre completo').fill('Miembro Futuro');
 await page.getByLabel('DNI', { exact: true }).fill('12349876');
 await page.getByLabel('Celular (+51)', { exact: true }).fill('999333444');
 await page.getByRole('button', { name: /^Fecha de inicio/ }).click();
 await page.getByRole('button', { name: 'Ir al mes siguiente' }).click();
 await page.getByRole('button', { name: /15 de noviembre/ }).click();
 await expect(page.getByRole('button', { name: /^Fecha de inicio/ })).toContainText('15 nov. 2026');
 await expect(page.getByRole('radiogroup', { name: 'Acceso de la membresía' })).toHaveCount(0);
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
 const dni = page.getByRole('textbox', { name: 'Documento del miembro' });
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
 await navigate(page, 'Miembros');
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

test('demo shortcuts verify every kind of access outcome', async ({ page }) => {
 await login(page);
 await navigate(page, 'Control de acceso');
 const result = page.locator('.access-result');
 const cases: [string, boolean, string][] = [
  ['Vigente', true, 'vigente hasta'],
  ['Por vencer', true, 'vigente hasta'],
  ['Vencido', false, 'venció'],
  ['Por iniciar', false, 'todavía no está vigente'],
  ['Otra sede', false, 'no permite ingresar a esta sede'],
  ['No registrado', false, 'Documento no registrado'],
 ];
 for (const [label, allowed, text] of cases) {
  await page.getByRole('button', { name: `Probar caso: ${label}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: allowed ? 'Acceso permitido' : 'Acceso no permitido', exact: true })).toBeVisible();
  await expect(result).toContainText(text);
 }
 await expect(page.locator('.log-entry')).toHaveCount(6);
});

test('new member can only be added from the members module', async ({ page }) => {
 await login(page);
 const add = page.getByRole('button', { name: 'Nuevo miembro', exact: true });
 await expect(add).toHaveCount(0);
 await navigate(page, 'Control de acceso');
 await expect(add).toHaveCount(0);
 await navigate(page, 'Pagos e ingresos');
 await expect(add).toHaveCount(0);
 await navigate(page, 'Miembros');
 await expect(add).toBeVisible();
});

test('new members default to DNI, can search it, and foreigners register with a carné de extranjería', async ({ page }) => {
 await login(page);
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 const types = page.getByRole('radiogroup', { name: 'Tipo de documento' });
 await expect(types.getByRole('radio', { name: 'DNI' })).toHaveAttribute('aria-checked', 'true');
 await page.getByRole('button', { name: 'Buscar DNI' }).click();
 await expect(page.getByRole('alert')).toContainText('DNI válido');
 await page.getByLabel('DNI', { exact: true }).fill('45678912');
 await page.getByRole('button', { name: 'Buscar DNI' }).click();
 await expect(page.getByLabel('Nombre completo')).not.toHaveValue('');
 await types.getByRole('radio', { name: 'Carné de extranjería' }).click();
 await expect(page.getByLabel('DNI', { exact: true })).toHaveCount(0);
 await expect(page.getByLabel('Carné de extranjería', { exact: true })).toHaveValue('');
 await page.getByLabel('Carné de extranjería', { exact: true }).fill('123456789');
 await page.getByRole('button', { name: 'Buscar Carné de extranjería' }).click();
 await expect(page.getByLabel('Nombre completo')).toHaveValue(/ .+/);
 await page.getByLabel('Nombre completo').fill('Daniela Venezolana');
 await page.getByLabel('Celular (+51)', { exact: true }).fill('999444555');
 await page.getByRole('button', { name: 'Guardar y ver ficha' }).click();
 await expect(page.getByRole('dialog')).toContainText('CE 123456789');
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await expect(page.locator('tbody tr').filter({ hasText: 'Daniela Venezolana' })).toContainText('CE 123456789');
 await navigate(page, 'Control de acceso');
 await page.getByRole('textbox', { name: 'Documento del miembro' }).fill('123456789');
 await page.getByRole('button', { name: 'Verificar acceso', exact: true }).click();
 await expect(page.getByRole('heading', { name: 'Acceso permitido', exact: true })).toBeVisible();
});

test('membership access cards are compact', async ({ page }) => {
 await login(page);
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 const card = page.getByRole('radiogroup', { name: 'Acceso de la membresía' }).getByRole('radio').first();
 expect((await card.boundingBox())!.height).toBeLessThanOrEqual(70);
});

test('membership access shows the enrollment branch and lets you drop branches from a gym or network promo', async ({ page }) => {
 await login(page);
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 const scope = page.getByRole('radiogroup', { name: 'Acceso de la membresía' });
 await expect(scope.getByRole('radio', { name: /Solo sede de inscripción/ })).toContainText('Miraflores');
 // New memberships open only the enrollment branch; picking a wider access lists the branches, all selected.
 const picker = page.getByRole('group', { name: 'Sedes con acceso' });
 await expect(scope.getByRole('radio', { name: /Solo sede de inscripción/ })).toHaveAttribute('aria-checked', 'true');
 await expect(picker).toHaveCount(0);
 await scope.getByRole('radio', { name: /Toda la red del propietario/ }).click();
 await expect(picker.getByRole('checkbox')).toHaveCount(4);
 await expect(picker.getByRole('checkbox', { checked: true })).toHaveCount(4);
 await expect(picker.getByRole('checkbox', { name: 'Atlas Fitness · Miraflores' })).toBeDisabled();
 // A gym-only promo lists just that gym's branches, also all selected.
 await scope.getByRole('radio', { name: /Sedes del mismo gimnasio/ }).click();
 await expect(picker.getByRole('checkbox')).toHaveCount(2);
 await expect(page.getByText('2 de 2 sedes con acceso')).toBeVisible();
 // Back to the network, drop Norte Gym and keep the rest.
 await scope.getByRole('radio', { name: /Toda la red del propietario/ }).click();
 await picker.getByRole('checkbox', { name: 'Norte Gym · Los Olivos' }).click();
 await expect(page.getByText('3 de 4 sedes con acceso')).toBeVisible();
 await page.getByLabel('DNI', { exact: true }).fill('12345678');
 await page.getByLabel('Celular (+51)', { exact: true }).fill('999222333');
 await page.getByLabel('Nombre completo').fill('Promo Tres Sedes');
 await page.getByRole('button', { name: 'Guardar y ver ficha' }).click();
 await expect(page.getByRole('dialog')).toContainText('Atlas Fitness · Miraflores, Atlas Fitness · Barranco, Distrito Fuerza · San Miguel');
 await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await navigate(page, 'Control de acceso');
 await access(page, '12345678', true);
 await branch(page, 'Atlas Fitness · Barranco');
 await access(page, '12345678', true);
 await branch(page, 'Norte Gym · Los Olivos');
 await access(page, '12345678', false);
 await expect(page.locator('.access-result')).toContainText('no permite ingresar a esta sede');
});

test('dialogs ignore backdrop clicks and drags that end outside, and close with the X or Cancel', async ({ page }) => {
 await login(page);
 await navigate(page, 'Miembros');
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 const dialog = page.getByRole('dialog', { name: 'Registrar miembro' });
 const field = page.getByLabel('Nombre completo');
 await field.fill('Seleccionando texto');
 const box = (await field.boundingBox())!;
 await page.mouse.move(box.x + 40, box.y + box.height / 2);
 await page.mouse.down();
 await page.mouse.move(4, 4, { steps: 8 });
 await page.mouse.up();
 await expect(dialog).toBeVisible();
 await page.mouse.click(4, 4);
 await expect(dialog).toBeVisible();
 await expect(field).toHaveValue('Seleccionando texto');
 await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
 await expect(dialog).toHaveCount(0);
 await page.getByRole('button', { name: 'Nuevo miembro', exact: true }).click();
 await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('payments open on today, offer this month, and label the date range', async ({ page }) => {
 await login(page);
 await navigate(page, 'Pagos e ingresos');
 const kpi = (label: string) => page.locator('.payment-metrics .metric').filter({ hasText: label }).locator('.metric-value');
 const period = page.getByRole('radiogroup', { name: 'Período' });
 // Only "Hoy" and "Este mes" exist, and the screen always opens on today.
 await expect(period.getByRole('radio')).toHaveCount(2);
 await expect(period.getByRole('radio', { name: 'Todo' })).toHaveCount(0);
 await expect(period.getByRole('radio', { name: 'Hoy' })).toHaveAttribute('aria-checked', 'true');
 await expect(page.getByText('Desde', { exact: true })).toBeVisible();
 await expect(page.getByText('Hasta', { exact: true })).toBeVisible();
 await expect(page.getByRole('button', { name: /^Desde: 26 oct\. 2026/ })).toBeVisible();
 await expect(page.getByRole('button', { name: /^Hasta: 26 oct\. 2026/ })).toBeVisible();
 // Nobody has paid at Miraflores today yet.
 await expect(page.locator('tbody tr')).toHaveCount(0);
 await expect(kpi('Total cobrado')).toHaveText(/0\.00/);
 await expect(kpi('Ticket promedio')).toHaveText('—');
 // This month keeps the October payment.
 await period.getByRole('radio', { name: 'Este mes' }).click();
 await expect(period.getByRole('radio', { name: 'Este mes' })).toHaveAttribute('aria-checked', 'true');
 await expect(page.locator('tbody tr')).toHaveCount(1);
 await expect(page.locator('tbody')).toContainText('Diego Mendoza');
 await expect(kpi('Total cobrado')).toHaveText(/100\.00/);
 await expect(kpi('Pagos')).toHaveText('1');
 await expect(kpi('Ticket promedio')).toHaveText(/100\.00/);
 // A custom end date drops the highlight; "Volver a hoy" restores today.
 await page.getByRole('button', { name: /^Hasta/ }).click();
 await page.getByRole('button', { name: 'Hoy', exact: true }).click();
 await expect(period.getByRole('radio', { checked: true })).toHaveCount(0);
 await page.getByRole('button', { name: 'Volver a hoy' }).click();
 await expect(period.getByRole('radio', { name: 'Hoy' })).toHaveAttribute('aria-checked', 'true');
 await expect(page.getByRole('button', { name: 'Volver a hoy' })).toHaveCount(0);
 // The method filter combines with the dates.
 await period.getByRole('radio', { name: 'Este mes' }).click();
 await page.getByRole('radiogroup', { name: 'Filtrar por medio de pago' }).getByRole('radio', { name: 'Tarjeta' }).click();
 await expect(page.locator('tbody tr')).toHaveCount(0);
 await expect(page.getByText('No hay pagos con este filtro en la sede seleccionada.')).toBeVisible();
});

test('reception sees payments without the KPI summary', async ({ page }) => {
 await login(page, 'Recepción · 2 sedes asignadas');
 await navigate(page, 'Pagos');
 await expect(page.locator('.payment-metrics')).toHaveCount(0);
 await expect(page.getByRole('radiogroup', { name: 'Período' })).toBeVisible();
});

test('a day pass is paid and lets the person in, with no data required', async ({ page }) => {
 await login(page);
 await navigate(page, 'Control de acceso');
 await page.getByRole('button', { name: /Pase del día/ }).click();
 const dialog = page.getByRole('dialog', { name: 'Pase del día' });
 await expect(dialog).toContainText('20.00');
 await expect(dialog.getByRole('radio', { name: 'Efectivo' })).toHaveAttribute('aria-checked', 'true');
 await dialog.getByRole('button', { name: /^Cobrar/ }).click();
 await expect(dialog).toHaveCount(0);
 await expect(page.getByRole('heading', { name: 'Acceso permitido', exact: true })).toBeVisible();
 await expect(page.locator('.access-result')).toContainText('D-000001');
 await expect(page.locator('.log-entry')).toHaveCount(1);
 await expect(page.locator('.log-entry')).toContainText('Pase del día');
 // It is a payment: it appears in Pagos (today) and counts toward the month.
 await navigate(page, 'Pagos e ingresos');
 await expect(page.locator('tbody tr')).toHaveCount(1);
 await expect(page.locator('tbody')).toContainText('D-000001');
 await expect(page.locator('tbody')).toContainText('Visitante');
 const kpi = (label: string) => page.locator('.payment-metrics .metric').filter({ hasText: label }).locator('.metric-value');
 await expect(kpi('Pases del día')).toHaveText('1');
 await expect(kpi('Total cobrado')).toHaveText(/20\.00/);
 await navigate(page, 'Resumen');
 await expect(page.getByRole('button', { name: /Ingresos del mes/ })).toContainText('120.00');
});

test('day pass customer data is optional and can be filled from a document search', async ({ page }) => {
 await login(page);
 await navigate(page, 'Control de acceso');
 await page.getByRole('button', { name: /Pase del día/ }).click();
 const dialog = page.getByRole('dialog', { name: 'Pase del día' });
 await expect(dialog.getByLabel('Nombre')).toHaveCount(0);
 await dialog.getByRole('button', { name: 'Agregar datos del cliente (opcional)' }).click();
 await dialog.getByLabel('DNI', { exact: true }).fill('45678912');
 await dialog.getByRole('button', { name: 'Buscar DNI' }).click();
 await expect(dialog.getByLabel('Nombre')).not.toHaveValue('');
 await dialog.getByRole('radio', { name: 'Yape/Plin' }).click();
 await dialog.getByRole('button', { name: /^Cobrar/ }).click();
 await navigate(page, 'Pagos e ingresos');
 await expect(page.locator('tbody tr')).toHaveCount(1);
 await expect(page.locator('tbody')).not.toContainText('Visitante');
 await expect(page.locator('tbody tr .subtle-pill')).toHaveText('Yape/Plin');
});

test('the owner sets the day pass price per gym and reception charges it', async ({ page }) => {
 await login(page);
 await navigate(page, 'Tarifas');
 await expect(page.getByLabel('Pase del día (S/)')).toHaveValue('20');
 await page.getByLabel('Pase del día (S/)').fill('25');
 await page.getByRole('button', { name: 'Guardar tarifas' }).click();
 await expect(page.getByRole('status')).toContainText('Tarifa actualizada');
 await navigate(page, 'Control de acceso');
 await expect(page.getByRole('button', { name: /Pase del día/ })).toContainText('25.00');
 // Another gym of the same owner keeps its own price.
 await branch(page, 'Norte Gym · Los Olivos');
 await expect(page.getByRole('button', { name: /Pase del día/ })).toContainText('15.00');
});

test('payments list is paginated with a page size picker, and totals are shown per payment method', async ({ page }) => {
 await login(page);
 await navigate(page, 'Control de acceso');
 for (let i = 0; i < 6; i += 1) {
  await page.getByRole('button', { name: /Pase del día/ }).click();
  await page.getByRole('dialog', { name: 'Pase del día' }).getByRole('button', { name: /^Cobrar/ }).click();
 }
 await navigate(page, 'Pagos e ingresos');
 const rows = page.locator('tbody tr');
 const pager = page.getByRole('navigation', { name: 'Paginación' });
 // Per-method totals under the KPIs: six cash passes of S/ 20.
 await expect(page.getByLabel('Total por medio de pago')).toContainText('Efectivo');
 await expect(page.getByLabel('Total por medio de pago').locator('.method-total').filter({ hasText: 'Efectivo' })).toContainText('120.00');
 await expect(page.getByLabel('Total por medio de pago').locator('.method-total').filter({ hasText: 'Tarjeta' })).toContainText('0.00');
 // Default size is 10, so a single page.
 await expect(rows).toHaveCount(6);
 await expect(pager).toContainText('Mostrando 1–6 de 6');
 await expect(pager.getByRole('radio', { name: '10' })).toHaveAttribute('aria-checked', 'true');
 // Five per page: two pages.
 await pager.getByRole('radio', { name: '5', exact: true }).click();
 await expect(rows).toHaveCount(5);
 await expect(pager).toContainText('Mostrando 1–5 de 6');
 await expect(pager.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
 await expect(pager.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
 await pager.getByRole('button', { name: 'Página 2' }).click();
 await expect(rows).toHaveCount(1);
 await expect(pager).toContainText('Mostrando 6–6 de 6');
 await expect(pager.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
 await pager.getByRole('button', { name: 'Página anterior' }).click();
 await expect(rows).toHaveCount(5);
 // Changing a filter returns to the first page.
 await pager.getByRole('button', { name: 'Página 2' }).click();
 await page.getByRole('radiogroup', { name: 'Filtrar por medio de pago' }).getByRole('radio', { name: 'Efectivo' }).click();
 await expect(pager.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
 await expect(rows).toHaveCount(5);
 await pager.getByRole('radio', { name: '25' }).click();
 await expect(rows).toHaveCount(6);
 await expect(pager.getByRole('button', { name: /Página \d/ })).toHaveCount(1);
});
