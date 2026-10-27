import { useRef, useState, type ReactElement, type FormEvent } from 'react';
import { Avatar } from '@/features/members';
import { DayPassDialog, type DayPass, type DayPassSale } from '@/features/dayPasses';
import type { AccessEntry, AccessResult, DemoScenario } from '@/features/access/types/access.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/formatCurrency';

/** A DNI has 8 digits; a carné de extranjería up to 12. */
const MAX_DOCUMENT_LENGTH = 12;

interface AccessPageProps {
  readOnly?: boolean;
  entries: AccessEntry[];
  /** DEMO ONLY: shortcuts that verify a document for each kind of outcome. */
  scenarios?: DemoScenario[];
  /** Single-entry sale. Missing when the user cannot sell passes. */
  dayPass?: { price: number; branchName: string; onSell: (sale: DayPassSale) => DayPass | null };
  onCheck: (dni: string) => AccessResult;
}

export function AccessPage({ entries, scenarios = [], dayPass, onCheck, readOnly = false }: AccessPageProps): ReactElement {
  const [dni, setDni] = useState('');
  const [result, setResult] = useState<AccessResult | null>(null);
  const [sellingPass, setSellingPass] = useState(false);
  const dniInput = useRef<HTMLInputElement>(null);

  // Reception types on a numeric keypad: Enter verifies, then the field clears and keeps focus for the next document.
  function verify(value: string): void {
    setResult(onCheck(value));
    setDni('');
    dniInput.current?.focus();
  }

  function sellPass(sale: DayPassSale): void {
    const pass = dayPass?.onSell(sale);
    setSellingPass(false);
    setResult(
      pass
        ? { allowed: true, name: pass.name, reason: `Pase del día ${pass.receiptNumber} cobrado: ${formatCurrency(pass.amount)}. Puede ingresar.` }
        : { allowed: false, reason: 'Operación no disponible.' },
    );
    setDni('');
    dniInput.current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    verify(dni);
  }

  return (
    <div className={readOnly ? 'access-readonly' : 'access-grid'}>
      {!readOnly && (
        <section className="card access-card">
          <span className="large-icon">
            <Icon name="access" size={32} />
          </span>
          <h2>Verificar ingreso</h2>
          <form onSubmit={submit}>
            <Input
              ref={dniInput}
              autoFocus
              autoComplete="off"
              aria-label="Documento del miembro"
              value={dni}
              onChange={(event) => {
                setDni(event.target.value.replace(/\D/g, '').slice(0, MAX_DOCUMENT_LENGTH));
                setResult(null);
              }}
              placeholder="DNI o carné de extranjería"
              inputMode="numeric"
              pattern="[0-9]{8,12}"
              required
              maxLength={MAX_DOCUMENT_LENGTH}
            />
            <Button type="submit">
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
          {dayPass && (
            <div className="day-pass-action">
              <Button variant="secondary" onClick={() => setSellingPass(true)}>
                <Icon name="plus" size={16} /> Pase del día · {formatCurrency(dayPass.price)}
              </Button>
            </div>
          )}
          {scenarios.length > 0 && (
            <div className="demo-examples">
              <span className="demo-badge">Demo · probar un caso</span>
              <div className="demo-buttons">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    className={`status-chip scenario-${scenario.id}`}
                    aria-label={`Probar caso: ${scenario.label}`}
                    title={`${scenario.hint} · ${scenario.dni}`}
                    onClick={() => verify(scenario.dni)}
                  >
                    <i />
                    <span className="status-chip-name">{scenario.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      <section className="card">
        <div className="card-heading">
          <h2>Últimos accesos</h2>
          <span className="live-dot">{entries.length} consultas</span>
        </div>
        <div className="access-log">
          {entries.slice(0, 12).map((entry) => (
            <div className="log-entry" key={entry.id}>
              <Avatar name={entry.name} />
              <div>
                <strong>{entry.name}</strong>
                <small>
                  {entry.allowed ? 'Ingreso permitido' : 'Ingreso denegado'} · {entry.reason}
                </small>
              </div>
              <span>{entry.time}</span>
              <span className={`status-dot ${entry.allowed ? 'allowed' : 'denied'}`} />
            </div>
          ))}
          {entries.length === 0 && (
            <div className="empty">
              <Icon name="access" size={26} />
              <p>Aún no hay consultas.</p>
            </div>
          )}
        </div>
      </section>
      {sellingPass && dayPass && (
        <DayPassDialog price={dayPass.price} branchName={dayPass.branchName} onConfirm={sellPass} onClose={() => setSellingPass(false)} />
      )}
    </div>
  );
}
