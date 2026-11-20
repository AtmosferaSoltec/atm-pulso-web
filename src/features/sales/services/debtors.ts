/** Labels of the debtors list ("Deben"). Pure functions: no network, no React. */

const DAY_MS = 86_400_000;

/** Whole days from one YYYY-MM-DD date to another (0 when the same day, never negative). */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

/** How old the debt is, relative to today (Lima): "hoy", "ayer", "hace 5 días". */
export function debtAge(oldestSoldOn: string, today: string): string {
  const days = daysBetween(oldestSoldOn, today);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

/** "1 venta pendiente" / "3 ventas pendientes". */
export function pendingCountLabel(count: number): string {
  return count === 1 ? '1 venta pendiente' : `${count} ventas pendientes`;
}
