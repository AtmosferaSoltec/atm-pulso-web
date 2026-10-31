import { useState, type CSSProperties, type FormEvent, type ReactElement } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCurrentUser } from '@/store/authStore';
import { canManageAccount } from '@/features/auth';
import { describeError } from '@/config/errorMessages';
import { gymTitle, useUpdateGym } from '@/features/gym';
import { PlanDialog } from '@/features/plans/components/PlanDialog';
import { useMembershipPlans, usePlanMutations } from '@/features/plans/hooks/usePlans';
import type { CatalogGym, MembershipPlan } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/formatCurrency';

interface PlansPageProps {
  gym: CatalogGym;
}

function priceSummary(plan: MembershipPlan): string {
  if (plan.prices.length === 0) return 'Sin tarifas';
  return plan.prices.map((price) => `${price.months} ${price.months === 1 ? 'mes' : 'meses'} · ${formatCurrency(price.amount)}`).join('  ·  ');
}

interface PlanCardProps {
  plan: MembershipPlan;
  onEdit: (plan: MembershipPlan) => void;
}

/** One plan; the grip moves it (the list order is the order offered when selling). */
function PlanCard({ plan, onEdit }: PlanCardProps): ReactElement {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: plan.id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li className={`plan-card${isDragging ? ' dragging' : ''}${plan.is_active ? '' : ' inactive'}`} ref={setNodeRef} style={style}>
      <IconButton icon="grip" label={`Mover el plan ${plan.name}`} className="drag-handle" ref={setActivatorNodeRef} {...attributes} {...listeners} />
      <div className="plan-card-body">
        <strong>
          {plan.name}
          {!plan.is_active && <span className="badge expired"><i />Inactivo</span>}
        </strong>
        {plan.description && <small>{plan.description}</small>}
        <small>{priceSummary(plan)}</small>
      </div>
      <IconButton icon="edit" label={`Editar el plan ${plan.name}`} onClick={() => onEdit(plan)} />
    </li>
  );
}

/** Plans and rates a gym's administrator controls: its membership plans with their prices, and the day pass. */
export function PlansPage({ gym }: PlansPageProps): ReactElement {
  const user = useCurrentUser();
  const editable = canManageAccount(user);
  const plans = useMembershipPlans();
  const { update } = usePlanMutations();
  const updateGym = useUpdateGym(gym.id);
  const [dialog, setDialog] = useState<{ plan?: MembershipPlan } | null>(null);
  const [price, setPrice] = useState(gym.day_pass_price);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const list = plans.data ?? [];

  async function movePlan({ active, over }: DragEndEvent): Promise<void> {
    if (!over || active.id === over.id) return;
    const reordered = arrayMove(list, list.findIndex((plan) => plan.id === active.id), list.findIndex((plan) => plan.id === over.id));
    try {
      await Promise.all(reordered.flatMap((plan, index) => (plan.position === index ? [] : [update.mutateAsync({ id: plan.id, changes: { position: index } })])));
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  async function saveDayPass(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const dayPass = Number(price);
    if (price.trim() === '' || !Number.isFinite(dayPass) || dayPass < 0) {
      setError('Ingresa un importe válido para el pase del día.');
      setMessage('');
      return;
    }
    try {
      await updateGym.mutateAsync({ day_pass_price: dayPass.toFixed(2) });
      setError('');
      setMessage('Pase del día actualizado.');
    } catch (failure) {
      setError(describeError(failure));
      setMessage('');
    }
  }

  return (
    <div className="plans-page">
      <section className="card pricing-form">
        <div className="card-heading">
          <h2>Planes de {gymTitle(gym)}</h2>
          {editable && (
            <Button onClick={() => setDialog({})}>
              <Icon name="plus" size={16} /> Nuevo plan
            </Button>
          )}
        </div>
        <div className="pricing-fields">
          {plans.isError && (
            <p role="alert" className="error">
              {describeError(plans.error)}
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void movePlan(event)}>
            <SortableContext items={list.map((plan) => plan.id)} strategy={verticalListSortingStrategy}>
              <ul className="plan-list">
                {list.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onEdit={(chosen) => setDialog({ plan: chosen })} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {!plans.isPending && list.length === 0 && (
            <p className="empty">
              <Icon name="tag" size={20} /> Aún no hay planes. Al inscribir a un miembro se crea el plan «Membresía».
            </p>
          )}
        </div>
      </section>
      <form className="card pricing-form" onSubmit={(event) => void saveDayPass(event)}>
        <div className="card-heading">
          <h2>Pase del día</h2>
        </div>
        <div className="pricing-fields">
          <Field label="Pase del día (S/)" required hint="Una sola entrada, sin membresía.">
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              disabled={!editable}
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setMessage('');
              }}
            />
          </Field>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          {editable && (
            <Button type="submit" disabled={updateGym.isPending}>
              Guardar pase del día
            </Button>
          )}
        </div>
      </form>
      {dialog && <PlanDialog plan={dialog.plan} onClose={() => setDialog(null)} />}
    </div>
  );
}
