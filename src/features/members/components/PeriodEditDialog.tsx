import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { EnrollmentFields } from '@/features/members/components/EnrollmentFields';
import { useAmendMembership, useReceipt } from '@/features/members/hooks/useMembers';
import { useMembershipPlans } from '@/features/plans';
import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
import type { MembershipView, PaymentMethod } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface PeriodEditDialogProps {
  memberId: string;
  memberName: string;
  period: MembershipView;
  onClose: () => void;
  onSaved: () => void;
}

/** Corrects a membership period that has not ended: duration, start, amount and payment method. The plan cannot change. */
export function PeriodEditDialog(props: PeriodEditDialogProps): ReactElement {
  // The payment method is on the receipt; the form opens once it is known so it starts from the real value.
  const receipt = useReceipt(props.period.receipt?.id ?? null);
  if (props.period.receipt && !receipt.data) {
    return (
      <Dialog title="Modificar membresía" onClose={props.onClose}>
        {receipt.isError ? (
          <p className="error" role="alert">
            {describeError(receipt.error)}
          </p>
        ) : (
          <p className="muted">Cargando…</p>
        )}
      </Dialog>
    );
  }
  return <PeriodEditForm {...props} method={receipt.data?.payment.method as PaymentMethod | undefined} />;
}

function PeriodEditForm({ memberId, memberName, period, method, onClose, onSaved }: PeriodEditDialogProps & { method?: PaymentMethod }): ReactElement {
  const amend = useAmendMembership();
  const plans = useMembershipPlans();
  const prices = plans.data?.find((plan) => plan.id === period.plan_id)?.prices ?? [];
  const [terms, setTerms] = useState<EnrollmentTerms>({ months: period.months, start: period.starts_on, amount: Number(period.amount), method: method ?? 'cash' });
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!Number.isInteger(terms.months) || !Number.isFinite(terms.amount) || terms.amount < 0) {
      setError('Revisa la duración y el importe ingresados.');
      return;
    }
    try {
      await amend.mutateAsync({
        memberId,
        membershipId: period.id,
        months: terms.months,
        starts_on: terms.start,
        amount: terms.amount.toFixed(2),
        method: terms.method,
      });
      onSaved();
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <Dialog title="Modificar membresía" onClose={onClose}>
      <p className="muted">
        {memberName} · {period.plan_name}
      </p>
      <form onSubmit={(event) => void submit(event)} className="form-grid">
        <p className="notice full">La boleta se corrige con el nuevo importe y fechas (mismo número) y queda registrado quién hizo el cambio.</p>
        <EnrollmentFields value={terms} onChange={setTerms} prices={prices} />
        {error && (
          <p role="alert" className="error full">
            {error}
          </p>
        )}
        <div className="form-actions full">
          <small className="required-note">
            <b>*</b> Obligatorio
          </small>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={amend.isPending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
