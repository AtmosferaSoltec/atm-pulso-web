import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { MAX_MONTHS } from '@/features/members/services/enrollment';
import { usePlanMutations } from '@/features/plans/hooks/usePlans';
import type { CatalogMembershipPrice, MembershipPlan } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { OptionCards } from '@/components/ui/option-cards';

/** A price row while it is being edited: both values stay text until saved. */
interface PriceRow {
  key: string;
  months: string;
  amount: string;
}

function toRows(prices: CatalogMembershipPrice[]): PriceRow[] {
  return prices.map((price) => ({ key: crypto.randomUUID(), months: String(price.months), amount: price.amount }));
}

/** Returns the prices ready to send, or an error message in Spanish for the first bad row. */
function readRows(rows: PriceRow[]): { prices: CatalogMembershipPrice[] } | { error: string } {
  const seen = new Set<number>();
  const prices: CatalogMembershipPrice[] = [];
  for (const row of rows) {
    const months = Number(row.months);
    const amount = Number(row.amount);
    if (row.months.trim() === '' || !Number.isInteger(months) || months < 1 || months > MAX_MONTHS) {
      return { error: `La duración debe ser de 1 a ${MAX_MONTHS} meses.` };
    }
    if (row.amount.trim() === '' || !Number.isFinite(amount) || amount < 0) return { error: 'Ingresa un precio válido en cada tarifa.' };
    if (seen.has(months)) return { error: `Hay más de una tarifa de ${months} ${months === 1 ? 'mes' : 'meses'}.` };
    seen.add(months);
    prices.push({ months, amount: amount.toFixed(2) });
  }
  return { prices: prices.sort((a, b) => a.months - b.months) };
}

interface PlanDialogProps {
  /** The plan being edited; absent to create one. */
  plan?: MembershipPlan;
  onClose: () => void;
}

/** Creates or edits a plan: name, optional description, whether it can be sold, and its price per duration. */
export function PlanDialog({ plan, onClose }: PlanDialogProps): ReactElement {
  const { create, update } = usePlanMutations();
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [active, setActive] = useState<'on' | 'off'>(plan && !plan.is_active ? 'off' : 'on');
  const [rows, setRows] = useState<PriceRow[]>(() => toRows(plan?.prices ?? []));
  const [error, setError] = useState('');
  const saving = create.isPending || update.isPending;

  function changeRow(key: string, changes: Partial<PriceRow>): void {
    setRows(rows.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  function addRow(): void {
    // Suggests the next whole month not priced yet, so a new row is usually ready to fill in.
    const taken = new Set(rows.map((row) => Number(row.months)));
    let next = 1;
    while (taken.has(next) && next < MAX_MONTHS) next += 1;
    setRows([...rows, { key: crypto.randomUUID(), months: String(next), amount: '' }]);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const read = readRows(rows);
    if ('error' in read) {
      setError(read.error);
      return;
    }
    const body = { name: name.trim(), description: description.trim() || null, is_active: active === 'on', prices: read.prices };
    try {
      if (plan) await update.mutateAsync({ id: plan.id, changes: body });
      else await create.mutateAsync(body);
      onClose();
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <Dialog title={plan ? 'Editar plan' : 'Nuevo plan'} onClose={onClose}>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <Field label="Nombre del plan" required className="full">
          <Input placeholder="Ej. Baile, Todo el gym" required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Descripción" className="full">
          <Input placeholder="Opcional" maxLength={200} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        {plan && (
          <Field label="Estado" className="full" as="div" hint="Un plan inactivo ya no se ofrece al inscribir o renovar; las membresías vendidas no cambian.">
            <OptionCards
              label="Estado del plan"
              variant="chip"
              options={[
                { value: 'on', label: 'Activo' },
                { value: 'off', label: 'Inactivo' },
              ]}
              value={active}
              onChange={setActive}
            />
          </Field>
        )}
        <div className="form-section full">
          <h3>Tarifas</h3>
        </div>
        <div className="price-rows full">
          {rows.map((row) => (
            <div key={row.key} className="price-row">
              <Field label="Duración (meses)" required>
                <Input type="number" min="1" max={MAX_MONTHS} step="1" required value={row.months} onChange={(event) => changeRow(row.key, { months: event.target.value })} />
              </Field>
              <Field label="Precio (S/)" required>
                <Input type="number" min="0" step="0.01" required value={row.amount} onChange={(event) => changeRow(row.key, { amount: event.target.value })} />
              </Field>
              <IconButton icon="close" label={`Quitar la tarifa de ${row.months || '—'} meses`} onClick={() => setRows(rows.filter((item) => item.key !== row.key))} />
            </div>
          ))}
          {rows.length === 0 && (
            <p className="empty">
              <Icon name="tag" size={20} /> Sin tarifas: al inscribir, el importe se escribe a mano.
            </p>
          )}
          {rows.length < MAX_MONTHS && (
            <Button variant="secondary" onClick={addRow}>
              <Icon name="plus" size={16} /> Agregar tarifa
            </Button>
          )}
        </div>
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
          <Button type="submit" disabled={saving}>
            Guardar plan
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
