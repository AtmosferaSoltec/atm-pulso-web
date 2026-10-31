import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useRoutineMutations } from '@/features/body-tracking/hooks/useBodyTracking';
import { buildRoutineInput, emptyRoutine, formFromRoutine, MAX_CONTENT, MAX_NOTES, MAX_TITLE, type RoutineFormValues } from '@/features/body-tracking/services/routines';
import type { BodyRoutine } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { OptionCards } from '@/components/ui/option-cards';
import { todayInLima } from '@/utils/limaDate';

interface RoutineFormProps {
  memberId: string;
  routine?: BodyRoutine;
  onDone: () => void;
  onCancel: () => void;
}

/** Create or edit a routine: a title, free text and the date it starts. */
export function RoutineForm({ memberId, routine, onDone, onCancel }: RoutineFormProps): ReactElement {
  const today = todayInLima();
  const { save } = useRoutineMutations(memberId);
  const [form, setForm] = useState<RoutineFormValues>(() => (routine ? formFromRoutine(routine) : emptyRoutine(today)));
  const [error, setError] = useState('');
  const [clientId] = useState(() => crypto.randomUUID());
  const set = (patch: Partial<RoutineFormValues>): void => setForm((current) => ({ ...current, ...patch }));

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const built = buildRoutineInput(form, today);
    if (!built.ok) {
      setError(built.error);
      return;
    }
    try {
      await save.mutateAsync({ recordId: routine?.id, clientId, input: built.input });
      onDone();
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <form className="bt-form bt-routine-form" onSubmit={(event) => void submit(event)} aria-label={routine ? 'Editar rutina' : 'Nueva rutina'}>
      <div className="bt-quick">
        <Field label="Título" required className="bt-grow">
          <Input maxLength={MAX_TITLE} placeholder="Ej. Hipertrofia, 4 días" value={form.title} onChange={(event) => set({ title: event.target.value })} />
        </Field>
        <Field label="Desde" as="div">
          <DatePicker label="Inicio de la rutina" value={form.started_on} today={today} onChange={(value) => set({ started_on: value })} />
        </Field>
      </div>
      <Field label="Rutina">
        <textarea className="input bt-textarea" rows={6} maxLength={MAX_CONTENT} placeholder={'Lunes: sentadilla 4x8, press banca 4x8\nMiércoles: …'} value={form.content} onChange={(event) => set({ content: event.target.value })} />
      </Field>
      <Field label="Notas">
        <Input maxLength={MAX_NOTES} placeholder="Ej. cuidar la rodilla" value={form.notes} onChange={(event) => set({ notes: event.target.value })} />
      </Field>
      <Field label="Vigente" as="div">
        <OptionCards
          label="Vigente"
          variant="chip"
          options={[
            { value: 'yes', label: 'Sí, es la actual' },
            { value: 'no', label: 'No, es historial' },
          ]}
          value={form.is_current ? 'yes' : 'no'}
          onChange={(value) => set({ is_current: value === 'yes' })}
        />
      </Field>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="form-actions">
        <small className="required-note">
          <b>*</b> Obligatorio
        </small>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending}>
          Guardar rutina
        </Button>
      </div>
    </form>
  );
}
