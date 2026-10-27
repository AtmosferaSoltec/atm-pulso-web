import type { ReactElement } from 'react';
import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
import { MAX_MONTHS, durationPresets, enrollmentEnd } from '@/features/members/services/enrollment';
import { DEMO_DATE } from '@/features/members/services/memberData';
import { paymentMethodOptions } from '@/config/paymentMethods';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { OptionCards } from '@/components/ui/option-cards';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface EnrollmentFieldsProps {
  value: EnrollmentTerms;
  onChange: (value: EnrollmentTerms) => void;
}

export function EnrollmentFields({ value, onChange }: EnrollmentFieldsProps): ReactElement {
  const end = enrollmentEnd(value);
  return (
    <>
      <div className="form-section full">
        <h3>Duración e importe</h3>
      </div>
      <div className="duration-presets full">
        {durationPresets.map((preset) => (
          <Button
            key={preset.months}
            variant="secondary"
            aria-pressed={value.months === preset.months}
            onClick={() => onChange({ ...value, months: preset.months, amount: preset.amount })}
          >
            {preset.months} {preset.months === 1 ? 'mes' : 'meses'}
            <small>{formatCurrency(preset.amount)}</small>
          </Button>
        ))}
      </div>
      <Field label="Duración (meses)" required>
        <Input
          aria-label="Duración (meses)"
          type="number"
          min="1"
          max={MAX_MONTHS}
          step="1"
          required
          value={value.months || ''}
          onChange={(event) => onChange({ ...value, months: Number(event.target.value) })}
        />
      </Field>
      <Field label="Fecha de inicio" required as="div">
        <DatePicker label="Fecha de inicio" today={DEMO_DATE} value={value.start} onChange={(start) => onChange({ ...value, start })} />
      </Field>
      <Field label="Fecha de vencimiento">
        <Input readOnly value={end ? formatDate(end) : 'Completa la duración y la fecha'} />
      </Field>
      <Field label="Importe (S/)" required>
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
