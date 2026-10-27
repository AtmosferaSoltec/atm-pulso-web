import type { ReactElement } from 'react';
import { describeExtras, FREE_PLAN_SUMMARY, type PlanExtras } from '@/config/freePlan';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

interface PlanExtraNoticeProps {
  extras: PlanExtras;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}

/** Shown when what is being created goes beyond the free plan: the extra must be agreed (and charged) first. */
export function PlanExtraNotice({ extras, confirmed, onConfirmedChange }: PlanExtraNoticeProps): ReactElement {
  return (
    <div className="plan-extra full" role="note">
      <Icon name="bolt" size={18} />
      <div>
        <strong>Supera el plan gratuito: {describeExtras(extras)}.</strong>
        <p>El plan gratuito incluye {FREE_PLAN_SUMMARY}. Acuerda y cobra el extra con el cliente antes de crearlo.</p>
        <label className="plan-confirm">
          <Input type="checkbox" required checked={confirmed} onChange={(event) => onConfirmedChange(event.target.checked)} />
          Ya lo acordé con el cliente
        </label>
      </div>
    </div>
  );
}
