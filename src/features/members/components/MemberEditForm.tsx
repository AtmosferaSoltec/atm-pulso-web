import { useState, type FormEvent, type ReactElement } from 'react';
import type { Member } from '@/features/members/types/member.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
export function MemberEditForm({ member, onSave, onClose }: { member: Member; onSave: (member: Member) => void; onClose: () => void }): ReactElement {
 const [error, setError] = useState('');
 function submit(event: FormEvent<HTMLFormElement>): void { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name')).trim(); if (name.length < 3) { setError('Ingresa un nombre válido.'); return; } onSave({ ...member, name, phone: `51${data.get('phone')}`, email: String(data.get('email')) }); }
 return <Dialog title="Editar datos del miembro" onClose={onClose}><p className="muted">DNI {member.dni} · Los pagos y la vigencia no se modifican.</p><form className="form-grid" onSubmit={submit}><label className="full">Nombre completo<Input name="name" defaultValue={member.name} minLength={3} required /></label><label className="full">Celular (+51)<Input name="phone" defaultValue={member.phone.slice(2)} pattern="9[0-9]{8}" maxLength={9} required /></label><label className="full">Correo electrónico<Input name="email" type="email" defaultValue={member.email} /></label>{error && <p className="error full" role="alert">{error}</p>}<div className="form-actions full"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar datos</Button></div></form></Dialog>;
}
