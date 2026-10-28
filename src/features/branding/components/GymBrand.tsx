import { useState, type ReactElement } from 'react';
import { apiUrl } from '@/config/apiClient';

interface GymBrandProps {
  /** Visible name of the gym. */
  name: string;
  /** The logo's API path (`logo_url`); without it (or if it fails to load) the monogram is shown. */
  logoUrl?: string | null;
  compact?: boolean;
}

/** The gym's logo, or its monogram, next to its name. */
export function GymBrand({ name, logoUrl, compact = false }: GymBrandProps): ReactElement {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showLogo = !!logoUrl && failedUrl !== logoUrl;
  return (
    <span className={`gym-brand ${compact ? 'compact' : ''}`}>
      {showLogo ? (
        <img src={apiUrl(logoUrl)} alt="" onError={() => setFailedUrl(logoUrl)} />
      ) : (
        <span className="gym-monogram" aria-hidden="true">
          {name.split(' ').map((word) => word[0]).slice(0, 2).join('')}
        </span>
      )}
      <span className="gym-brand-name">{name}</span>
    </span>
  );
}
