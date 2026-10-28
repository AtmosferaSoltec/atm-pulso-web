import { useState, type CSSProperties, type FormEvent, type ReactElement } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCurrentUser } from '@/store/authStore';
import { canManageGym } from '@/features/auth';
import { describeError } from '@/config/errorMessages';
import { gymTitle, useUpdateGym } from '@/features/organization';
import { MAX_MONTHS } from '@/features/members/services/enrollment';
import type { CatalogGym, CatalogMembershipPrice } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

interface PricingPageProps {
  gym: CatalogGym;
  readOnly?: boolean;
}

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
  return { prices };
}

interface PriceRowFieldsProps {
  row: PriceRow;
  editable: boolean;
  onChange: (changes: Partial<PriceRow>) => void;
  onRemove: () => void;
}

/** One membership price; the grip moves it, and the list order is the order offered when selling. */
function PriceRowFields({ row, editable, onChange, onRemove }: PriceRowFieldsProps): ReactElement {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: row.key, disabled: !editable });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div className={`price-row${isDragging ? ' dragging' : ''}`} ref={setNodeRef} style={style}>
      {editable && (
        <IconButton
          icon="grip"
          label={`Mover la tarifa de ${row.months || '—'} meses`}
          className="drag-handle"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
        />
      )}
      <Field label="Duración (meses)" required>
        <Input type="number" min="1" max={MAX_MONTHS} step="1" required disabled={!editable} value={row.months} onChange={(event) => onChange({ months: event.target.value })} />
      </Field>
      <Field label="Precio (S/)" required>
        <Input type="number" min="0" step="0.01" required disabled={!editable} value={row.amount} onChange={(event) => onChange({ amount: event.target.value })} />
      </Field>
      {editable && <IconButton icon="close" label={`Quitar la tarifa de ${row.months || '—'} meses`} onClick={onRemove} />}
    </div>
  );
}

/** Prices a gym's administrator controls: the base price of each membership length and the day pass. */
export function PricingPage({ gym, readOnly = false }: PricingPageProps): ReactElement {
  const user = useCurrentUser();
  const update = useUpdateGym(gym.id);
  const [price, setPrice] = useState(gym.day_pass_price);
  const [rows, setRows] = useState<PriceRow[]>(() => toRows(gym.membership_prices));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const editable = !readOnly && canManageGym(user, gym.id);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function moveRow({ active, over }: DragEndEvent): void {
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((row) => row.key === active.id);
    const to = rows.findIndex((row) => row.key === over.id);
    setRows(arrayMove(rows, from, to));
    setMessage('');
  }

  function changeRow(key: string, changes: Partial<PriceRow>): void {
    setRows(rows.map((row) => (row.key === key ? { ...row, ...changes } : row)));
    setMessage('');
  }

  function addRow(): void {
    // Suggests the next whole month not priced yet, so a new row is usually ready to fill in.
    const taken = new Set(rows.map((row) => Number(row.months)));
    let next = 1;
    while (taken.has(next) && next < MAX_MONTHS) next += 1;
    setRows([...rows, { key: crypto.randomUUID(), months: String(next), amount: '' }]);
    setMessage('');
  }

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editable) return;
    const dayPass = Number(price);
    if (price.trim() === '' || !Number.isFinite(dayPass) || dayPass < 0) {
      setError('Ingresa un importe válido para el pase del día.');
      setMessage('');
      return;
    }
    const read = readRows(rows);
    if ('error' in read) {
      setError(read.error);
      setMessage('');
      return;
    }
    try {
      await update.mutateAsync({ day_pass_price: dayPass.toFixed(2), membership_prices: read.prices });
      setRows(toRows(read.prices));
      setError('');
      setMessage('Tarifas actualizadas. Se proponen al inscribir, renovar y cobrar pases del día.');
    } catch (failure) {
      setError(describeError(failure));
      setMessage('');
    }
  }

  return (
    <form className="card pricing-form" onSubmit={(event) => void save(event)}>
      <div className="card-heading">
        <h2>Tarifas de {gymTitle(gym)}</h2>
      </div>
      <div className="pricing-fields">
        <div className="price-rows">
          <h3 className="price-heading">Membresías</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={moveRow}>
            <SortableContext items={rows.map((row) => row.key)} strategy={verticalListSortingStrategy}>
              {rows.map((row) => (
                <PriceRowFields
                  key={row.key}
                  row={row}
                  editable={editable}
                  onChange={(changes) => changeRow(row.key, changes)}
                  onRemove={() => {
                    setRows(rows.filter((item) => item.key !== row.key));
                    setMessage('');
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
          {rows.length === 0 && (
            <p className="empty">
              <Icon name="tag" size={20} /> Aún no hay tarifas. Al inscribir, el importe se escribe a mano.
            </p>
          )}
          {editable && rows.length < MAX_MONTHS && (
            <Button variant="secondary" onClick={addRow}>
              <Icon name="plus" size={16} /> Agregar tarifa
            </Button>
          )}
        </div>
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
          <Button type="submit" disabled={update.isPending}>
            Guardar tarifas
          </Button>
        )}
      </div>
    </form>
  );
}
