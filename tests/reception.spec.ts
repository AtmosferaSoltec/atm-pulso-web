import { test, expect } from '@playwright/test';
import { createAccount, createStaff, enrollMember, gymId, isoDaysFromToday, PASSWORD, setMembershipPrices, uniqueDni } from './support/api';
import { navigate, signIn } from './support/ui';

test('reception verifies entries on the server and logs them', async ({ page }) => {
  const account = await createAccount(['Norte', 'Sur']);
  const [north, south] = account.branches;
  const reception = await createStaff(account, 'receptionist', [north.id]);
  const valid = await enrollMember(account.ownerToken, north.id, { months: 3, name: 'Socia Vigente' });
  const elsewhere = await enrollMember(account.ownerToken, south.id, { months: 3, name: 'Socia de Sur' });
  const expired = await enrollMember(account.ownerToken, north.id, { months: 1, startsOn: isoDaysFromToday(-90), name: 'Socia Vencida' });

  await signIn(page, reception.dni, PASSWORD);
  // Reception lands on access control; the dashboard does not exist for them.
  await expect(page.getByRole('heading', { name: 'Control de acceso' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Resumen' })).toHaveCount(0);

  const verify = async (dni: string): Promise<void> => {
    await page.getByLabel('Documento del miembro').fill(dni);
    await page.getByRole('button', { name: 'Verificar acceso' }).click();
  };
  await verify(valid.dni);
  await expect(page.getByRole('status').filter({ hasText: 'Acceso permitido' })).toContainText('Socia Vigente');
  await verify(expired.dni);
  await expect(page.getByRole('status').filter({ hasText: 'Acceso no permitido' })).toContainText('La membresía venció el');
  await verify(elsewhere.dni);
  await expect(page.getByRole('status').filter({ hasText: 'Acceso no permitido' })).toContainText('no permite ingresar a esta sede');
  await verify(uniqueDni());
  await expect(page.getByRole('status').filter({ hasText: 'Acceso no permitido' })).toContainText('Documento no registrado');

  await expect(page.locator('.log-entry')).toHaveCount(4);
  await expect(page.getByText('4 consultas')).toBeVisible();
});

test('reception sells a day pass at the gym price and sees payments without KPIs', async ({ page }) => {
  const account = await createAccount(['Central']);
  const reception = await createStaff(account, 'receptionist', [account.branches[0].id]);
  await signIn(page, reception.dni, PASSWORD);
  await page.getByRole('button', { name: /Pase del día · S\/\s*15\.00/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Pase del día' });
  await expect(dialog.getByText('S/ 15.00').first()).toBeVisible();
  await dialog.getByRole('radio', { name: 'Yape/Plin' }).click();
  await dialog.getByRole('button', { name: 'Cobrar S/ 15.00' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Pase del día D-000001 cobrado: S/ 15.00' })).toBeVisible();
  await expect(page.locator('.log-entry').filter({ hasText: 'Pase del día' })).toHaveCount(1);

  await navigate(page, 'Pagos');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByText('D-000001')).toBeVisible();
  await expect(page.getByText('Total cobrado')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Descargar' })).toHaveCount(0);
});

test('reception enrolls only at its own branches and cannot open settings', async ({ page }) => {
  const account = await createAccount(['Norte', 'Sur']);
  await setMembershipPrices(account, [{ months: 1, amount: '100.00' }]);
  const reception = await createStaff(account, 'receptionist', [account.branches[0].id]);
  await signIn(page, reception.dni, PASSWORD);
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Nuevo miembro' }).click();
  await page.getByPlaceholder('8 dígitos').fill(uniqueDni());
  await page.getByPlaceholder('999999999').fill('955444333');
  await page.getByPlaceholder('Ej. Andrea García').fill('Socia Nueva');
  await page.getByRole('button', { name: 'Guardar y ver boleta' }).click();
  await expect(page.getByRole('dialog', { name: 'Boleta de membresía' }).getByText('N.º R-000001')).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Configuración' })).toHaveCount(0);
});

test('an admin manages only receptionists of its gym and cannot appoint admins', async ({ page }) => {
  const account = await createAccount(['Norte', 'Sur']);
  const admin = await createStaff(account, 'admin', [], await gymId(account));
  await signIn(page, admin.dni, PASSWORD);
  await expect(page.getByRole('heading', { name: 'Resumen del gimnasio' })).toBeVisible();
  await navigate(page, 'Usuarios');
  await expect(page.getByText(admin.name)).toBeVisible();
  await expect(page.getByText('Tu cuenta')).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo usuario', exact: true }).click();
  await expect(page.getByRole('radiogroup', { name: 'Rol' })).toHaveCount(0);
  await expect(page.getByText('Puede consultar miembros, inscribir')).toBeVisible();
});
