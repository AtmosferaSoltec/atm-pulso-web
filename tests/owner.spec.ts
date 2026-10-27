import { test, expect } from '@playwright/test';
import { catalogOf, createAccount, createStaff, enrollMember, isoDaysFromToday, PASSWORD, setMembershipPrices, uniqueDni } from './support/api';
import { navigate, signIn } from './support/ui';

test('the owner enrolls a member and gets the numbered receipt', async ({ page }) => {
  const account = await createAccount(['Sede Central']);
  await setMembershipPrices(account, [
    { months: 1, amount: '100.00' },
    { months: 3, amount: '270.00' },
  ]);
  const dni = uniqueDni();
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Nuevo miembro' }).click();
  await page.getByPlaceholder('8 dígitos').fill(dni);
  await page.getByPlaceholder('999999999').fill('955444333');
  await page.getByPlaceholder('Ej. Andrea García').fill('Andrea García Prueba');
  await page.getByRole('button', { name: /^3 meses/ }).click();
  await page.getByRole('button', { name: 'Guardar y ver boleta' }).click();

  const dialog = page.getByRole('dialog', { name: 'Boleta de membresía' });
  await expect(dialog.getByText('N.º R-000001')).toBeVisible();
  await expect(dialog.getByText('Andrea García Prueba')).toBeVisible();
  await expect(dialog.getByText('Membresía 3 meses')).toBeVisible();
  await expect(dialog.getByText('S/ 270.00')).toHaveCount(2);
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.getByText('Andrea García Prueba')).toBeVisible();
});

test('a duplicate document is refused with the server message', async ({ page }) => {
  const account = await createAccount();
  await setMembershipPrices(account, [{ months: 1, amount: '100.00' }]);
  const existing = await enrollMember(account.ownerToken, account.branches[0].id);
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Nuevo miembro' }).click();
  await page.getByPlaceholder('8 dígitos').fill(existing.dni);
  await page.getByPlaceholder('999999999').fill('955444333');
  await page.getByPlaceholder('Ej. Andrea García').fill('Otra Persona');
  await page.getByRole('button', { name: 'Guardar y ver boleta' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Este documento ya pertenece a un miembro.' })).toBeVisible();
});

test('the owner renews an expired member and can reprint the earlier receipt', async ({ page }) => {
  const account = await createAccount();
  await setMembershipPrices(account, [
    { months: 1, amount: '100.00' },
    { months: 2, amount: '190.00' },
  ]);
  const member = await enrollMember(account.ownerToken, account.branches[0].id, { months: 1, startsOn: isoDaysFromToday(-60) });
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: `Renovar a ${member.name}` }).click();
  await page.getByRole('button', { name: /^2 meses/ }).click();
  await page.getByRole('button', { name: 'Registrar renovación' }).click();
  const dialog = page.getByRole('dialog', { name: 'Boleta de membresía' });
  await expect(dialog.getByText('N.º R-000002')).toBeVisible();
  await dialog.getByRole('radio', { name: 'R-000001' }).click();
  await expect(dialog.getByText('N.º R-000001')).toBeVisible();
});

test('the member list is filtered and counted by the server', async ({ page }) => {
  const account = await createAccount();
  const branch = account.branches[0].id;
  const active = await enrollMember(account.ownerToken, branch, { months: 3, name: 'Activa Larga' });
  await enrollMember(account.ownerToken, branch, { months: 1, startsOn: isoDaysFromToday(-120), name: 'Vencida Antigua' });
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Miembros');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Vigentes (1)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vencidos (1)' })).toBeVisible();
  await page.getByRole('button', { name: 'Vencidos (1)' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByText('Vencida Antigua')).toBeVisible();
  await page.getByRole('button', { name: 'Todos (2)' }).click();
  await page.getByLabel('Buscar miembro por nombre o documento').fill(active.dni);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByText('Activa Larga')).toBeVisible();
});

test('payments show the totals of the filter and download the same rows as CSV', async ({ page }) => {
  const account = await createAccount();
  const branch = account.branches[0].id;
  await enrollMember(account.ownerToken, branch, { amount: '100.00', method: 'cash' });
  await enrollMember(account.ownerToken, branch, { amount: '190.50', method: 'yape_plin' });
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Pagos e ingresos');
  await expect(page.getByText('S/ 290.50').first()).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('radio', { name: 'Efectivo', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('radio', { name: 'Todos', exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar' }).click()]);
  expect(download.suggestedFilename()).toBe('pagos.csv');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const csv = Buffer.concat(chunks).toString('utf8');
  expect(csv).toContain('Boleta,Miembro,Documento,Plan,Importe,Medio de pago,Fecha');
  expect(csv.trim().split('\n')).toHaveLength(3);
});

test('the dashboard shows real figures, not samples', async ({ page }) => {
  const account = await createAccount();
  await signIn(page, account.ownerDni, PASSWORD);
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Vigentes\s*0/ })).toBeVisible();
  await expect(page.getByText('Nadie vence esta semana.')).toBeVisible();
  await enrollMember(account.ownerToken, account.branches[0].id, { months: 1, startsOn: isoDaysFromToday(-27), amount: '100.00' });
  await page.reload();
  await signIn(page, account.ownerDni, PASSWORD);
  await expect(page.getByRole('button', { name: /Vigentes\s*1/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Por vencer\s*1/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ingresos del mes\s*S\/\s*100\.00/ })).toBeVisible();
});

test('the gym prices, the day pass price and the identity are saved on the server', async ({ page }) => {
  const account = await createAccount();
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Tarifas');
  await page.getByRole('button', { name: 'Agregar tarifa' }).click();
  await page.getByLabel('Precio (S/)').first().fill('100');
  await page.getByRole('button', { name: 'Agregar tarifa' }).click();
  await page.getByLabel('Duración (meses)').nth(1).fill('2');
  await page.getByLabel('Precio (S/)').nth(1).fill('180');
  await page.getByLabel(/Pase del día/).fill('22.50');
  await page.getByRole('button', { name: 'Guardar tarifas' }).click();
  await expect(page.getByText('Tarifas actualizadas.')).toBeVisible();
  expect((await catalogOf(account.ownerToken)).gyms[0].membership_prices).toEqual([
    { months: 1, amount: '100.00' },
    { months: 2, amount: '180.00' },
  ]);
  await navigate(page, 'Identidad');
  await page.getByLabel('Nombre visible').fill('Fuerza Total');
  await page.getByRole('button', { name: 'Cobre' }).click();
  await page.getByRole('button', { name: 'Guardar identidad' }).click();
  await expect(page.getByText('Identidad actualizada')).toBeVisible();
  const gym = (await catalogOf(account.ownerToken)).gyms[0];
  expect(gym.day_pass_price).toBe('22.50');
  expect(gym.display_name).toBe('Fuerza Total');
  expect(gym.brand_color).toBe('#ad522a');
});

test('the owner resets a receptionist password and deactivates them', async ({ page }) => {
  const account = await createAccount(['Norte', 'Sur'], true);
  const reception = await createStaff(account, 'receptionist', [account.branches[0].id]);
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Usuarios');
  await page.getByRole('button', { name: `Restablecer contraseña de ${reception.name}` }).click();
  await page.getByRole('button', { name: 'Restablecer', exact: true }).click();
  await expect(page.getByText(/Contraseña restablecida/)).toBeVisible();
  await page.getByRole('button', { name: `Desactivar a ${reception.name}` }).click();
  await expect(page.getByText(`${reception.name} fue desactivado.`)).toBeVisible();
});

test('the DNI search fills the name through the API', async ({ page }) => {
  const account = await createAccount();
  await signIn(page, account.ownerDni, PASSWORD);
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Nuevo miembro' }).click();
  await page.getByPlaceholder('8 dígitos').fill(uniqueDni());
  await expect(page.getByPlaceholder('Ej. Andrea García')).toHaveValue('');
  await page.getByRole('button', { name: 'Buscar DNI' }).click();
  await expect(page.getByPlaceholder('Ej. Andrea García')).not.toHaveValue('');
});
