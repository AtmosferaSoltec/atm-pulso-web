/** The formats every list download offers, in the order of the menu. */
export type DownloadFormat = 'xlsx' | 'csv' | 'pdf';

export interface DownloadOption {
  format: DownloadFormat;
  label: string;
  hint: string;
  badge: string;
}

export const downloadFormats: DownloadOption[] = [
  { format: 'xlsx', label: 'Excel', hint: 'Para filtrar y sumar', badge: 'XLS' },
  { format: 'csv', label: 'CSV', hint: 'Texto separado por comas', badge: 'CSV' },
  { format: 'pdf', label: 'PDF', hint: 'Para imprimir o compartir', badge: 'PDF' },
];

/** "José Ñañez" -> "jose-nanez": ASCII for a file name; empty names give `fallback`. */
export function slugify(text: string, fallback = 'miembro'): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || fallback;
}

/** "pagos" + "2026-11-20" + "xlsx" -> "pagos-2026-11-20.xlsx". */
export function downloadFileName(base: string, day: string, format: DownloadFormat): string {
  return `${base}-${day}.${format}`;
}
