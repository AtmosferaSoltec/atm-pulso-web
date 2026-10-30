import { useState, type FormEvent, type ReactElement } from 'react';
import { useCurrentUser } from '@/store/authStore';
import { describeError } from '@/config/errorMessages';
import { gymTitle, useUpdateGym } from '@/features/organization';
import { canManageAccount } from '@/features/auth';
import type { CatalogGym } from '@/types/api.types';
import { GymBrand } from '@/features/branding/components/GymBrand';
import { brandTheme } from '@/features/branding/services/brandTheme';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';

const colors = [
  { value: '#17677b', label: 'Petróleo' },
  { value: '#356443', label: 'Bosque' },
  { value: '#234ba3', label: 'Azul' },
  { value: '#7751a3', label: 'Violeta' },
  { value: '#ad522a', label: 'Cobre' },
  { value: '#414951', label: 'Grafito' },
];

interface BrandingPageProps {
  gym: CatalogGym;
}

/** The colour of the gym, shared by all its branches. Its name, logo and branches are set by Atmósfera. */
export function BrandingPage({ gym }: BrandingPageProps): ReactElement {
  const user = useCurrentUser();
  const update = useUpdateGym(gym.id);
  const [color, setColor] = useState(gym.brand_color);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const editable = canManageAccount(user);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editable) return;
    try {
      await update.mutateAsync({ brand_color: color });
      setError('');
      setMessage('Color actualizado en todas las sedes de este gimnasio.');
    } catch (failure) {
      setError(describeError(failure));
      setMessage('');
    }
  }

  return (
    <div className="branding-grid">
      <form className="card branding-form" onSubmit={(event) => void save(event)}>
        <div className="card-heading">
          <h2>Color de {gymTitle(gym)}</h2>
        </div>
        <div className="branding-fields">
          <fieldset className="color-options">
            <legend>Color principal</legend>
            {colors.map((option) => (
              <Button key={option.value} disabled={!editable} variant="secondary" aria-pressed={color === option.value} onClick={() => setColor(option.value)}>
                {option.label}
              </Button>
            ))}
          </fieldset>
          <Field label="Color personalizado" as="div">
            <ColorPicker label="Color personalizado" disabled={!editable} value={color} onChange={setColor} />
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
              <Icon name="check" size={16} /> Guardar color
            </Button>
          )}
        </div>
      </form>
      <section className="card brand-preview tenant-theme" style={brandTheme(color)}>
        <span className="eyebrow">VISTA PREVIA</span>
        <GymBrand name={gymTitle(gym)} logoUrl={gym.logo_url} />
        <div className="brand-preview-nav">
          <span>Resumen</span>
          <span className="selected">Miembros</span>
          <span>Control de acceso</span>
        </div>
        <div className="preview-card">
          <span>Miembros</span>
          <strong>Gestión del gimnasio</strong>
          <span className="preview-action">Nuevo miembro</span>
        </div>
        <small>Tecnología de Atmósfera</small>
      </section>
    </div>
  );
}
