import { useState, type ReactElement } from 'react';
import { download } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { slugify } from '@/utils/downloadFile';
import { todayInLima } from '@/utils/limaDate';

interface MeasurementsPdfButtonProps {
  memberId: string;
  memberName: string;
}

/** Downloads the member's measurements and progress as a PDF (the API logs it like any other read). */
export function MeasurementsPdfButton({ memberId, memberName }: MeasurementsPdfButtonProps): ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await download(`/members/${memberId}/measurements/pdf`, `medidas-${slugify(memberName)}-${todayInLima()}.pdf`);
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bt-pdf">
      <Button variant="secondary" disabled={busy} title="Descargar las medidas en PDF" onClick={() => void save()}>
        <Icon name="download" size={16} /> {busy ? 'Descargando…' : 'Descargar PDF'}
      </Button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
