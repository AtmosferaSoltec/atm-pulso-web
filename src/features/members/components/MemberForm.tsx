import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { accessScopeOptions, branchTitle, useCatalog, type AccessScope } from '@/features/gym';
import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
import type { Member } from '@/features/members/types/member.types';
import { EnrollmentFields } from '@/features/members/components/EnrollmentFields';
import { BranchAccessPicker } from '@/features/members/components/BranchAccessPicker';
import { useMemberMutations } from '@/features/members/hooks/useMembers';
import { documentLabel, documentRules, documentTypeOptions, type DocumentType } from '@/config/documentTypes';
import { lookupPerson } from '@/services/documentLookup';
import { todayInLima } from '@/utils/limaDate';
import type { Sale } from '@/types/api.types';
import { uploadVouchers, VoucherPicker } from '@/features/vouchers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { LookupInput } from '@/components/ui/lookup-input';
import { OptionCards, type Option } from '@/components/ui/option-cards';

interface MemberFormProps {
  /** When set, the form renews this member instead of enrolling a new one. */
  member?: Member;
  /** The branch where the user works: where the sale is collected, and the new member's home. */
  branchId: string;
  /** `voucherFailures` is how many proofs of payment could not be uploaded after the sale was saved. */
  onSaved: (sale: Sale, voucherFailures: number) => void;
  onClose: () => void;
}

export function MemberForm({ member, branchId, onSaved, onClose }: MemberFormProps): ReactElement {
  const { branches, gyms } = useCatalog();
  const { enroll, renew } = useMemberMutations();
  const homeBranchId = member?.home_branch.id ?? branchId;
  const homeBranch = branches.find((branch) => branch.id === homeBranchId);
  const gymBranches = branches.filter((branch) => branch.gymId === homeBranch?.gymId);
  const [error, setError] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('dni');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [saleId] = useState(() => crypto.randomUUID());
  const [vouchers, setVouchers] = useState<File[]>([]);
  const [accessScope, setAccessScope] = useState<AccessScope>('branch');
  const [accessBranchIds, setAccessBranchIds] = useState<string[]>([homeBranchId]);
  const today = todayInLima();
  const gymPrices = gyms.find((gym) => gym.id === homeBranch?.gymId)?.membership_prices ?? [];
  const oneMonth = gymPrices.find((price) => price.months === 1);
  const [terms, setTerms] = useState<EnrollmentTerms>({
    months: 1,
    // A hint only: the server starts a renewal where the current period ends, or today.
    start: member && member.ends_on > today ? member.ends_on : today,
    // The gym's one-month price when it has one; otherwise the receptionist types it.
    amount: oneMonth ? Number(oneMonth.amount) : NaN,
    method: 'yape_plin',
  });
  const rule = documentRules[documentType];
  const saving = enroll.isPending || renew.isPending;

  const countLabel = (count: number): string => `${count} ${count === 1 ? 'sede' : 'sedes'}`;
  const scopeDescriptions: Record<AccessScope, string> = {
    branch: homeBranch?.name ?? '',
    gym: countLabel(gymBranches.length),
  };
  const scopeOptions: Option<AccessScope>[] = accessScopeOptions.map((option) => ({ ...option, description: scopeDescriptions[option.value] }));
  // A gym may turn branch sharing off through the API; its members then stay at their own gym.
  const crossBranch = gyms.find((gym) => gym.id === homeBranch?.gymId)?.branch_sharing !== false;
  const pickerBranches = (accessScope === 'gym' ? gymBranches : branches).map((branch) => ({
    id: branch.id,
    label: accessScope === 'gym' ? branch.name : branchTitle(branch),
  }));

  function scopeBranchIds(scope: AccessScope): string[] {
    if (scope === 'branch') return [homeBranchId];
    return (scope === 'gym' ? gymBranches : branches).map((branch) => branch.id);
  }

  function changeScope(scope: AccessScope): void {
    setAccessScope(scope);
    setAccessBranchIds(scopeBranchIds(scope));
  }

  function changeDocumentType(type: DocumentType): void {
    setDocumentType(type);
    setDocumentNumber('');
    setError('');
  }

  async function searchDocument(): Promise<void> {
    setError('');
    setSearching(true);
    try {
      const person = await lookupPerson(documentType, documentNumber);
      if (!person) {
        setError(documentType === 'ce' ? 'El carné de extranjería se escribe a mano.' : 'No se encontraron datos. Escribe el nombre a mano.');
        return;
      }
      setFullName(`${person.firstName} ${person.lastName}`);
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setSearching(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!member && fullName.trim().length < 3) {
      setError('Ingresa un nombre válido.');
      return;
    }
    if (!Number.isInteger(terms.months) || !Number.isFinite(terms.amount) || terms.amount < 0) {
      setError('Revisa la duración y el importe ingresados.');
      return;
    }
    const scope = crossBranch ? accessScope : 'branch';
    const sale = {
      id: saleId,
      branch_id: branchId,
      months: terms.months,
      starts_on: terms.start,
      amount: terms.amount.toFixed(2),
      method: terms.method,
      access_scope: scope,
      access_branch_ids: crossBranch && scope !== 'branch' ? Array.from(new Set([homeBranchId, ...accessBranchIds])) : [homeBranchId],
    };
    try {
      const result = member
        ? await renew.mutateAsync({ memberId: member.id, ...sale })
        : await enroll.mutateAsync({ ...sale, document_type: documentType, document_number: documentNumber, full_name: fullName.trim(), phone });
      const toUpload = terms.method === 'cash' ? [] : vouchers;
      onSaved(result, toUpload.length > 0 ? await uploadVouchers(result.receipt.id, toUpload) : 0);
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <Dialog title={member ? 'Renovar membresía' : 'Registrar miembro'} onClose={onClose}>
      <p className="muted">
        {member ? `${member.full_name} · ${documentLabel(member.document_type, member.document_number)}` : 'Datos del miembro y condiciones de la inscripción.'}
      </p>
      <form onSubmit={(event) => void submit(event)} className="form-grid">
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
                onSearch={() => void searchDocument()}
              />
            </Field>
            <Field label="Celular (+51)" required>
              <Input
                placeholder="999999999"
                inputMode="tel"
                pattern="9[0-9]{8}"
                maxLength={9}
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Field label="Nombre completo" required className="full">
              <Input placeholder="Ej. Andrea García" required minLength={3} value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </Field>
          </>
        )}
        {member && (
          <p className="notice full">El inicio se propone desde el vencimiento actual si aún está vigente. Puedes modificarlo antes de guardar.</p>
        )}
        {branches.length > 1 && (
          <Field label="Acceso de la membresía" className="full" as="div">
            <OptionCards label="Acceso de la membresía" options={scopeOptions} value={crossBranch ? accessScope : 'branch'} disabled={!crossBranch} onChange={changeScope} />
            {!crossBranch && <small className="branch-picker-note">El administrador de este gimnasio no permite el acceso entre sedes.</small>}
            {crossBranch && accessScope !== 'branch' && (
              <BranchAccessPicker branches={pickerBranches} selectedIds={accessBranchIds} lockedId={homeBranchId} onChange={setAccessBranchIds} />
            )}
          </Field>
        )}
        <EnrollmentFields value={terms} onChange={setTerms} prices={gymPrices} />
        {terms.method !== 'cash' && <VoucherPicker files={vouchers} onChange={setVouchers} />}
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
          <Button type="submit" disabled={saving}>
            {member ? 'Registrar renovación' : 'Guardar y ver boleta'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
