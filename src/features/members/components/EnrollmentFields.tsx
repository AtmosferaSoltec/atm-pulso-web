import type { ReactElement } from 'react';
import type { EnrollmentTerms } from '@/features/members/types/enrollment.types';
import { durationPresets, enrollmentEnd, enrollmentTotal } from '@/features/members/services/enrollment';
import { DEMO_DATE } from '@/features/members/services/memberData';
import { paymentMethodOptions } from '@/config/paymentMethods';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { OptionCards, type Option } from '@/components/ui/option-cards';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const unitOptions: Option<EnrollmentTerms['unit']>[] = [
  { value: 'months', label: 'Meses' },
  { value: 'days', label: 'Días' },
];

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
            aria-pressed={value.unit === 'months' && value.quantity === preset.months}
            onClick={() => onChange({ ...value, quantity: preset.months, unit: 'months', amount: preset.amount, discount: 0 })}
          >
            {preset.months} {preset.months === 1 ? 'mes' : 'meses'}
            <small>{formatCurrency(preset.amount)}</small>
          </Button>
        ))}
      </div>
      <Field label="Duración" required>
        <Input
          aria-label="Duración"
          type="number"
          min="1"
          max={value.unit === 'months' ? 24 : 730}
          step="1"
          required
          value={value.quantity || ''}
          onChange={(event) => onChange({ ...value, quantity: Number(event.target.value) })}
        />
      </Field>
      <Field label="Unidad" as="div">
        <OptionCards
          label="Unidad"
          variant="chip"
          options={unitOptions}
          value={value.unit}
          onChange={(unit) => onChange({ ...value, unit })}
        />
      </Field>
      <Field label="Fecha de inicio" required as="div">
        <DatePicker label="Fecha de inicio" today={DEMO_DATE} value={value.start} onChange={(start) => onChange({ ...value, start })} />
      </Field>
      <Field label="Fecha de vencimiento">
        <Input readOnly value={end ? formatDate(end) : 'Completa la duración y la fecha'} />
      </Field>
      <Field label="Importe acordado (S/)" required hint="Importe total por todo el período.">
        <Input
          type="number"
          min="0"
          step="0.01"
          required
          value={Number.isNaN(value.amount) ? '' : value.amount}
          onChange={(event) => onChange({ ...value, amount: event.target.value === '' ? NaN : Number(event.target.value) })}
        />
      </Field>
      <Field label="Descuento (%)" hint="Déjalo en 0 si ya acordaste el precio final.">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={value.discount}
          onChange={(event) => onChange({ ...value, discount: Number(event.target.value) })}
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
        <div>
          <span>Total a registrar</span>
          <small>{value.discount > 0 ? `Descuento aplicado: ${value.discount}%` : 'Sin descuento adicional'}</small>
        </div>
        <strong>{Number.isFinite(value.amount) ? formatCurrency(enrollmentTotal(value)) : '—'}</strong>
      </div>
    </>
  );
}
