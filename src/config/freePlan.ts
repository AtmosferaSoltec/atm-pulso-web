/**
 * Business model: Pulso is free, within limits. Anything beyond them is agreed directly with
 * Atmósfera, which creates (and charges for) the extra gyms or branches. Owners and admins cannot
 * add them on their own.
 */
export const FREE_PLAN = {
  maxGyms: 1,
  maxBranchesPerGym: 1,
} as const;

export interface PlanExtras {
  extraGyms: number;
  extraBranches: number;
}

/** What a client uses beyond the free plan, given how many branches each of its gyms has. */
export function planExtras(branchCountPerGym: number[]): PlanExtras {
  return {
    extraGyms: Math.max(0, branchCountPerGym.length - FREE_PLAN.maxGyms),
    extraBranches: branchCountPerGym.reduce((sum, count) => sum + Math.max(0, count - FREE_PLAN.maxBranchesPerGym), 0),
  };
}

export function hasExtras(extras: PlanExtras): boolean {
  return extras.extraGyms > 0 || extras.extraBranches > 0;
}

/** "2 gimnasios y 1 sede extra". */
export function describeExtras({ extraGyms, extraBranches }: PlanExtras): string {
  const parts = [
    extraGyms > 0 ? `${extraGyms} ${extraGyms === 1 ? 'gimnasio' : 'gimnasios'}` : '',
    extraBranches > 0 ? `${extraBranches} ${extraBranches === 1 ? 'sede' : 'sedes'}` : '',
  ].filter(Boolean);
  return `${parts.join(' y ')} ${extraGyms + extraBranches === 1 ? 'extra' : 'extras'}`;
}

/** The plan in one sentence, for notes shown to the team and to clients. */
export const FREE_PLAN_SUMMARY = `${FREE_PLAN.maxGyms} gimnasio y hasta ${FREE_PLAN.maxBranchesPerGym} ${FREE_PLAN.maxBranchesPerGym === 1 ? 'sede' : 'sedes'} por gimnasio`;
