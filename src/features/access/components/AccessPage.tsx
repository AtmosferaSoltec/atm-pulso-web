import { useRef, useState, type ReactElement, type FormEvent } from 'react';
import { describeError } from '@/config/errorMessages';
import { Avatar } from '@/features/members';
import { DayPassDialog, useSellDayPass } from '@/features/dayPasses';
import { useAccessCheck, useAccessEvents } from '@/features/access/hooks/useAccess';
import { checkText, eventText, timeInLima } from '@/features/access/services/accessReasons';
import { cleanDocument, MAX_DOCUMENT_LENGTH } from '@/features/access/services/accessDocument';
import type { AccessResult } from '@/features/access/types/access.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/formatCurrency';

interface AccessPageProps {
  branchId: string;
  branchName: string;
  /** The gym's single-entry price ("15.00"). */
  dayPassPrice: string;
  readOnly?: boolean;
}

export function AccessPage({ branchId, branchName, dayPassPrice, readOnly = false }: AccessPageProps): ReactElement {
  const [dni, setDni] = useState('');
  const [result, setResult] = useState<AccessResult | null>(null);
  const [sellingPass, setSellingPass] = useState(false);
  const dniInput = useRef<HTMLInputElement>(null);
  const events = useAccessEvents(branchId);
  const check = useAccessCheck(branchId);
  const sellPass = useSellDayPass(branchId);
  const entries = events.data ?? [];

  // Reception types on a numeric keypad: Enter verifies, then the field clears and keeps focus for the next document.
  async function verify(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const answer = await check.mutateAsync(dni);
      setResult({ allowed: answer.allowed, name: answer.member?.full_name, reason: checkText(answer) });
    } catch (failure) {
      setResult({ allowed: false, reason: describeError(failure) });
    }
    setDni('');
    dniInput.current?.focus();
  }

  async function sell(sale: Parameters<typeof sellPass.mutateAsync>[0]): Promise<void> {
    const pass = await sellPass.mutateAsync(sale);
    setSellingPass(false);
    const lost = pass.voucherFailures > 0 ? ' No se pudo subir el comprobante: súbelo desde Pagos.' : '';
    setResult({ allowed: true, name: pass.visitor_name ?? undefined, reason: `Pase del día ${pass.receipt.number} cobrado: ${formatCurrency(pass.amount)}. Puede ingresar.${lost}` });
    setDni('');
    dniInput.current?.focus();
  }

  return (
    <div className={readOnly ? 'access-readonly' : 'access-grid'}>
      {!readOnly && (
        <section className="card access-card">
          <span className="large-icon">
            <Icon name="access" size={32} />
          </span>
          <h2>Verificar ingreso</h2>
          <form onSubmit={(event) => void verify(event)}>
            <Input
              ref={dniInput}
              autoFocus
              data-document-input
              autoComplete="off"
              aria-label="Documento del miembro"
              value={dni}
              onChange={(event) => {
                setDni(cleanDocument(event.target.value));
                setResult(null);
              }}
              placeholder="DNI o carné de extranjería"
              inputMode="numeric"
              pattern="[0-9]{8,12}"
              required
              maxLength={MAX_DOCUMENT_LENGTH}
            />
            <Button type="submit" disabled={check.isPending}>
              Verificar acceso <Icon name="arrow" size={18} />
            </Button>
          </form>
          {result && (
            <div role="status" className={`access-result ${result.allowed ? 'allowed' : 'denied'}`}>
              <Icon name={result.allowed ? 'check' : 'close'} size={30} />
              <h3>{result.allowed ? 'Acceso permitido' : 'Acceso no permitido'}</h3>
              {result.name && <strong>{result.name}</strong>}
              <p>{result.reason}</p>
            </div>
          )}
          <div className="day-pass-action">
            <Button variant="secondary" onClick={() => setSellingPass(true)}>
              <Icon name="plus" size={16} /> Pase del día · {formatCurrency(dayPassPrice)}
            </Button>
          </div>
        </section>
      )}
      <section className="card">
        <div className="card-heading">
          <h2>Últimos accesos</h2>
          <span className="live-dot">{entries.length} consultas</span>
        </div>
        <div className="access-log">
          {entries.map((entry) => (
            <div className="log-entry" key={entry.id}>
              <Avatar name={entry.display_name} />
              <div>
                <strong>{entry.display_name}</strong>
                <small>
                  {entry.allowed ? 'Ingreso permitido' : 'Ingreso denegado'} · {eventText(entry)}
                </small>
              </div>
              <span>{timeInLima(entry.checked_at)}</span>
              <span className={`status-dot ${entry.allowed ? 'allowed' : 'denied'}`} />
            </div>
          ))}
          {!events.isPending && entries.length === 0 && (
            <div className="empty">
              <Icon name="access" size={26} />
              <p>Aún no hay consultas.</p>
            </div>
          )}
          {events.isPending && <div className="empty">Cargando…</div>}
        </div>
      </section>
      {sellingPass && <DayPassDialog price={dayPassPrice} branchName={branchName} onConfirm={sell} onClose={() => setSellingPass(false)} />}
    </div>
  );
}
