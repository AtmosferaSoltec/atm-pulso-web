import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useMeasurementMutations } from '@/features/body-tracking/hooks/useBodyTracking';
import { MeasurementForm } from '@/features/body-tracking/components/MeasurementForm';
import { deltasAgainstPrevious, formatDelta, formatNumber, RANGES, VALUE_FIELDS } from '@/features/body-tracking/services/measurements';
import type { BodyMeasurement } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { formatDate } from '@/utils/formatDate';

const SHORT: Record<string, string> = { weight_kg: 'kg', height_cm: 'cm', body_fat_pct: '% grasa', waist_cm: 'cm cintura', chest_cm: 'cm pecho', hip_cm: 'cm cadera' };

interface MeasurementListProps {
  memberId: string;
  records: BodyMeasurement[];
}

/** The measurements, newest first: weight with its change since the previous one, the other values as small chips. */
export function MeasurementList({ memberId, records }: MeasurementListProps): ReactElement {
  const { remove } = useMeasurementMutations(memberId);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState('');
  const deltas = deltasAgainstPrevious(records);

  async function erase(id: string): Promise<void> {
    try {
      await remove.mutateAsync(id);
      setConfirming(null);
      setError('');
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  if (records.length === 0) return <p className="muted bt-empty">Aún no hay mediciones. Registra la primera cuando el entrenador la tome.</p>;
  return (
    <>
      <ul className="bt-list" aria-label="Mediciones">
        {records.map((record) => {
          if (editing === record.id) {
            return (
              <li key={record.id} className="bt-row editing">
                <MeasurementForm memberId={memberId} record={record} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
              </li>
            );
          }
          const delta = deltas.get(record.id);
          const others = VALUE_FIELDS.filter((field) => field !== 'weight_kg' && typeof record[field] === 'number');
          return (
            <li key={record.id} className="bt-row">
              <span className="bt-date">{formatDate(record.measured_on)}</span>
              <span className="bt-values">
                {typeof record.weight_kg === 'number' && (
                  <strong>
                    {formatNumber(record.weight_kg)} kg
                    {delta !== undefined && delta !== 0 && <small className={`bt-delta ${delta < 0 ? 'down' : 'up'}`}>{formatDelta(delta)}</small>}
                  </strong>
                )}
                {others.map((field) => (
                  <span key={field} className="bt-chip" title={RANGES[field].label}>
                    {formatNumber(record[field] as number)} {SHORT[field]}
                  </span>
                ))}
                {record.notes && <small className="bt-note">{record.notes}</small>}
              </span>
              {confirming === record.id ? (
                <span className="bt-confirm" role="group" aria-label="Confirmar eliminación">
                  <small>¿Eliminar?</small>
                  <Button variant="secondary" onClick={() => void erase(record.id)} disabled={remove.isPending}>
                    Sí, eliminar
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirming(null)}>
                    No
                  </Button>
                </span>
              ) : (
                <span className="bt-actions">
                  <IconButton icon="edit" label={`Editar medición del ${formatDate(record.measured_on)}`} onClick={() => setEditing(record.id)} />
                  <IconButton icon="close" label={`Eliminar medición del ${formatDate(record.measured_on)}`} onClick={() => setConfirming(record.id)} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </>
  );
}
