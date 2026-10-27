import { useOrganizationCatalog, type Organization, type AccessScope } from '@/features/organization';
import { useState, type FormEvent, type ReactElement } from 'react';
import type { Member } from '@/features/members/types/member.types';
import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
import { EnrollmentFields } from '@/features/members/components/EnrollmentFields';
import { enrollmentEnd, enrollmentLabel, enrollmentTotal } from '@/features/members/services/enrollment';
import { DEMO_DATE } from '@/features/members/services/memberData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
export function MemberForm({ members, member, organization, branchId, onSave, onClose }: { members: Member[]; member?: Member; organization: Organization; branchId: string; onSave: (member: Member) => void; onClose: () => void }): ReactElement {
 const { branchLabel } = useOrganizationCatalog();
 const [error, setError] = useState('');
 const [accessScope, setAccessScope] = useState<AccessScope>(member?.accessScope ?? organization.defaultAccessScope);
 const [terms, setTerms] = useState<EnrollmentTerms>({ quantity: 1, unit: 'months', start: member && member.end > DEMO_DATE ? member.end : DEMO_DATE, amount: 100, discount: 0, method: member?.method ?? 'Yape' });
 function submit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault(); const data = new FormData(event.currentTarget); const dni = member?.dni ?? String(data.get('dni')); const name = member?.name ?? String(data.get('name')).trim();
  if (!member && members.some(item => item.organizationId === organization.id && item.dni === dni)) { setError('Este DNI ya está registrado. Abre su ficha para renovar la membresía.'); return; }
  if (name.length < 3) { setError('Ingresa un nombre válido.'); return; }
  const end = enrollmentEnd(terms);
  if (!end || !Number.isFinite(terms.amount) || terms.amount < 0 || terms.discount < 0 || terms.discount > 100) { setError('Revisa la duración y el importe ingresados.'); return; }
  onSave({ id: member?.id ?? crypto.randomUUID(), name, dni, phone: member?.phone ?? `51${data.get('phone')}`, email: member?.email ?? String(data.get('email')), plan: enrollmentLabel(terms), start: terms.start, end, paid: enrollmentTotal(terms), method: terms.method, agreedAmount: terms.amount, discount: terms.discount, organizationId: organization.id, homeBranchId: member?.homeBranchId ?? branchId, accessScope: organization.crossBranchAccess ? accessScope : 'branch', periods: [...(member ? member.periods ?? [{ start: member.start, end: member.end }] : []), { start: terms.start, end }] });
 }
 return <Dialog title={member ? 'Renovar membresía' : 'Registrar miembro'} onClose={onClose}><p className="muted">{member ? `${member.name} · DNI ${member.dni}` : 'Datos del miembro y condiciones de la inscripción.'}</p><form onSubmit={submit} className="form-grid">{!member && <><label className="full">Nombre completo<Input name="name" placeholder="Ej. Andrea García" required minLength={3} /></label><label>DNI<Input name="dni" placeholder="8 dígitos" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} required /></label><label>Celular (+51)<Input name="phone" placeholder="999999999" inputMode="tel" pattern="9[0-9]{8}" maxLength={9} required /></label><label className="full">Correo electrónico<Input name="email" type="email" placeholder="nombre@correo.com" /></label></>}{member && <p className="notice full">El inicio se propone desde el vencimiento actual si aún está vigente. Puedes modificarlo antes de guardar.</p>}<div className="full enrollment-location"><span>Sede de inscripción</span><strong>{branchLabel(member?.homeBranchId ?? branchId)}</strong></div><label className="full">Acceso de la membresía<select value={organization.crossBranchAccess ? accessScope : 'branch'} disabled={!organization.crossBranchAccess} onChange={event => setAccessScope(event.target.value as AccessScope)}><option value="branch">Solo sede de inscripción</option><option value="gym">Sedes del mismo gimnasio</option><option value="network">Toda la red del propietario</option></select></label><EnrollmentFields value={terms} onChange={setTerms} />{error && <p role="alert" className="error full">{error}</p>}<div className="form-actions full"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">{member ? 'Registrar renovación' : 'Guardar y ver ficha'}</Button></div></form></Dialog>;
}
