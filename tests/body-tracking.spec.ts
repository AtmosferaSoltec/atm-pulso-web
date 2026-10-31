import { test, expect, type Page, type Route } from '@playwright/test';
import { BRANCH_ID, mockBackends } from './support/mocks';
import { navigate, signIn } from './support/ui';

const API = 'http://api.test';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = (route: Route, status: number, body: unknown): Promise<void> =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

const lima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
const day = (offset: number): string => lima.format(new Date(Date.now() + offset * 86_400_000));

const MEMBER_ID = '00000000-0000-4000-8000-0000000000a1';
const memberView = {
  id: MEMBER_ID,
  document_type: 'dni',
  document_number: '45678912',
  full_name: 'Ana Quispe',
  phone: '999111222',
  home_branch: { id: BRANCH_ID, name: 'Sede Central', gym_name: 'Atlas Fitness' },
  status: 'active',
  days_remaining: 20,
  plan_label: '1 mes',
  plan_names: ['Baile'],
  starts_on: day(-10),
  ends_on: day(20),
  last_receipt: null,
};

type Rec = Record<string, unknown>;
interface Mock {
  measurements: Rec[];
  routines: Rec[];
  /** Every call to the health endpoints, "METHOD path". */
  health: string[];
  bodies: Rec[];
  /** Makes the next write answer this error. */
  failNext?: { status: number; code: string; field?: string };
  /** Makes the reads answer this error. */
  failReads?: { status: number; code: string };
}

const base = (extra: Rec): Rec => ({ member_id: MEMBER_ID, notes: '', created_by: 'u1', created_by_name: 'Ana Admin', created_at: new Date().toISOString(), updated_by: 'u1', updated_by_name: 'Ana Admin', updated_at: new Date().toISOString(), ...extra });
const measurement = (id: string, date: string, weight: number | null, extra: Rec = {}): Rec =>
  base({ id, measured_on: date, weight_kg: weight, height_cm: null, body_fat_pct: null, waist_cm: null, chest_cm: null, hip_cm: null, ...extra });

async function mockHealth(page: Page, seed: { measurements?: Rec[]; routines?: Rec[] } = {}): Promise<Mock> {
  const state: Mock = { measurements: seed.measurements ?? [], routines: seed.routines ?? [], health: [], bodies: [] };
  const sortMeasurements = (): void => {
    state.measurements.sort((a, b) => String(b.measured_on).localeCompare(String(a.measured_on)));
  };
  const sortRoutines = (): void => {
    state.routines.sort((a, b) => Number(b.is_current) - Number(a.is_current) || String(b.started_on).localeCompare(String(a.started_on)));
  };
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = request.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (path === '/members' && method === 'GET') {
      return json(route, 200, { data: [memberView], meta: { page: 1, page_size: 25, total: 1, counts: { all: 1, active: 1, expiring: 0, expired: 0, scheduled: 0 } } });
    }
    if (path === `/members/${MEMBER_ID}` && method === 'GET') return json(route, 200, { data: { ...memberView, memberships: [] } });
    const match = path.match(new RegExp(`^/members/${MEMBER_ID}/(measurements|routines)(?:/([^/]+))?$`));
    if (!match) return route.fallback();
    state.health.push(`${method} ${path.replace(MEMBER_ID, ':member')}`);
    const [, kind, recordId] = match;
    const list = kind === 'measurements' ? state.measurements : state.routines;
    if (method === 'GET') {
      if (state.failReads) return json(route, state.failReads.status, { error: { code: state.failReads.code, message: 'x' } });
      return json(route, 200, { data: list });
    }
    if (state.failNext) {
      const { status, code, field } = state.failNext;
      state.failNext = undefined;
      return json(route, status, { error: { code, message: 'x', ...(field ? { details: [{ field: 'measured_on', code: field }] } : {}) } });
    }
    if (method === 'DELETE') {
      list.splice(0, list.length, ...list.filter((row) => row.id !== recordId));
      return route.fulfill({ status: 204, headers: CORS });
    }
    const body = request.postDataJSON() as Rec;
    state.bodies.push(body);
    if (kind === 'measurements') {
      const row = measurement(recordId ?? String(body.id), String(body.measured_on), (body.weight_kg as number | undefined) ?? null, {
        height_cm: body.height_cm ?? null,
        waist_cm: body.waist_cm ?? null,
        notes: body.notes ?? '',
      });
      if (method === 'PUT') state.measurements = state.measurements.map((existing) => (existing.id === recordId ? row : existing));
      else state.measurements.unshift(row); // newest first within a date, like the API
      sortMeasurements();
      return json(route, method === 'POST' ? 201 : 200, { data: row });
    }
    const row = base({ id: recordId ?? String(body.id), started_on: body.started_on, title: body.title, content: body.content ?? '', is_current: body.is_current ?? true, notes: body.notes ?? '' });
    if (method === 'PUT') state.routines = state.routines.map((existing) => (existing.id === recordId ? row : existing));
    else state.routines.push(row);
    sortRoutines();
    return json(route, method === 'POST' ? 201 : 200, { data: row });
  });
  return state;
}

async function openFile(page: Page, features: string[] = ['body_tracking']): Promise<void> {
  await mockBackends(page, { features });
}

async function openSection(page: Page): Promise<void> {
  await navigate(page, 'Miembros');
  await page.getByRole('button', { name: 'Ver ficha de Ana Quispe' }).click();
}

test('without the module the member file has no health section and never asks for it', async ({ page }) => {
  await openFile(page, []);
  const mock = await mockHealth(page);
  await signIn(page, '74455518', 'Clave12345');
  await openSection(page);
  await expect(page.getByRole('heading', { name: 'Boleta de membresía' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Medidas y rutinas' })).toHaveCount(0);
  expect(mock.health).toEqual([]);
});

test('the section starts folded and reads nothing until it is opened', async ({ page }) => {
  await openFile(page);
  const mock = await mockHealth(page);
  await signIn(page, '74455518', 'Clave12345');
  await openSection(page);
  const toggle = page.getByRole('button', { name: 'Medidas y rutinas' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.waitForTimeout(300);
  expect(mock.health).toEqual([]);
  await toggle.click();
  await expect(page.getByText('Aún no hay mediciones')).toBeVisible();
  await expect(page.getByText('Sin rutina vigente.')).toBeVisible();
  expect(mock.health.sort()).toEqual(['GET /members/:member/measurements', 'GET /members/:member/routines']);
  // Nothing to chart: the module does not get in the way.
  await expect(page.getByTestId('weight-dot')).toHaveCount(0);
});

test('quick add: today by default, one weight field, chart and list follow; edit and delete', async ({ page }) => {
  await openFile(page);
  const mock = await mockHealth(page, { measurements: [measurement('m2', day(-10), 94.2), measurement('m1', day(-30), 95)] });
  await signIn(page, '74455518', 'Clave12345');
  await openSection(page);
  await page.getByRole('button', { name: 'Medidas y rutinas' }).click();
  await expect(page.getByTestId('weight-dot')).toHaveCount(2);

  // Quick add with only the weight; the extra fields are folded away.
  await expect(page.getByLabel('Altura (cm)')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Peso (kg)' }).fill('93,5');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByTestId('weight-dot')).toHaveCount(3);
  expect(mock.bodies[0]).toMatchObject({ measured_on: day(0), weight_kg: 93.5, notes: '' });
  expect(String(mock.bodies[0].id)).toMatch(/^[0-9a-f-]{36}$/);
  expect(mock.bodies[0]).not.toHaveProperty('height_cm');
  await expect(page.getByRole('img', { name: /de 95 a 93,5 kg en 30 días/ })).toBeVisible();
  await expect(page.locator('.bt-chart figcaption')).toContainText('−1,5 kg en 30 días');
  const rows = page.getByRole('list', { name: 'Mediciones' }).getByRole('listitem');
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText('93,5 kg');
  await expect(rows.first()).toContainText('−0,7 kg');
  // The form emptied itself for the next measurement.
  await expect(page.getByRole('textbox', { name: 'Peso (kg)' })).toHaveValue('');

  // Fold-out with more data.
  await page.getByRole('button', { name: /Más datos/ }).click();
  await page.getByLabel('Cintura (cm)').fill('88');
  await page.getByLabel('Notas').fill('en ayunas');
  await page.getByRole('textbox', { name: 'Peso (kg)' }).fill('93');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(rows).toHaveCount(4);
  expect(mock.bodies[1]).toMatchObject({ weight_kg: 93, waist_cm: 88, notes: 'en ayunas' });
  expect(mock.bodies[1].id).not.toBe(mock.bodies[0].id);
  await expect(rows.first()).toContainText('88 cm cintura');

  // Edit replaces the record.
  await rows.first().getByRole('button', { name: /^Editar medición/ }).click();
  const edit = page.getByRole('form', { name: 'Editar medición' });
  await edit.getByRole('textbox', { name: 'Peso (kg)' }).fill('92,8');
  await edit.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(rows.first()).toContainText('92,8 kg');
  expect(mock.health).toContain('PUT /members/:member/measurements/' + String(mock.measurements[0].id));

  // Delete asks first.
  await rows.first().getByRole('button', { name: /^Eliminar medición/ }).click();
  await rows.first().getByRole('button', { name: 'No' }).click();
  await expect(rows).toHaveCount(4);
  await rows.first().getByRole('button', { name: /^Eliminar medición/ }).click();
  await rows.first().getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(rows).toHaveCount(3);
  await expect(page.getByTestId('weight-dot')).toHaveCount(3);
});

test('validation: the form says what to fix before calling, and shows the API codes', async ({ page }) => {
  await openFile(page);
  const mock = await mockHealth(page);
  await signIn(page, '74455518', 'Clave12345');
  await openSection(page);
  await page.getByRole('button', { name: 'Medidas y rutinas' }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Ingresa al menos un valor');
  await page.getByRole('textbox', { name: 'Peso (kg)' }).fill('19');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Peso: ingresa un valor entre 20 y 400');
  await page.getByRole('textbox', { name: 'Peso (kg)' }).fill('80.55');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('un decimal como máximo');
  expect(mock.bodies).toHaveLength(0);
  // A server-side refusal is shown in Spanish.
  await page.getByRole('textbox', { name: 'Peso (kg)' }).fill('80');
  mock.failNext = { status: 400, code: 'VALIDATION_FAILED', field: 'DATE_FUTURE' };
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('La fecha no puede ser futura');
});

test('routines: the current one is highlighted, a new current one goes first, history keeps the rest', async ({ page }) => {
  await openFile(page);
  const mock = await mockHealth(page, {
    routines: [base({ id: 'r1', started_on: day(-40), title: 'Fuerza A', content: 'Sentadilla 4x8', notes: '', is_current: true })],
  });
  await signIn(page, '74455518', 'Clave12345');
  await openSection(page);
  await page.getByRole('button', { name: 'Medidas y rutinas' }).click();
  const current = page.locator('.bt-routine.current');
  await expect(current).toContainText('Fuerza A');
  await expect(current).toContainText('Sentadilla 4x8');

  await page.getByRole('button', { name: 'Nueva rutina' }).click();
  const form = page.getByRole('form', { name: 'Nueva rutina' });
  await form.getByRole('button', { name: 'Guardar rutina' }).click();
  await expect(form.getByRole('alert')).toContainText('Ponle un título');
  await form.getByRole('textbox', { name: 'Título' }).fill('Hipertrofia 4 días');
  await form.getByRole('textbox', { name: 'Rutina' }).fill('Lunes: pecho\nMartes: espalda');
  await form.getByRole('button', { name: 'Guardar rutina' }).click();
  expect(mock.bodies[0]).toMatchObject({ title: 'Hipertrofia 4 días', content: 'Lunes: pecho\nMartes: espalda', is_current: true, started_on: day(0) });
  await expect(page.locator('.bt-routine.current')).toContainText('Hipertrofia 4 días');
  // Both are current; the older one is listed under the history.
  await page.getByText('Historial de rutinas (1)').click();
  await expect(page.locator('.bt-history')).toContainText('Fuerza A');

  // Edit the highlighted one and retire it.
  await page.getByRole('button', { name: 'Editar rutina Hipertrofia 4 días' }).click();
  const edit = page.getByRole('form', { name: 'Editar rutina' });
  await edit.getByRole('radio', { name: 'No, es historial' }).click();
  await edit.getByRole('button', { name: 'Guardar rutina' }).click();
  await expect(page.locator('.bt-routine.current')).toContainText('Fuerza A');
  await expect(page.locator('.bt-history')).toContainText('Hipertrofia 4 días');
  // And bring it back with one click.
  await page.locator('.bt-history').getByRole('button', { name: 'Marcar vigente' }).click();
  await expect(page.locator('.bt-routine.current')).toContainText('Hipertrofia 4 días');

  await page.getByRole('button', { name: 'Eliminar rutina Hipertrofia 4 días' }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(page.locator('.bt-routine.current')).toContainText('Fuerza A');
});

test('a branch the user cannot reach shows the refusal instead of the data', async ({ page }) => {
  await openFile(page);
  const mock = await mockHealth(page);
  mock.failReads = { status: 403, code: 'BRANCH_NOT_ACCESSIBLE' };
  await signIn(page, '74455518', 'Clave12345');
  await openSection(page);
  await page.getByRole('button', { name: 'Medidas y rutinas' }).click();
  await expect(page.getByRole('alert')).toContainText('No tienes acceso a esta sede.');
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toHaveCount(0);
});
