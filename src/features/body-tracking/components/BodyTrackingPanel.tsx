import type { ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useHasFeature } from '@/features/gym';
import { useMeasurements, useRoutines } from '@/features/body-tracking/hooks/useBodyTracking';
import { MeasurementForm } from '@/features/body-tracking/components/MeasurementForm';
import { MeasurementList } from '@/features/body-tracking/components/MeasurementList';
import { MeasurementsPdfButton } from '@/features/body-tracking/components/MeasurementsPdfButton';
import { RoutinesSection } from '@/features/body-tracking/components/RoutinesSection';
import { WeightChart } from '@/features/body-tracking/components/WeightChart';
import { weightPoints } from '@/features/body-tracking/services/measurements';
import '@/features/body-tracking/body-tracking.css';

interface BodyTrackingPanelProps {
  memberId: string;
  /** Names the downloaded PDF. */
  memberName: string;
}

/**
 * The body of "Medidas y rutinas" in the member's page. The page mounts it only once the person expands the section:
 * the API logs every read of health data, so mounting (and fetching) IS the read. Never render it folded.
 */
export function BodyTrackingPanel({ memberId, memberName }: BodyTrackingPanelProps): ReactElement | null {
  const enabled = useHasFeature('body_tracking');
  const measurements = useMeasurements(memberId, enabled);
  const routines = useRoutines(memberId, enabled);
  if (!enabled) return null;
  const failure = measurements.error ?? routines.error;
  return (
    <div className="bt-body no-print">
      {failure ? (
        <p role="alert" className="error">
          {describeError(failure)}
        </p>
      ) : !measurements.data || !routines.data ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          {measurements.data.length > 0 && <MeasurementsPdfButton memberId={memberId} memberName={memberName} />}
          <WeightChart points={weightPoints(measurements.data)} />
          <MeasurementForm memberId={memberId} onDone={() => undefined} />
          <MeasurementList memberId={memberId} records={measurements.data} />
          <RoutinesSection memberId={memberId} routines={routines.data} />
          <small className="bt-privacy">Datos de salud: solo los ve el personal del gimnasio y cada consulta queda registrada.</small>
        </>
      )}
    </div>
  );
}
