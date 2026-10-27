import { useState, type FormEvent, type ReactElement } from 'react';
import type { DemoUser } from '@/features/auth/types/auth.types';
import { demoUsers, DEMO_PASSWORD } from '@/features/auth/services/authData';
import { useDemoStore } from '@/store/demoStore';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { BrandMark } from '@/components/ui/brand-mark';
import { Icon } from '@/components/ui/icon';

const demoRoleLabels = (user: DemoUser): string => {
  if (user.role === 'superadmin') return 'Superadmin · Atmósfera';
  if (user.role === 'receptionist') return 'Recepción · 2 sedes asignadas';
  return user.organizationId === 'central' ? 'Propietario · Una sola sede' : 'Propietario · Red de gimnasios';
};

export function LoginPage({ onLogin }: { onLogin: (user: DemoUser) => void }): ReactElement {
  const { state } = useDemoStore();
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const user =
      password === DEMO_PASSWORD
        ? state.users.find((item) => item.dni === dni.trim() && item.active !== false)
        : undefined;
    if (!user) {
      setError('DNI o contraseña incorrectos. Usa una de las cuentas de prueba.');
      return;
    }
    onLogin(user);
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
                />
              </div>
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit">
              Ingresar <Icon name="arrow" size={17} />
            </Button>
          </form>
          <div className="demo-accounts">
            <span className="eyebrow">CUENTAS FICTICIAS PARA PROBAR</span>
            <p>Selecciona un perfil para completar sus credenciales.</p>
            {demoUsers.map((user) => (
              <Button
                key={user.id}
                variant="secondary"
                className="demo-account"
                onClick={() => {
                  setDni(user.dni);
                  setPassword(DEMO_PASSWORD);
                  setError('');
                }}
              >
                <span>
                  <strong>{demoRoleLabels(user)}</strong>
                  <small>DNI {user.dni}</small>
                </span>
                <Icon name="arrow" size={16} />
              </Button>
            ))}
            <small>Contraseña de prueba: {DEMO_PASSWORD} · Sin registro público.</small>
          </div>
        </div>
      </section>
    </div>
  );
}
