import { useState, type ReactElement } from 'react';
import { apiUrl } from '@/config/apiClient';
import { logoSource } from '@/features/branding/services/logoSource';

interface GymBrandProps {
  /** Visible name of the gym. */
  name: string;
  /** The temporary link of the logo (`logo_url`); without it (or if it fails to load or has expired) the monogram is shown. */
  logoUrl?: string | null;
  compact?: boolean;
}

/** The gym's logo, or its monogram, next to its name. */
export function GymBrand({ name, logoUrl, compact = false }: GymBrandProps): ReactElement {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const source = logoSource(logoUrl, apiUrl(''));
  const showLogo = source !== null && failedUrl !== source;
  return (
    <span className={`gym-brand ${compact ? 'compact' : ''}`}>
      {showLogo ? (
        <img src={source} alt="" referrerPolicy="no-referrer" onError={() => setFailedUrl(source)} />
      ) : (
        <span className="gym-monogram" aria-hidden="true">
          {name.split(' ').map((word) => word[0]).slice(0, 2).join('')}
        </span>
      )}
      <span className="gym-brand-name">{name}</span>
    </span>
  );
}
