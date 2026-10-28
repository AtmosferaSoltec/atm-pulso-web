import { useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react';
import { useCurrentUser } from '@/store/authStore';
import { describeError } from '@/config/errorMessages';
import { gymTitle, useGymLogo, useUpdateGym } from '@/features/organization';
import type { CatalogGym } from '@/types/api.types';
import { GymBrand } from '@/features/branding/components/GymBrand';
import { brandTheme } from '@/features/branding/services/brandTheme';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';

const colors = [
  { value: '#17677b', label: 'Petróleo' },
  { value: '#356443', label: 'Bosque' },
  { value: '#234ba3', label: 'Azul' },
  { value: '#7751a3', label: 'Violeta' },
  { value: '#ad522a', label: 'Cobre' },
  { value: '#414951', label: 'Grafito' },
];

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_LOGO_BYTES = 512 * 1024;

interface BrandingPageProps {
  gym: CatalogGym;
}

/** Name, colour and logo of a gym; they apply to all its branches. Only the superadmin sets them. */
export function BrandingPage({ gym }: BrandingPageProps): ReactElement {
  const user = useCurrentUser();
  const update = useUpdateGym(gym.id);
  const logo = useGymLogo(gym.id);
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(gymTitle(gym));
  const [color, setColor] = useState(gym.brand_color);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const editable = user.role === 'superadmin';

  async function changeLogo(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setError('El logo debe ser una imagen PNG, JPG o WebP.');
      setMessage('');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('El logo debe pesar como máximo 512 KB.');
      setMessage('');
      return;
    }
    await sendLogo(file);
  }

  async function sendLogo(file: File | null): Promise<void> {
    try {
      await logo.mutateAsync(file);
      setError('');
      setMessage(file ? 'Logo actualizado.' : 'Logo quitado.');
    } catch (failure) {
      setError(describeError(failure));
      setMessage('');
    }
  }

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editable) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Ingresa un nombre visible.');
      return;
    }
    try {
      await update.mutateAsync({ display_name: trimmed === gym.name ? null : trimmed, brand_color: color });
      setError('');
      setMessage('Identidad actualizada en todas las sedes de este gimnasio.');
    } catch (failure) {
      setError(describeError(failure));
      setMessage('');
    }
  }

  return (
    <div className="branding-grid">
      <form className="card branding-form" onSubmit={(event) => void save(event)}>
        <div className="card-heading">
          <div>
            <h2>Identidad de {gymTitle(gym)}</h2>
            <p>Se aplica a las sedes de este gimnasio.</p>
          </div>
        </div>
        <div className="branding-fields">
          <label>
            Nombre visible
            <Input disabled={!editable} required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="logo-field">
            <GymBrand name={gymTitle(gym)} logoUrl={gym.logo_url} />
            {editable && (
              <span className="logo-actions">
                <input ref={fileInput} type="file" accept={LOGO_TYPES.join(',')} hidden onChange={(event) => void changeLogo(event)} />
                <Button variant="secondary" disabled={logo.isPending} onClick={() => fileInput.current?.click()}>
                  <Icon name="upload" size={16} /> {gym.logo_url ? 'Cambiar logo' : 'Subir logo'}
                </Button>
                {gym.logo_url && <IconButton icon="close" label="Quitar el logo" disabled={logo.isPending} onClick={() => void sendLogo(null)} />}
              </span>
            )}
            <small>PNG, JPG o WebP, hasta 512 KB. Mejor si es cuadrado.</small>
          </div>
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
              Guardar identidad
            </Button>
          )}
        </div>
      </form>
      <section className="card brand-preview tenant-theme" style={brandTheme(color)}>
        <span className="eyebrow">VISTA PREVIA</span>
        <GymBrand name={name.trim() || gymTitle(gym)} logoUrl={gym.logo_url} />
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
        <p>El nombre aparece en la navegación y en las fichas imprimibles. El sistema mantiene un fondo claro.</p>
        <small>Tecnología de Atmósfera</small>
      </section>
    </div>
  );
}
