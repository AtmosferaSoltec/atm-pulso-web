import { useOrganizationCatalog, accessScopeOptions, type Organization, type AccessScope } from '@/features/organization';
import { useState, type FormEvent, type ReactElement } from 'react';
import type { Member } from '@/features/members/types/member.types';
import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
import { EnrollmentFields } from '@/features/members/components/EnrollmentFields';
import { enrollmentEnd, enrollmentLabel } from '@/features/members/services/enrollment';
import { DEMO_DATE } from '@/features/members/services/memberData';
import { defaultAccessBranchIds } from '@/features/members/services/memberScope';
import { BranchAccessPicker } from '@/features/members/components/BranchAccessPicker';
import { documentLabel, documentRules, documentTypeOptions, type DocumentType } from '@/config/documentTypes';
import { lookupPerson } from '@/services/documentLookup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { LookupInput } from '@/components/ui/lookup-input';
import { OptionCards, type Option } from '@/components/ui/option-cards';

interface MemberFormProps {
  members: Member[];
  /** When set, the form renews this member instead of enrolling a new one. */
  member?: Member;
  organization: Organization;
  branchId: string;
  onSave: (member: Member) => void;
  onClose: () => void;
}

export function MemberForm({ members, member, organization, branchId, onSave, onClose }: MemberFormProps): ReactElement {
  const { branchLabel, organizationBranches, gyms } = useOrganizationCatalog();
  const accountBranches = organizationBranches(organization.id);
  const homeBranchId = member?.homeBranchId ?? branchId;
  const homeBranch = accountBranches.find((branch) => branch.id === homeBranchId);
  const gymBranches = accountBranches.filter((branch) => branch.gymId === homeBranch?.gymId);
  const [error, setError] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('dni');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [searching, setSearching] = useState(false);
  const [accessScope, setAccessScope] = useState<AccessScope>(member?.accessScope ?? 'branch');
  const [accessBranchIds, setAccessBranchIds] = useState<string[]>(
    () => member?.accessBranchIds ?? defaultAccessBranchIds(member?.accessScope ?? 'branch', homeBranchId, accountBranches),
  );
  const [terms, setTerms] = useState<EnrollmentTerms>({
    months: 1,
    start: member && member.end > DEMO_DATE ? member.end : DEMO_DATE,
    amount: 100,
    method: member?.method ?? 'Yape/Plin',
  });
  const rule = documentRules[documentType];

  const countLabel = (count: number): string => `${count} ${count === 1 ? 'sede' : 'sedes'}`;
  const scopeDescriptions: Record<AccessScope, string> = {
    branch: homeBranch?.name ?? '',
    gym: countLabel(gymBranches.length),
    network: countLabel(accountBranches.length),
  };
  const scopeOptions: Option<AccessScope>[] = accessScopeOptions.map((option) => ({ ...option, description: scopeDescriptions[option.value] }));
  // The gym's administrator decides in "Gimnasios y reglas" whether its members may enter other branches.
  const crossBranch = gyms.find((gym) => gym.id === homeBranch?.gymId)?.branchSharing !== false;
  const pickerBranches = (accessScope === 'gym' ? gymBranches : accountBranches).map((branch) => ({
    id: branch.id,
    label: accessScope === 'gym' ? branch.name : branchLabel(branch.id),
  }));

  function changeScope(scope: AccessScope): void {
    setAccessScope(scope);
    setAccessBranchIds(defaultAccessBranchIds(scope, homeBranchId, accountBranches));
  }

  function changeDocumentType(type: DocumentType): void {
    setDocumentType(type);
    setDocumentNumber('');
    setError('');
  }

  // MOCKUP: fills the name with fictional data, see src/services/documentLookup.ts.
  async function searchDocument(): Promise<void> {
    setError('');
    setSearching(true);
    const person = await lookupPerson(documentType, documentNumber);
    setSearching(false);
    if (!person) {
      setError(`Ingresa un ${rule.label} válido para buscar.`);
      return;
    }
    setFullName(`${person.firstName} ${person.lastName}`);
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const number = member?.dni ?? documentNumber;
    const name = member?.name ?? fullName.trim();
    if (!member && members.some((item) => item.organizationId === organization.id && item.dni === number)) {
      setError('Este documento ya está registrado. Abre su ficha para renovar la membresía.');
      return;
    }
    if (name.length < 3) {
      setError('Ingresa un nombre válido.');
      return;
    }
    const end = enrollmentEnd(terms);
    if (!end || !Number.isFinite(terms.amount) || terms.amount < 0) {
      setError('Revisa la duración y el importe ingresados.');
      return;
    }
    onSave({
      id: member?.id ?? crypto.randomUUID(),
      name,
      dni: number,
      documentType: member?.documentType ?? documentType,
      phone: member?.phone ?? `51${data.get('phone')}`,
      plan: enrollmentLabel(terms),
      start: terms.start,
      end,
      paid: terms.amount,
      method: terms.method,
      organizationId: organization.id,
      homeBranchId,
      accessScope: crossBranch ? accessScope : 'branch',
      accessBranchIds: crossBranch && accessScope !== 'branch' ? Array.from(new Set([homeBranchId, ...accessBranchIds])) : [homeBranchId],
      periods: [...(member ? (member.periods ?? [{ start: member.start, end: member.end }]) : []), { start: terms.start, end }],
    });
  }

  return (
    <Dialog title={member ? 'Renovar membresía' : 'Registrar miembro'} onClose={onClose}>
      <p className="muted">
        {member ? `${member.name} · ${documentLabel(member.documentType, member.dni)}` : 'Datos del miembro y condiciones de la inscripción.'}
      </p>
      <form onSubmit={submit} className="form-grid">
        {!member && (
          <>
            <Field label="Tipo de documento" className="full" as="div">
              <OptionCards label="Tipo de documento" variant="chip" options={documentTypeOptions} value={documentType} onChange={changeDocumentType} />
            </Field>
            <Field label={rule.label} required>
              <LookupInput
                placeholder={rule.placeholder}
                inputMode="numeric"
                pattern={rule.pattern}
                maxLength={rule.maxLength}
                required
                value={documentNumber}
                searchLabel={`Buscar ${rule.label}`}
                searching={searching}
                onChange={(event) => setDocumentNumber(event.target.value.replace(/\D/g, ''))}
                onSearch={searchDocument}
              />
            </Field>
            <Field label="Celular (+51)" required>
              <Input name="phone" placeholder="999999999" inputMode="tel" pattern="9[0-9]{8}" maxLength={9} required />
            </Field>
            <Field label="Nombre completo" required className="full">
              <Input
                placeholder="Ej. Andrea García"
                required
                minLength={3}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </Field>
          </>
        )}
        {member && (
          <p className="notice full">
            El inicio se propone desde el vencimiento actual si aún está vigente. Puedes modificarlo antes de guardar.
          </p>
        )}
        {accountBranches.length > 1 && (
          <Field label="Acceso de la membresía" className="full" as="div">
            <OptionCards
              label="Acceso de la membresía"
              options={scopeOptions}
              value={crossBranch ? accessScope : 'branch'}
              disabled={!crossBranch}
              onChange={changeScope}
            />
            {!crossBranch && <small className="branch-picker-note">El administrador de este gimnasio no permite el acceso entre sedes.</small>}
            {crossBranch && accessScope !== 'branch' && (
              <BranchAccessPicker branches={pickerBranches} selectedIds={accessBranchIds} lockedId={homeBranchId} onChange={setAccessBranchIds} />
            )}
          </Field>
        )}
        <EnrollmentFields value={terms} onChange={setTerms} />
        {error && (
          <p role="alert" className="error full">
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
          <Button type="submit">{member ? 'Registrar renovación' : 'Guardar y ver ficha'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
