import { useState, type FormEvent, type ReactElement } from 'react';
import { useAuth } from '@/store/authStore';
import { describeError } from '@/config/errorMessages';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { BrandMark } from '@/components/ui/brand-mark';
import { Icon } from '@/components/ui/icon';

export function LoginPage(): ReactElement {
  const { login, notice } = useAuth();
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    try {
      const user = await login(dni.trim(), password);
      if (!user.must_change_password) window.location.hash = user.role === 'receptionist' ? 'access' : user.role === 'superadmin' ? 'clients' : 'dashboard';
    } catch (failure) {
      setError(describeError(failure));
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-context">
        <a className="brand" href="#login">
          <BrandMark size={50} />
          pulso<span className="brand-dot">.</span>
        </a>
        <span className="login-company">POR ATMÓSFERA</span>
        <div className="login-overview">
          <h1>
            Administra tu gym<br />
            en una <span className="login-accent">sola operación</span>
          </h1>
          <p>Miembros, accesos y pagos de todas tus sedes, en un solo lugar.</p>
        </div>
        <footer className="login-footer">
          <span>Desarrollado por</span>
          <img src="/brand/atmosfera-logo.png" alt="Atmósfera Soluciones Tecnológicas" />
        </footer>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="login-lock">
            <Icon name="shield" size={24} />
          </span>
          <h2>Iniciar sesión</h2>
          <p>Ingresa con tu DNI y contraseña.</p>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <form onSubmit={submit} className="login-form">
            <Field label="DNI">
              <Input
                inputMode="numeric"
                autoComplete="username"
                pattern="[0-9]{8}"
                maxLength={8}
                value={dni}
                onChange={(event) => {
                  setDni(event.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="8 dígitos"
                required
              />
            </Field>
            <Field label="Contraseña">
              <div className="password-field">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <IconButton
                  icon={showPassword ? 'eyeOff' : 'eye'}
                  label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                />
              </div>
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              Ingresar <Icon name="arrow" size={17} />
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
