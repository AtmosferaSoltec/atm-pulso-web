/** Rules the member's file and the renewal form share about membership periods. The server decides the real dates. */

export interface PeriodLike {
  plan_id: string;
  /** YYYY-MM-DD. */
  starts_on: string;
  ends_on: string;
}

export type PeriodState = 'ended' | 'current' | 'scheduled';

/** A period is over when its last day (`ends_on`, still covered) is before today; scheduled when it has not begun. */
export function periodState(period: Pick<PeriodLike, 'starts_on' | 'ends_on'>, today: string): PeriodState {
  if (period.ends_on < today) return 'ended';
  if (period.starts_on > today) return 'scheduled';
  return 'current';
}

/** Only a period that has not ended can be corrected (the API refuses the rest with MEMBERSHIP_ENDED). */
export function canAmend(period: Pick<PeriodLike, 'starts_on' | 'ends_on'>, today: string): boolean {
  return periodState(period, today) !== 'ended';
}

export interface RenewalStart {
  /** Where the new period of the plan begins. */
  start: string;
  /** True when the member already holds that plan now or later: buying it again is a renewal that continues it. */
  continues: boolean;
  /** The end of the plan's last period, or null when the member never had it. */
  lastEnd: string | null;
}

/**
 * A renewal of a plan begins the day the member's last period of THAT plan ends (other plans do not matter); with no
 * current or scheduled period of the plan it begins today. The API applies the same rule and refuses an earlier start.
 */
export function renewalStart(periods: PeriodLike[], planId: string, today: string): RenewalStart {
  const ends = periods.filter((period) => period.plan_id === planId).map((period) => period.ends_on);
  const lastEnd = ends.length > 0 ? ends.reduce((latest, end) => (end > latest ? end : latest)) : null;
  const continues = lastEnd !== null && lastEnd > today;
  return { start: continues && lastEnd ? lastEnd : today, continues, lastEnd };
}
