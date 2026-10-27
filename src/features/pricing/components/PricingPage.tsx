import { useState, type FormEvent, type ReactElement } from 'react';
import { useCurrentUser } from '@/store/authStore';
import { canManageGym } from '@/features/auth';
import { describeError } from '@/config/errorMessages';
import { gymTitle, useUpdateGym } from '@/features/organization';
import type { CatalogGym } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface PricingPageProps {
  gym: CatalogGym;
  readOnly?: boolean;
}

/** Prices a gym's administrator controls. For now only the single-entry pass. */
export function PricingPage({ gym, readOnly = false }: PricingPageProps): ReactElement {
  const user = useCurrentUser();
  const update = useUpdateGym(gym.id);
  const [price, setPrice] = useState(gym.day_pass_price);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const editable = !readOnly && canManageGym(user, gym.id);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editable) return;
    const value = Number(price);
    if (price.trim() === '' || !Number.isFinite(value) || value < 0) {
      setError('Ingresa un importe válido.');
      setMessage('');
      return;
    }
    try {
      await update.mutateAsync({ day_pass_price: value.toFixed(2) });
      setError('');
      setMessage('Tarifa actualizada. Se cobra desde Control de acceso.');
    } catch (failure) {
      setError(describeError(failure));
      setMessage('');
    }
  }

  return (
    <form className="card pricing-form" onSubmit={(event) => void save(event)}>
      <div className="card-heading">
        <h2>Tarifas de {gymTitle(gym)}</h2>
      </div>
      <div className="pricing-fields">
        <Field label="Pase del día (S/)" required hint="Una sola entrada, sin membresía.">
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            disabled={!editable}
            value={price}
            onChange={(event) => {
              setPrice(event.target.value);
              setMessage('');
            }}
          />
        </Field>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        {editable && (
          <Button type="submit" disabled={update.isPending}>
            Guardar tarifas
          </Button>
        )}
      </div>
    </form>
  );
}
