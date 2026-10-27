import { useState, type FormEvent, type ReactElement } from 'react';
import { useDemoStore } from '@/store/demoStore';
import { canManageGym } from '@/features/auth';
import type { Gym } from '@/features/organization';
import { dayPassPrice } from '@/features/dayPasses';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface PricingPageProps {
  gym: Gym;
  readOnly?: boolean;
}

/** Prices a gym's administrator controls. For now only the single-entry pass. */
export function PricingPage({ gym, readOnly = false }: PricingPageProps): ReactElement {
  const { setState, currentUser } = useDemoStore();
  const [price, setPrice] = useState(String(dayPassPrice(gym)));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const editable = !readOnly && canManageGym(currentUser, gym.id);

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!editable) return;
    const value = Number(price);
    if (price.trim() === '' || !Number.isFinite(value) || value < 0) {
      setError('Ingresa un importe válido.');
      setMessage('');
      return;
    }
    setState((current) => ({ ...current, gyms: current.gyms.map((item) => (item.id === gym.id ? { ...item, dayPassPrice: value } : item)) }));
    setError('');
    setMessage('Tarifa actualizada. Se cobra desde Control de acceso.');
  }

  return (
    <form className="card pricing-form" onSubmit={save}>
      <div className="card-heading">
        <h2>Tarifas de {gym.name}</h2>
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
        {editable && <Button type="submit">Guardar tarifas</Button>}
      </div>
    </form>
  );
}
