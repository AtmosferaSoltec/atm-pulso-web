import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import type { Member } from '@/features/members/types/member.types';
import { useMemberMutations } from '@/features/members/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Dialog } from '@/components/ui/dialog';
import { documentLabel } from '@/config/documentTypes';

interface MemberEditFormProps {
  member: Member;
  onSaved: (member: Member) => void;
  onClose: () => void;
}

/** Name and phone only: the document, the payments and the validity are never edited here. */
export function MemberEditForm({ member, onSaved, onClose }: MemberEditFormProps): ReactElement {
  const { update } = useMemberMutations();
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name')).trim();
    if (name.length < 3) {
      setError('Ingresa un nombre válido.');
      return;
    }
    try {
      const updated = await update.mutateAsync({ id: member.id, full_name: name, phone: String(data.get('phone')) });
      onSaved(updated);
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <Dialog title="Editar datos del miembro" onClose={onClose}>
      <p className="muted">{documentLabel(member.document_type, member.document_number)} · Los pagos y la vigencia no se modifican.</p>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <Field label="Nombre completo" required className="full">
          <Input name="name" defaultValue={member.full_name} minLength={3} required />
        </Field>
        <Field label="Celular (+51)" required className="full">
          <Input name="phone" defaultValue={member.phone} pattern="9[0-9]{8}" maxLength={9} required />
        </Field>
        {error && (
          <p className="error full" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions full">
          <small className="required-note">
            <b>*</b> Obligatorio
          </small>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={update.isPending}>
            Guardar datos
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
