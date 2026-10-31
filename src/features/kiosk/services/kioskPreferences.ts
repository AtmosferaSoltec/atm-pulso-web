/**
 * Per-device conveniences of the tablet, kept in the browser's localStorage: the branch the kiosk works in
 * (asked once) and whether sound is on. Nothing secret lives here: the exit PIN is checked by the API.
 * Every access is guarded: with storage blocked the kiosk still works, it only asks again.
 */
const branchKey = (userId: string): string => `pulso.kiosk.branch.${userId}`;
const SOUND_KEY = 'pulso.kiosk.sound';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked or full: the preference simply is not remembered.
  }
}

export function rememberedBranch(userId: string): string | null {
  return read(branchKey(userId));
}

export function rememberBranch(userId: string, branchId: string | null): void {
  write(branchKey(userId), branchId);
}

export function soundEnabled(): boolean {
  return read(SOUND_KEY) === 'on';
}

export function setSoundEnabled(enabled: boolean): void {
  write(SOUND_KEY, enabled ? 'on' : null);
}
