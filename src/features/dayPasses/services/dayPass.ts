import type { Gym } from '@/features/organization';
import type { DayPass } from '@/features/dayPasses/types/dayPass.types';

/** Used until the gym's administrator sets its own price in "Tarifas". */
export const DEFAULT_DAY_PASS_PRICE = 15;

export function dayPassPrice(gym: Pick<Gym, 'dayPassPrice'>): number {
  return gym.dayPassPrice ?? DEFAULT_DAY_PASS_PRICE;
}

export function formatDayPassNumber(sequence: number): string {
  return `D-${String(sequence).padStart(6, '0')}`;
}

/** The next free number given the passes already sold in the account. */
export function nextDayPassNumber(sold: DayPass[]): string {
  const last = Math.max(0, ...sold.map((pass) => Number(pass.receiptNumber.replace(/\D/g, '')) || 0));
  return formatDayPassNumber(last + 1);
}
