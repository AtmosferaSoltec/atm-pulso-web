const lima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Today's date in Lima as YYYY-MM-DD. Only used to suggest values: the server decides every business date. */
export function todayInLima(now: Date = new Date()): string {
  return lima.format(now);
}

/** The first day of the month of a YYYY-MM-DD date. */
export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}
