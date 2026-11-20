/** The browser tab is always Pulso's, whatever the gym: the gym's own branding lives inside the app only. */
export const BASE_TITLE = 'Pulso';
export const DEFAULT_TITLE = 'Pulso · Administración de gimnasios';

/** `Pulso` or `Pulso · <page>`; never carries the gym's name. */
export function documentTitle(pageName?: string): string {
  return pageName ? `${BASE_TITLE} · ${pageName}` : BASE_TITLE;
}
