import { useState, type FormEvent, type ReactElement } from 'react';
import type { Member } from '@/features/members/types/member.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Dialog } from '@/components/ui/dialog';
import { documentLabel } from '@/config/documentTypes';
export function MemberEditForm({ member, onSave, onClose }: { member: Member; onSave: (member: Member) => void; onClose: () => void }): ReactElement {
 const [error, setError] = useState('');
 function submit(event: FormEvent<HTMLFormElement>): void { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name')).trim(); if (name.length < 3) { setError('Ingresa un nombre válido.'); return; } onSave({ ...member, name, phone: `51${data.get('phone')}` }); }
 return <Dialog title="Editar datos del miembro" onClose={onClose}><p className="muted">{documentLabel(member.documentType, member.dni)} · Los pagos y la vigencia no se modifican.</p><form className="form-grid" onSubmit={submit}><Field label="Nombre completo" required className="full"><Input name="name" defaultValue={member.name} minLength={3} required /></Field><Field label="Celular (+51)" required className="full"><Input name="phone" defaultValue={member.phone.slice(2)} pattern="9[0-9]{8}" maxLength={9} required /></Field>{error && <p className="error full" role="alert">{error}</p>}<div className="form-actions full"><small className="required-note"><b>*</b> Obligatorio</small><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar datos</Button></div></form></Dialog>;
}
