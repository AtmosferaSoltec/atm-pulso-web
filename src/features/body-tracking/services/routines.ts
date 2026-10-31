import type { BodyRoutine, BodyRoutineInput } from '@/types/api.types';

export const MAX_TITLE = 80;
export const MAX_CONTENT = 5000;
export const MAX_NOTES = 500;

export interface RoutineFormValues {
  started_on: string;
  title: string;
  content: string;
  notes: string;
  is_current: boolean;
}

export function emptyRoutine(today: string): RoutineFormValues {
  return { started_on: today, title: '', content: '', notes: '', is_current: true };
}

export function formFromRoutine(routine: BodyRoutine): RoutineFormValues {
  return { started_on: routine.started_on, title: routine.title, content: routine.content, notes: routine.notes, is_current: routine.is_current };
}

export type RoutineBuildResult = { ok: true; input: BodyRoutineInput } | { ok: false; error: string };

export function buildRoutineInput(form: RoutineFormValues, today: string): RoutineBuildResult {
  const title = form.title.trim().replace(/\s+/g, ' ');
  if (title === '') return { ok: false, error: 'Ponle un título a la rutina.' };
  if (title.length > MAX_TITLE) return { ok: false, error: `El título admite hasta ${MAX_TITLE} caracteres.` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.started_on)) return { ok: false, error: 'Elige la fecha de inicio.' };
  if (form.started_on > today) return { ok: false, error: 'La fecha de inicio no puede ser futura.' };
  if (form.content.length > MAX_CONTENT) return { ok: false, error: `El contenido admite hasta ${MAX_CONTENT} caracteres.` };
  if (form.notes.length > MAX_NOTES) return { ok: false, error: `Las notas admiten hasta ${MAX_NOTES} caracteres.` };
  return { ok: true, input: { started_on: form.started_on, title, content: form.content.trim(), notes: form.notes.trim(), is_current: form.is_current } };
}

/** The routine in force: the API lists the current ones first, newest start first. */
export function currentRoutine(routines: BodyRoutine[]): BodyRoutine | null {
  return routines.find((routine) => routine.is_current) ?? null;
}

/** Everything that is not the highlighted routine, in the order the API sent. */
export function historyOf(routines: BodyRoutine[]): BodyRoutine[] {
  const current = currentRoutine(routines);
  return routines.filter((routine) => routine.id !== current?.id);
}
