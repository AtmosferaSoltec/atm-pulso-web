import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useHasFeature } from '@/features/gym';
import { useMeasurements, useRoutines } from '@/features/body-tracking/hooks/useBodyTracking';
import { MeasurementForm } from '@/features/body-tracking/components/MeasurementForm';
import { MeasurementList } from '@/features/body-tracking/components/MeasurementList';
import { RoutinesSection } from '@/features/body-tracking/components/RoutinesSection';
import { WeightChart } from '@/features/body-tracking/components/WeightChart';
import { weightPoints } from '@/features/body-tracking/services/measurements';
import { Icon } from '@/components/ui/icon';
import '@/features/body-tracking/body-tracking.css';

interface BodyTrackingPanelProps {
  memberId: string;
}

/**
 * "Medidas y rutinas" in the member's file. Renders nothing when the gym has not switched the module on.
 * It starts folded and loads nothing: the API logs every read of health data, so only an opened section is a read.
 */
export function BodyTrackingPanel({ memberId }: BodyTrackingPanelProps): ReactElement | null {
  const enabled = useHasFeature('body_tracking');
  const [open, setOpen] = useState(false);
  const measurements = useMeasurements(memberId, enabled && open);
  const routines = useRoutines(memberId, enabled && open);
  if (!enabled) return null;
  const failure = measurements.error ?? routines.error;
  return (
    <section className="bt-panel no-print" aria-label="Medidas y rutinas">
      <button type="button" className="bt-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="trend" size={18} />
        <span>Medidas y rutinas</span>
        <span className={`bt-chevron ${open ? 'open' : ''}`}>
          <Icon name="chevron" size={16} />
        </span>
      </button>
      {open && (
        <div className="bt-body">
          {failure ? (
            <p role="alert" className="error">
              {describeError(failure)}
            </p>
          ) : !measurements.data || !routines.data ? (
            <p className="muted">Cargando…</p>
          ) : (
            <>
              <WeightChart points={weightPoints(measurements.data)} />
              <MeasurementForm memberId={memberId} onDone={() => undefined} />
              <MeasurementList memberId={memberId} records={measurements.data} />
              <RoutinesSection memberId={memberId} routines={routines.data} />
              <small className="bt-privacy">Datos de salud: solo los ve el personal del gimnasio y cada consulta queda registrada.</small>
            </>
          )}
        </div>
      )}
    </section>
  );
}
