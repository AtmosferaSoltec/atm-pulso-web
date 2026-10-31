import type { MembershipPlan } from '@/types/api.types';

/** The plans a sale can choose from: the active ones, in the order the gym set. */
export function sellablePlans(plans: MembershipPlan[]): MembershipPlan[] {
  return plans.filter((plan) => plan.is_active).sort((a, b) => a.position - b.position);
}

/**
 * The plan a sale uses. With exactly one sellable plan there is nothing to choose (the API uses it too, and
 * `plan_id` is optional); with several the person must pick one; with none the API creates the default plan.
 */
export function onlyPlan(plans: MembershipPlan[]): MembershipPlan | null {
  const sellable = sellablePlans(plans);
  return sellable.length === 1 ? sellable[0] : null;
}
