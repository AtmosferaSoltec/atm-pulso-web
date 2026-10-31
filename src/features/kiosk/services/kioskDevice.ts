/** Browser features a tablet at the door benefits from. All are optional: each one fails quietly where unsupported. */

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface WakeLockApi {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

/**
 * Keeps the screen on (Wake Lock API) while the kiosk is open, asking again when the tab becomes visible
 * (the browser drops the lock when it is hidden). Returns the function that gives it back.
 */
export function keepScreenOn(): () => void {
  const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
  if (!wakeLock) return () => undefined;
  let sentinel: WakeLockSentinelLike | null = null;
  let stopped = false;
  const acquire = (): void => {
    if (stopped || document.visibilityState !== 'visible') return;
    wakeLock
      .request('screen')
      .then((lock) => {
        if (stopped) void lock.release().catch(() => undefined);
        else sentinel = lock;
      })
      .catch(() => undefined);
  };
  document.addEventListener('visibilitychange', acquire);
  acquire();
  return () => {
    stopped = true;
    document.removeEventListener('visibilitychange', acquire);
    void sentinel?.release().catch(() => undefined);
  };
}

export function canGoFullscreen(): boolean {
  return document.fullscreenEnabled === true;
}

export function isFullscreen(): boolean {
  return document.fullscreenElement !== null;
}

/** Browsers only allow this from a touch or click. */
export function enterFullscreen(): void {
  if (!canGoFullscreen() || isFullscreen()) return;
  void document.documentElement.requestFullscreen().catch(() => undefined);
}

export function exitFullscreen(): void {
  if (isFullscreen()) void document.exitFullscreen().catch(() => undefined);
}

let audio: AudioContext | null = null;

function beep(frequency: number, milliseconds: number, delay = 0): void {
  try {
    audio ??= new AudioContext();
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    // Quiet and short: the door is not a game arcade.
    gain.gain.setValueAtTime(0.06, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + milliseconds / 1000);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + milliseconds / 1000);
  } catch {
    // No audio available.
  }
}

/** A discreet sound and vibration for the answer: one rising tone to come in, two low ones for a refusal. */
export function feedback(kind: 'allowed' | 'denied' | 'error'): void {
  if (kind === 'allowed') {
    beep(880, 160);
    navigator.vibrate?.(60);
  } else {
    beep(330, 140);
    beep(330, 140, 0.2);
    navigator.vibrate?.([80, 60, 80]);
  }
}
