import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { accessScopeOptions, branchTitle, useCatalog, type AccessScope } from '@/features/gym';
import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
import type { Member } from '@/features/members/types/member.types';
import { EnrollmentFields } from '@/features/members/components/EnrollmentFields';
import { BranchAccessPicker } from '@/features/members/components/BranchAccessPicker';
import { useMemberDetail, useMemberMutations } from '@/features/members/hooks/useMembers';
import { renewalStart } from '@/features/members/services/renewal';
import { formatDate } from '@/utils/formatDate';
import { documentLabel, documentRules, documentTypeOptions, type DocumentType } from '@/config/documentTypes';
import { sellablePlans, useMembershipPlans } from '@/features/plans';
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
  /** The plan to renew (from a period of the file); otherwise the person picks it when there are several. */
  planId?: string;
  /** The branch where the user works: where the sale is collected, and the new member's home. */
  branchId: string;
  /** `voucherFailures` is how many proofs of payment could not be uploaded after the sale was saved. */
  onSaved: (sale: Sale, voucherFailures: number) => void;
  onClose: () => void;
}

export function MemberForm({ member, planId, branchId, onSaved, onClose }: MemberFormProps): ReactElement {
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
  const plansQuery = useMembershipPlans();
  const plans = sellablePlans(plansQuery.data ?? []);
  // With a single plan there is nothing to choose and the selector stays hidden; with several, the person picks one.
  const [chosenPlanId, setChosenPlanId] = useState(planId ?? '');
  const plan = plans.length === 1 ? plans[0] : plans.find((item) => item.id === chosenPlanId);
  const planPrices = plan?.prices ?? [];
  const [terms, setTerms] = useState<EnrollmentTerms>({
    months: 1,
    // A hint only: the server starts a renewal where the current period ends, or today.
    start: member && member.ends_on > today ? member.ends_on : today,
    // Brought by the plan's price for the duration once a plan is known; otherwise the receptionist types it.
    amount: NaN,
    method: 'yape_plin',
  });
  // Each time the plan in use changes (loaded, or picked) it brings its price for the duration on screen;
  // with no such price the amount stays as it is. Adjusted during render, not in an effect.
  const [pricedFor, setPricedFor] = useState('');
  // A renewal continues the plan: it starts where the member's last period of that plan ends (the API enforces it).
  const detail = useMemberDetail(member?.id ?? null);
  const renewal = member && plan ? renewalStart(detail.data?.memberships ?? [], plan.id, today) : null;
  const [startedFor, setStartedFor] = useState('');
  let nextTerms = terms;
  if (plan && pricedFor !== plan.id) {
    setPricedFor(plan.id);
    const priced = plan.prices.find((price) => price.months === terms.months);
    if (priced) nextTerms = { ...nextTerms, amount: Number(priced.amount) };
  }
  const startKey = renewal ? `${plan?.id}:${detail.isSuccess}` : '';
  if (renewal && startedFor !== startKey) {
    setStartedFor(startKey);
    nextTerms = { ...nextTerms, start: renewal.start };
  }
  if (nextTerms !== terms) setTerms(nextTerms);
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
    if (plans.length > 1 && !plan) {
      setError('Elige el plan de la membresía.');
      return;
    }
    if (renewal?.continues && renewal.lastEnd && terms.start < renewal.start) {
      setError(`${plan?.name ?? 'Este plan'} ya está vigente hasta el ${formatDate(renewal.lastEnd)}. La renovación empieza ese día o después.`);
      return;
    }
    const scope = crossBranch ? accessScope : 'branch';
    const sale = {
      id: saleId,
      branch_id: branchId,
      ...(plans.length > 1 && plan ? { plan_id: plan.id } : {}),
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
        {member && renewal?.continues && renewal.lastEnd && (
          <p className="notice full">
            Renueva {plan?.name}: empieza el {formatDate(renewal.start)}, cuando termina el periodo actual. No puede empezar antes.
          </p>
        )}
        {member && !renewal?.continues && (
          <p className="notice full">{plan ? `${plan.name} no está vigente: la membresía empieza hoy.` : 'El inicio se propone desde hoy.'} Puedes modificarlo antes de guardar.</p>
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
        {plans.length > 1 && (
          <Field label="Plan" required className="full" as="div">
            <OptionCards
              label="Plan"
              variant="chip"
              options={plans.map((item) => ({ value: item.id, label: item.name }))}
              value={plan?.id ?? ''}
              onChange={setChosenPlanId}
            />
          </Field>
        )}
        <EnrollmentFields value={terms} onChange={setTerms} prices={planPrices} />
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
