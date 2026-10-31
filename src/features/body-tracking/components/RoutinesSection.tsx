import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useRoutineMutations } from '@/features/body-tracking/hooks/useBodyTracking';
import { RoutineForm } from '@/features/body-tracking/components/RoutineForm';
import { currentRoutine, historyOf } from '@/features/body-tracking/services/routines';
import type { BodyRoutine } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { formatDate } from '@/utils/formatDate';

interface RoutinesSectionProps {
  memberId: string;
  routines: BodyRoutine[];
}

type Mode = { kind: 'idle' } | { kind: 'new' } | { kind: 'edit'; id: string };

/** The routine in force, highlighted, with the history underneath. */
export function RoutinesSection({ memberId, routines }: RoutinesSectionProps): ReactElement {
  const { save, remove } = useRoutineMutations(memberId);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState('');
  const current = currentRoutine(routines);
  const history = historyOf(routines);

  async function act(run: () => Promise<unknown>): Promise<void> {
    try {
      await run();
      setError('');
      setConfirming(null);
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  const done = (): void => setMode({ kind: 'idle' });
  const editing = mode.kind === 'edit' ? routines.find((routine) => routine.id === mode.id) : undefined;

  function card(routine: BodyRoutine, highlight: boolean): ReactElement {
    if (editing?.id === routine.id) return <RoutineForm key={routine.id} memberId={memberId} routine={routine} onDone={done} onCancel={done} />;
    return (
      <article key={routine.id} className={`bt-routine ${highlight ? 'current' : ''}`}>
        <header>
          <span>
            <strong>{routine.title}</strong>
            <small>
              Desde {formatDate(routine.started_on)}
              {routine.is_current && !highlight ? ' · Vigente' : ''}
            </small>
          </span>
          {confirming === routine.id ? (
            <span className="bt-confirm" role="group" aria-label="Confirmar eliminación">
              <small>¿Eliminar?</small>
              <Button variant="secondary" disabled={remove.isPending} onClick={() => void act(() => remove.mutateAsync(routine.id))}>
                Sí, eliminar
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(null)}>
                No
              </Button>
            </span>
          ) : (
            <span className="bt-actions">
              {!routine.is_current && (
                <Button
                  variant="ghost"
                  disabled={save.isPending}
                  onClick={() =>
                    void act(() => save.mutateAsync({ recordId: routine.id, input: { started_on: routine.started_on, title: routine.title, content: routine.content, notes: routine.notes, is_current: true } }))
                  }
                >
                  Marcar vigente
                </Button>
              )}
              <IconButton icon="edit" label={`Editar rutina ${routine.title}`} onClick={() => setMode({ kind: 'edit', id: routine.id })} />
              <IconButton icon="close" label={`Eliminar rutina ${routine.title}`} onClick={() => setConfirming(routine.id)} />
            </span>
          )}
        </header>
        {routine.content && <p className="bt-routine-text">{routine.content}</p>}
        {routine.notes && <small className="bt-note">{routine.notes}</small>}
      </article>
    );
  }

  return (
    <div className="bt-routines">
      <div className="bt-subhead">
        <h4>Rutina</h4>
        {mode.kind !== 'new' && (
          <Button variant="secondary" onClick={() => setMode({ kind: 'new' })}>
            Nueva rutina
          </Button>
        )}
      </div>
      {mode.kind === 'new' && <RoutineForm memberId={memberId} onDone={done} onCancel={done} />}
      {current ? card(current, true) : mode.kind !== 'new' && <p className="muted bt-empty">Sin rutina vigente.</p>}
      {history.length > 0 && (
        <details className="bt-history">
          <summary>Historial de rutinas ({history.length})</summary>
          {history.map((routine) => card(routine, false))}
        </details>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
