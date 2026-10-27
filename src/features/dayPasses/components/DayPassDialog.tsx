import { useState, type FormEvent, type ReactElement } from 'react';
import type { DayPassSale } from '@/features/dayPasses/types/dayPass.types';
import { documentRules, documentTypeOptions, type DocumentType } from '@/config/documentTypes';
import { paymentMethodOptions } from '@/config/paymentMethods';
import { lookupPerson } from '@/services/documentLookup';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { LookupInput } from '@/components/ui/lookup-input';
import { OptionCards } from '@/components/ui/option-cards';
import { formatCurrency } from '@/utils/formatCurrency';

interface DayPassDialogProps {
  price: number;
  branchName: string;
  onConfirm: (sale: DayPassSale) => void;
  onClose: () => void;
}

/** Charges a single entry. Paying is all that is needed; customer data is optional, for future promotions. */
export function DayPassDialog({ price, branchName, onConfirm, onClose }: DayPassDialogProps): ReactElement {
  const [method, setMethod] = useState('Efectivo');
  const [withData, setWithData] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('dni');
  const [document, setDocument] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const rule = documentRules[documentType];

  // MOCKUP: fills the name with fictional data, see src/services/documentLookup.ts.
  async function searchDocument(): Promise<void> {
    setError('');
    setSearching(true);
    const person = await lookupPerson(documentType, document);
    setSearching(false);
    if (!person) return setError(`Ingresa un ${rule.label} válido para buscar.`);
    setName(`${person.firstName} ${person.lastName}`);
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onConfirm({ method, documentType, document, name, phone });
  }

  return (
    <Dialog title="Pase del día" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <div className="day-pass-price full">
          <span>Una entrada · {branchName}</span>
          <strong>{formatCurrency(price)}</strong>
        </div>
        <Field label="Medio de pago" className="full" as="div">
          <OptionCards label="Medio de pago" variant="chip" options={paymentMethodOptions} value={method} onChange={setMethod} />
        </Field>
        <div className="full">
          <Button variant="ghost" aria-expanded={withData} onClick={() => setWithData(!withData)}>
            <Icon name={withData ? 'close' : 'plus'} size={15} /> {withData ? 'Quitar datos del cliente' : 'Agregar datos del cliente (opcional)'}
          </Button>
        </div>
        {withData && (
          <>
            <Field label="Tipo de documento" className="full" as="div">
              <OptionCards
                label="Tipo de documento"
                variant="chip"
                options={documentTypeOptions}
                value={documentType}
                onChange={(type) => {
                  setDocumentType(type);
                  setDocument('');
                }}
              />
            </Field>
            <Field label={rule.label}>
              <LookupInput
                placeholder={rule.placeholder}
                inputMode="numeric"
                pattern={rule.pattern}
                maxLength={rule.maxLength}
                value={document}
                searchLabel={`Buscar ${rule.label}`}
                searching={searching}
                onChange={(event) => setDocument(event.target.value.replace(/\D/g, ''))}
                onSearch={searchDocument}
              />
            </Field>
            <Field label="Celular (+51)">
              <Input inputMode="tel" pattern="9[0-9]{8}" maxLength={9} placeholder="999999999" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="Nombre" className="full">
              <Input placeholder="Ej. Andrea García" value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
          </>
        )}
        {error && (
          <p role="alert" className="error full">
            {error}
          </p>
        )}
        <div className="form-actions full">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Cobrar {formatCurrency(price)}</Button>
        </div>
      </form>
    </Dialog>
  );
}
