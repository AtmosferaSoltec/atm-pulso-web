import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useMeasurementMutations } from '@/features/body-tracking/hooks/useBodyTracking';
import { buildMeasurementInput, emptyForm, formFromMeasurement, RANGES, type MeasurementFormValues, type ValueField } from '@/features/body-tracking/services/measurements';
import type { BodyMeasurement } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { todayInLima } from '@/utils/limaDate';

const EXTRA_FIELDS: { field: ValueField; label: string; unit: string }[] = [
  { field: 'height_cm', label: 'Altura', unit: 'cm' },
  { field: 'body_fat_pct', label: '% de grasa', unit: '%' },
  { field: 'waist_cm', label: 'Cintura', unit: 'cm' },
  { field: 'chest_cm', label: 'Pecho', unit: 'cm' },
  { field: 'hip_cm', label: 'Cadera', unit: 'cm' },
];

interface MeasurementFormProps {
  memberId: string;
  /** The record being edited; absent for the quick add. */
  record?: BodyMeasurement;
  onDone: () => void;
  onCancel?: () => void;
}

/** Quick add: the date (today) and the weight; everything else is optional and folded away. */
export function MeasurementForm({ memberId, record, onDone, onCancel }: MeasurementFormProps): ReactElement {
  const today = todayInLima();
  const { save } = useMeasurementMutations(memberId);
  const [form, setForm] = useState<MeasurementFormValues>(() => (record ? formFromMeasurement(record) : emptyForm(today)));
  // A record that already carries extra values opens them.
  const [more, setMore] = useState(() => !!record && (EXTRA_FIELDS.some(({ field }) => form[field] !== '') || form.notes !== ''));
  const [error, setError] = useState('');
  // One client id per record: a retry after a lost answer never stores the measurement twice (renewed after each save).
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const set = (patch: Partial<MeasurementFormValues>): void => setForm((current) => ({ ...current, ...patch }));

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const built = buildMeasurementInput(form, today);
    if (!built.ok) {
      setError(built.error);
      return;
    }
    try {
      await save.mutateAsync({ recordId: record?.id, clientId, input: built.input });
      if (!record) {
        setForm(emptyForm(today));
        setMore(false);
        // The next measurement is a new record: it needs its own id.
        setClientId(crypto.randomUUID());
      }
      setError('');
      onDone();
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <form className="bt-form" onSubmit={(event) => void submit(event)} aria-label={record ? 'Editar medición' : 'Nueva medición'}>
      <div className="bt-quick">
        <Field label="Fecha" as="div">
          <DatePicker label="Fecha de la medición" value={form.measured_on} today={today} onChange={(value) => set({ measured_on: value })} />
        </Field>
        <Field label="Peso (kg)">
          <Input inputMode="decimal" placeholder="Ej. 95" autoComplete="off" value={form.weight_kg} onChange={(event) => set({ weight_kg: event.target.value })} />
        </Field>
        <Button type="submit" disabled={save.isPending}>
          {record ? 'Guardar cambios' : 'Guardar'}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
      <button type="button" className="bt-more-toggle" aria-expanded={more} onClick={() => setMore(!more)}>
        {more ? 'Menos datos' : 'Más datos (altura, grasa, cintura…)'}
      </button>
      {more && (
        <div className="bt-extra">
          {EXTRA_FIELDS.map(({ field, label, unit }) => (
            <Field key={field} label={`${label} (${unit})`}>
              <Input
                inputMode="decimal"
                autoComplete="off"
                aria-label={`${label} (${unit})`}
                placeholder={`${RANGES[field].min}–${RANGES[field].max}`}
                value={form[field]}
                onChange={(event) => set({ [field]: event.target.value })}
              />
            </Field>
          ))}
          <Field label="Notas" className="bt-notes-field">
            <Input maxLength={500} placeholder="Ej. en ayunas, con cinta" value={form.notes} onChange={(event) => set({ notes: event.target.value })} />
          </Field>
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
