import { useRef, useState, type ReactElement, type FormEvent } from 'react';
import { Avatar } from '@/features/members';
import type { AccessEntry, AccessResult } from '@/features/access/types/access.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
export function AccessPage({ entries, onCheck, readOnly = false }: { readOnly?: boolean; entries: AccessEntry[]; onCheck: (dni: string) => AccessResult }): ReactElement {
 const [dni, setDni] = useState(''); const [result, setResult] = useState<AccessResult | null>(null);
 const dniInput = useRef<HTMLInputElement>(null);
 // Reception types on a numeric keypad: Enter verifies, then the field clears and keeps focus for the next DNI.
 function check(event: FormEvent<HTMLFormElement>): void { event.preventDefault(); setResult(onCheck(dni)); setDni(''); dniInput.current?.focus(); }
 return <div className={readOnly ? 'access-readonly' : 'access-grid'}>{!readOnly && <section className="card access-card"><span className="large-icon"><Icon name="access" size={32} /></span><h2>Verificar ingreso</h2><form onSubmit={check}><Input ref={dniInput} autoFocus autoComplete="off" aria-label="DNI del miembro" value={dni} onChange={event => { setDni(event.target.value.replace(/\D/g, '').slice(0,8)); setResult(null); }} placeholder="DNI" inputMode="numeric" pattern="[0-9]{8}" required maxLength={8} /><Button type="submit">Verificar acceso <Icon name="arrow" size={18} /></Button></form>{result && <div role="status" className={`access-result ${result.allowed ? 'allowed' : 'denied'}`}><Icon name={result.allowed ? 'check' : 'close'} size={30} /><h3>{result.allowed ? 'Acceso permitido' : 'Acceso no permitido'}</h3>{result.name && <strong>{result.name}</strong>}<p>{result.reason}</p></div>}</section>}<section className="card"><div className="card-heading"><h2>Últimos accesos</h2><span className="live-dot">{entries.length} consultas</span></div><div className="access-log">{entries.slice(0,12).map(entry => <div className="log-entry" key={entry.id}><Avatar name={entry.name} /><div><strong>{entry.name}</strong><small>{entry.allowed ? 'Ingreso permitido' : 'Ingreso denegado'} · {entry.reason}</small></div><span>{entry.time}</span><span className={`status-dot ${entry.allowed ? 'allowed' : 'denied'}`} /></div>)}{entries.length === 0 && <div className="empty"><Icon name="access" size={26} /><p>Aún no hay consultas.</p></div>}</div></section></div>;
}
