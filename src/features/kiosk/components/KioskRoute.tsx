import { useState, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { brandTheme } from '@/features/branding';
import { gymTitle, useCatalog, useHasFeature } from '@/features/gym';
import { KioskScreen } from '@/features/kiosk/components/KioskScreen';
import { useKioskSettings } from '@/features/kiosk/hooks/useKiosk';
import { leaveKiosk } from '@/features/kiosk/services/kioskRoute';
import { rememberBranch, rememberedBranch } from '@/features/kiosk/services/kioskPreferences';
import { useCurrentUser } from '@/store/authStore';
import '@/features/kiosk/kiosk.css';

function Notice({ title, text, color }: { title: string; text: string; color: string }): ReactElement {
  return (
    <div className="kiosk tenant-theme kiosk-notice" style={brandTheme(color)}>
      <h1>{title}</h1>
      <p>{text}</p>
      <Button onClick={leaveKiosk}>Volver al sistema</Button>
    </div>
  );
}

/**
 * `/kiosk`: full screen, no navigation. It only opens for a gym with the `kiosk` module and a PIN already set;
 * with several branches it asks which one ONCE and remembers it in this device.
 */
export function KioskRoute(): ReactElement {
  const user = useCurrentUser();
  const { gyms, branches } = useCatalog();
  const enabled = useHasFeature('kiosk');
  const settings = useKioskSettings(enabled);
  const gym = gyms[0];
  const options = branches.filter((branch) => branch.accessible);
  const [chosen, setChosen] = useState<string | null>(() => rememberedBranch(user.id));
  const branch = options.find((item) => item.id === chosen) ?? (options.length === 1 ? options[0] : undefined);
  const color = gym?.brand_color ?? '#17677b';

  if (!enabled) return <Notice color={color} title="Quiosco no disponible" text="Tu gimnasio no tiene activado el modo quiosco." />;
  if (settings.isPending) return <div className="kiosk kiosk-notice tenant-theme" style={brandTheme(color)}><p>Cargando…</p></div>;
  if (settings.isError) return <Notice color={color} title="No se pudo abrir el quiosco" text="Revisa la conexión e inténtalo de nuevo." />;
  if (!settings.data.pin_set) {
    return <Notice color={color} title="Falta el PIN de salida" text="El administrador debe definir el PIN de salida en la sección Quiosco antes de usar el modo quiosco." />;
  }
  if (!gym || options.length === 0) return <Notice color={color} title="Sin sedes" text="Esta cuenta no tiene sedes asignadas." />;

  if (!branch) {
    return (
      <div className="kiosk tenant-theme kiosk-notice" style={brandTheme(color)}>
        <h1>¿En qué sede está este quiosco?</h1>
        <p>Se recordará en esta tablet.</p>
        <div className="kiosk-branch-list">
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              className="kiosk-key"
              onClick={() => {
                rememberBranch(user.id, item.id);
                setChosen(item.id);
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <button type="button" className="kiosk-link" onClick={leaveKiosk}>
          Volver al sistema
        </button>
      </div>
    );
  }

  return (
    <div className="tenant-theme kiosk-root" style={brandTheme(color)}>
      <KioskScreen gymName={gymTitle(gym)} logoUrl={gym.logo_url ?? null} branchId={branch.id} branchName={branch.name} onExit={leaveKiosk} />
    </div>
  );
}
