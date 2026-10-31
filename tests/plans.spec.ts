import { test, expect } from '@playwright/test';
import { mockBackends } from './support/mocks';
import { navigate, signIn } from './support/ui';

const prices = [{ months: 1, amount: '100.00' }, { months: 3, amount: '270.00' }];

test('Planes y tarifas lists the plans of the gym with their prices', async ({ page }) => {
  await mockBackends(page, { plans: [{ id: 'p1', name: 'Baile', prices }, { id: 'p2', name: 'Todo el gym' }] });
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Planes y tarifas');
  await expect(page.getByRole('heading', { name: 'Planes y tarifas' })).toBeVisible();
  await expect(page.getByText('Baile', { exact: true })).toBeVisible();
  await expect(page.getByText('1 mes · S/ 100.00')).toBeVisible();
  await expect(page.getByText('Sin tarifas')).toBeVisible();
});

test('enrolling asks for the plan only when the gym has more than one active plan', async ({ page }) => {
  await mockBackends(page, { plans: [{ id: 'p1', name: 'Baile', prices }] });
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Nuevo miembro' }).click();
  await expect(page.getByRole('radiogroup', { name: 'Plan' })).toHaveCount(0);
});

test('with two active plans the enrollment form offers the plan selector', async ({ page }) => {
  await mockBackends(page, { plans: [{ id: 'p1', name: 'Baile', prices }, { id: 'p2', name: 'Todo el gym' }] });
  await signIn(page, '74455518', 'Clave12345');
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Nuevo miembro' }).click();
  await expect(page.getByRole('radiogroup', { name: 'Plan' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Todo el gym' })).toBeVisible();
});
