import type { ReactElement } from 'react';
import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
import { MAX_MONTHS, enrollmentEnd } from '@/features/members/services/enrollment';
import { todayInLima } from '@/utils/limaDate';
import { paymentMethodOptions } from '@/config/paymentMethods';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { OptionCards } from '@/components/ui/option-cards';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { CatalogMembershipPrice } from '@/types/api.types';

interface EnrollmentFieldsProps {
  value: EnrollmentTerms;
  onChange: (value: EnrollmentTerms) => void;
  /** The gym's base prices. Only suggestions: the amount typed is what is charged. */
  prices: CatalogMembershipPrice[];
}

export function EnrollmentFields({ value, onChange, prices }: EnrollmentFieldsProps): ReactElement {
  const end = enrollmentEnd(value);
  const base = prices.find((price) => price.months === value.months);
  const baseAmount = base ? Number(base.amount) : undefined;
  const amountHint =
    baseAmount === undefined ? 'Sin tarifa para esta duración.' : value.amount === baseAmount ? `Tarifa: ${formatCurrency(baseAmount)}` : `Tarifa: ${formatCurrency(baseAmount)}. Estás cobrando otro importe.`;
  return (
    <>
      <div className="form-section full">
        <h3>Duración e importe</h3>
      </div>
      {prices.length > 0 && (
        <div className="duration-presets full">
          {prices.map((price) => (
            <Button
              key={price.months}
              variant="secondary"
              aria-pressed={value.months === price.months}
              onClick={() => onChange({ ...value, months: price.months, amount: Number(price.amount) })}
            >
              {price.months} {price.months === 1 ? 'mes' : 'meses'}
              <small>{formatCurrency(Number(price.amount))}</small>
            </Button>
          ))}
        </div>
      )}
      <Field label="Duración (meses)" required>
        <Input
          aria-label="Duración (meses)"
          type="number"
          min="1"
          max={MAX_MONTHS}
          step="1"
          required
          value={value.months || ''}
          onChange={(event) => {
            const months = Number(event.target.value);
            // Typing a priced duration brings its base price; any other keeps the amount as it is.
            const priced = prices.find((price) => price.months === months);
            onChange({ ...value, months, amount: priced ? Number(priced.amount) : value.amount });
          }}
        />
      </Field>
      <Field label="Fecha de inicio" required as="div">
        <DatePicker label="Fecha de inicio" today={todayInLima()} value={value.start} onChange={(start) => onChange({ ...value, start })} />
      </Field>
      <Field label="Fecha de vencimiento">
        <Input readOnly value={end ? formatDate(end) : 'Completa la duración y la fecha'} />
      </Field>
      <Field label="Importe (S/)" required hint={amountHint}>
        <Input
          type="number"
          min="0"
          step="0.01"
          required
          value={Number.isNaN(value.amount) ? '' : value.amount}
          onChange={(event) => onChange({ ...value, amount: event.target.value === '' ? NaN : Number(event.target.value) })}
        />
      </Field>
      <Field label="Medio de pago" className="full" as="div">
        <OptionCards
          label="Medio de pago"
          variant="chip"
          options={paymentMethodOptions}
          value={value.method}
          onChange={(method) => onChange({ ...value, method })}
        />
      </Field>
      <div className="enrollment-total full">
        <span>Total a registrar</span>
        <strong>{Number.isFinite(value.amount) ? formatCurrency(value.amount) : '—'}</strong>
      </div>
    </>
  );
}
