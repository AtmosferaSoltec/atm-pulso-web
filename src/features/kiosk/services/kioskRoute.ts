/** The kiosk is a route of its own, outside the workspace: no sidebar, no navigation. */
export const KIOSK_PATH = '/kiosk';

export function isKioskPath(pathname: string): boolean {
  return pathname.replace(/\/+$/, '') === KIOSK_PATH;
}

function go(path: string): void {
  window.history.pushState({}, '', path);
  // `pushState` does not announce itself; the app listens for this to re-read the address.
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** Opens the kiosk screen (from the "Quiosco" page of the workspace). */
export function openKiosk(): void {
  go(KIOSK_PATH);
}

/** Leaves the kiosk for the normal web. Only called after the exit PIN was accepted. */
export function leaveKiosk(): void {
  go('/');
}
